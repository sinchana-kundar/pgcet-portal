from typing import Optional
from pydantic import BaseModel, Field


class PracticeCheckRequest(BaseModel):
    question_id: int
    selected_option: str = Field(..., description="Selected answer: 'A', 'B', 'C', or 'D'")


class PracticeCheckResponse(BaseModel):
    question_id: int
    selected_option: str
    correct_option: str
    is_correct: bool
    explanation: Optional[str] = None
