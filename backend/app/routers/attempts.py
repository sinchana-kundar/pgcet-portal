from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_admin_user, get_current_user
from app.database import get_db
from app.models.attempt import Attempt, AttemptAnswer
from app.models.user import User
from app.schemas.attempt import (
    AttemptHistoryItem,
    AttemptResultResponse,
    QuestionReviewItem,
    SubmitAttemptRequest,
)

router = APIRouter(tags=["Attempts & Scoring"])


@router.get("/admin/attempts/count", tags=["Admin - Attempts"])
def get_attempts_count(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """Retrieve total count of student mock test attempts (Admin only)."""
    return {"total": db.query(Attempt).count()}


@router.post("/attempts/{attempt_id}/submit", response_model=AttemptResultResponse)
def submit_attempt(
    attempt_id: int,
    payload: SubmitAttemptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit answers for an active attempt, grade responses, and return the scored breakdown."""
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found",
        )

    # Enforce ownership: student can only submit their own attempt
    if attempt.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You cannot submit an attempt that does not belong to you.",
        )

    # Disallow resubmission
    if attempt.submitted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This attempt has already been submitted and finalized.",
        )

    mock_test = attempt.mock_test
    if not mock_test:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Associated mock test could not be resolved.",
        )

    # Map user-submitted answers by question_id
    submitted_map = {item.question_id: item.selected_option for item in payload.answers}

    score = 0.0
    breakdown = []
    test_questions = mock_test.questions

    for q in test_questions:
        raw_choice = submitted_map.get(q.id)
        clean_choice = raw_choice.strip().upper() if raw_choice and raw_choice.strip() else None
        if clean_choice and clean_choice not in {"A", "B", "C", "D"}:
            clean_choice = None

        is_correct = (clean_choice == q.correct_option.strip().upper()) if clean_choice else False
        if is_correct:
            score += 1.0

        # Persist answer record
        attempt_answer = AttemptAnswer(
            attempt_id=attempt.id,
            question_id=q.id,
            selected_option=clean_choice,
            is_correct=is_correct,
        )
        db.add(attempt_answer)

        # Include in full review
        breakdown.append(
            QuestionReviewItem(
                question_id=q.id,
                question_text=q.question_text,
                option_a=q.option_a,
                option_b=q.option_b,
                option_c=q.option_c,
                option_d=q.option_d,
                selected_option=clean_choice,
                correct_option=q.correct_option,
                is_correct=is_correct,
                explanation=q.explanation,
            )
        )

    total_questions = len(test_questions)
    percentage = round((score / total_questions) * 100, 2) if total_questions > 0 else 0.0
    submitted_time = datetime.now(timezone.utc)

    attempt.score = score
    attempt.submitted_at = submitted_time
    db.commit()
    db.refresh(attempt)

    return AttemptResultResponse(
        attempt_id=attempt.id,
        mock_test_id=mock_test.id,
        mock_test_title=mock_test.title,
        score=score,
        total_questions=total_questions,
        percentage=percentage,
        started_at=attempt.started_at,
        submitted_at=submitted_time,
        breakdown=breakdown,
    )


@router.get("/attempts/me", response_model=List[AttemptHistoryItem])
def get_my_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve attempt history for the currently logged-in student only."""
    attempts = (
        db.query(Attempt)
        .filter(Attempt.user_id == current_user.id)
        .order_by(Attempt.started_at.desc())
        .all()
    )

    history = []
    for att in attempts:
        total_q = att.mock_test.total_questions if att.mock_test else 0
        percentage = round((att.score / total_q) * 100, 2) if total_q > 0 else 0.0
        history.append(
            AttemptHistoryItem(
                attempt_id=att.id,
                mock_test_id=att.mock_test_id,
                mock_test_title=att.mock_test.title if att.mock_test else "Unknown",
                subject=att.mock_test.subject if att.mock_test else "Unknown",
                score=att.score,
                total_questions=total_q,
                percentage=percentage,
                started_at=att.started_at,
                submitted_at=att.submitted_at,
            )
        )

    return history


@router.get("/attempts/{attempt_id}", response_model=AttemptResultResponse)
def get_attempt_detail(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve full review and answers for a past attempt (Owner student or admin only)."""
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found",
        )

    # Only owner or admin can review
    if attempt.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only view your own attempt reviews.",
        )

    if attempt.submitted_at is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This test attempt has not been submitted yet.",
        )

    mock_test = attempt.mock_test
    answers_map = {ans.question_id: ans for ans in attempt.answers}

    breakdown = []
    test_questions = mock_test.questions if mock_test else []
    for q in test_questions:
        user_ans = answers_map.get(q.id)
        selected = user_ans.selected_option if user_ans else None
        is_corr = user_ans.is_correct if user_ans else False
        breakdown.append(
            QuestionReviewItem(
                question_id=q.id,
                question_text=q.question_text,
                option_a=q.option_a,
                option_b=q.option_b,
                option_c=q.option_c,
                option_d=q.option_d,
                selected_option=selected,
                correct_option=q.correct_option,
                is_correct=is_corr,
                explanation=q.explanation,
            )
        )

    total_questions = len(test_questions)
    percentage = round((attempt.score / total_questions) * 100, 2) if total_questions > 0 else 0.0

    return AttemptResultResponse(
        attempt_id=attempt.id,
        mock_test_id=attempt.mock_test_id,
        mock_test_title=mock_test.title if mock_test else "Unknown",
        score=attempt.score,
        total_questions=total_questions,
        percentage=percentage,
        started_at=attempt.started_at,
        submitted_at=attempt.submitted_at,
        breakdown=breakdown,
    )
