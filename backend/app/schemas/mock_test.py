from typing import List
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.question import QuestionStudentResponse


class MockTestBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Mock test title")
    subject: str = Field(..., min_length=1, max_length=100, description="Subject (e.g. MCA, MBA)")
    duration_minutes: int = Field(default=60, gt=0, le=360, description="Duration in minutes")


class MockTestCreate(MockTestBase):
    question_ids: List[int] = Field(..., min_length=1, description="List of question IDs to attach to this mock test")


class MockTestResponse(MockTestBase):
    id: int
    total_questions: int

    model_config = ConfigDict(from_attributes=True)


class MockTestDetailResponse(MockTestResponse):
    """Detailed mock test view for students containing questions without answers or explanations."""
    questions: List[QuestionStudentResponse] = Field(default_factory=list, description="Questions without leaked answers")

    model_config = ConfigDict(from_attributes=True)
