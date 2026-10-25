from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.question import Question
from app.models.user import User
from app.schemas.practice import (
    PracticeCheckRequest,
    PracticeCheckResponse,
)
from app.schemas.question import QuestionStudentResponse

router = APIRouter(prefix="/practice", tags=["Practice Mode"])


@router.get("", response_model=List[QuestionStudentResponse])
def get_practice_questions(
    subject: str = Query(..., min_length=1, description="Subject name (e.g. MCA, Mathematics)"),
    topic: str = Query(..., min_length=1, description="Topic name (e.g. Data Structures)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve practice questions for a specific topic (NO answers or explanations exposed)."""
    questions = (
        db.query(Question)
        .filter(
            Question.subject.ilike(f"%{subject.strip()}%"),
            Question.topic.ilike(f"%{topic.strip()}%"),
        )
        .order_by(Question.id.asc())
        .all()
    )
    return questions


@router.post("/check", response_model=PracticeCheckResponse)
def check_practice_answer(
    payload: PracticeCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Instant check for a practice question without saving an attempt history record."""
    question = db.query(Question).filter(Question.id == payload.question_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    choice = payload.selected_option.strip().upper()
    is_correct = choice == question.correct_option.strip().upper()

    return PracticeCheckResponse(
        question_id=question.id,
        selected_option=choice,
        correct_option=question.correct_option,
        is_correct=is_correct,
        explanation=question.explanation,
    )
