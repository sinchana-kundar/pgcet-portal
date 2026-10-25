from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_admin_user, get_current_user
from app.database import get_db
from app.models.mock_test import MockTest
from app.models.question import Question
from app.models.attempt import Attempt
from app.models.user import User
from app.schemas.mock_test import (
    MockTestCreate,
    MockTestDetailResponse,
    MockTestResponse,
)
from app.schemas.attempt import StartAttemptResponse

router = APIRouter(tags=["Mock Tests"])


@router.post(
    "/admin/mock-tests",
    response_model=MockTestResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Admin - Mock Tests"],
)
def create_mock_test(
    payload: MockTestCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """Create a new mock test and attach questions from the question bank (Admin only)."""
    # Fetch questions by provided IDs
    questions = db.query(Question).filter(Question.id.in_(payload.question_ids)).all()
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="None of the specified question_ids exist in the question bank.",
        )

    mock_test = MockTest(
        title=payload.title.strip(),
        subject=payload.subject.strip(),
        duration_minutes=payload.duration_minutes,
        total_questions=len(questions),
    )
    mock_test.questions = questions

    db.add(mock_test)
    db.commit()
    db.refresh(mock_test)
    return mock_test


@router.get("/mock-tests", response_model=List[MockTestResponse])
def get_mock_tests(db: Session = Depends(get_db)):
    """List all available mock tests (Title, subject, duration, and question count)."""
    return db.query(MockTest).order_by(MockTest.id.desc()).all()


@router.get("/mock-tests/{id}", response_model=MockTestDetailResponse)
def get_mock_test_detail(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve mock test details and questions (Without answers or explanations to prevent cheating)."""
    mock_test = db.query(MockTest).filter(MockTest.id == id).first()
    if not mock_test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock test not found",
        )

    return mock_test


@router.post(
    "/mock-tests/{id}/attempt",
    response_model=StartAttemptResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_mock_test_attempt(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start a timed mock test attempt for the logged-in student."""
    mock_test = db.query(MockTest).filter(MockTest.id == id).first()
    if not mock_test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock test not found",
        )

    new_attempt = Attempt(
        user_id=current_user.id,
        mock_test_id=mock_test.id,
        score=0.0,
    )
    db.add(new_attempt)
    db.commit()
    db.refresh(new_attempt)

    return StartAttemptResponse(
        attempt_id=new_attempt.id,
        mock_test_id=mock_test.id,
        mock_test_title=mock_test.title,
        duration_minutes=mock_test.duration_minutes,
        total_questions=mock_test.total_questions,
        started_at=new_attempt.started_at,
    )
