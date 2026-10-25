from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_admin_user
from app.database import get_db
from app.models.question import Question
from app.models.user import User
from app.schemas.question import (
    QuestionAdminResponse,
    QuestionCreate,
    QuestionUpdate,
)

router = APIRouter(prefix="/admin/questions", tags=["Admin - Questions"])


@router.post("", response_model=QuestionAdminResponse, status_code=status.HTTP_201_CREATED)
def create_question(
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """Add a new question to the question bank (Admin only)."""
    question = Question(
        subject=payload.subject.strip(),
        topic=payload.topic.strip(),
        question_text=payload.question_text.strip(),
        option_a=payload.option_a.strip(),
        option_b=payload.option_b.strip(),
        option_c=payload.option_c.strip(),
        option_d=payload.option_d.strip(),
        correct_option=payload.correct_option,
        explanation=payload.explanation.strip() if payload.explanation else None,
        difficulty=payload.difficulty,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.get("", response_model=List[QuestionAdminResponse])
def get_questions(
    subject: Optional[str] = Query(None, description="Filter by subject"),
    topic: Optional[str] = Query(None, description="Filter by topic"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """List questions in the bank for building mock tests (Admin only)."""
    query = db.query(Question)
    if subject and subject.strip():
        query = query.filter(Question.subject.ilike(f"%{subject.strip()}%"))
    if topic and topic.strip():
        query = query.filter(Question.topic.ilike(f"%{topic.strip()}%"))

    return query.order_by(Question.id.desc()).all()


@router.put("/{id}", response_model=QuestionAdminResponse)
def update_question(
    id: int,
    payload: QuestionUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """Edit an existing question in the bank (Admin only)."""
    question = db.query(Question).filter(Question.id == id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    if payload.subject is not None:
        question.subject = payload.subject.strip()
    if payload.topic is not None:
        question.topic = payload.topic.strip()
    if payload.question_text is not None:
        question.question_text = payload.question_text.strip()
    if payload.option_a is not None:
        question.option_a = payload.option_a.strip()
    if payload.option_b is not None:
        question.option_b = payload.option_b.strip()
    if payload.option_c is not None:
        question.option_c = payload.option_c.strip()
    if payload.option_d is not None:
        question.option_d = payload.option_d.strip()
    if payload.correct_option is not None:
        question.correct_option = payload.correct_option
    if payload.explanation is not None:
        question.explanation = payload.explanation.strip() if payload.explanation else None
    if payload.difficulty is not None:
        question.difficulty = payload.difficulty

    db.commit()
    db.refresh(question)
    return question


@router.delete("/{id}")
def delete_question(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """Delete a question from the question bank (Admin only)."""
    question = db.query(Question).filter(Question.id == id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    db.delete(question)
    db.commit()
    return {
        "message": "Question deleted successfully",
        "id": id,
    }
