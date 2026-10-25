from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class StartAttemptResponse(BaseModel):
    attempt_id: int
    mock_test_id: int
    mock_test_title: str
    duration_minutes: int
    total_questions: int
    started_at: datetime


class SubmitAnswerItem(BaseModel):
    question_id: int
    selected_option: Optional[str] = Field(default=None, description="Selected option: 'A', 'B', 'C', 'D' or null if skipped")


class SubmitAttemptRequest(BaseModel):
    answers: List[SubmitAnswerItem] = Field(default_factory=list, description="List of submitted question answers")


class QuestionReviewItem(BaseModel):
    question_id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    selected_option: Optional[str]
    correct_option: str
    is_correct: bool
    explanation: Optional[str]


class AttemptResultResponse(BaseModel):
    attempt_id: int
    mock_test_id: int
    mock_test_title: str
    score: float
    total_questions: int
    percentage: float
    started_at: datetime
    submitted_at: datetime
    breakdown: List[QuestionReviewItem]

    model_config = ConfigDict(from_attributes=True)


class AttemptHistoryItem(BaseModel):
    attempt_id: int
    mock_test_id: int
    mock_test_title: str
    subject: str
    score: float
    total_questions: int
    percentage: float
    started_at: datetime
    submitted_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
