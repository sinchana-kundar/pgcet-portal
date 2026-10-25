from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class QuestionBase(BaseModel):
    subject: str = Field(..., min_length=1, max_length=100, description="Subject (e.g. MCA, Mathematics)")
    topic: str = Field(..., min_length=1, max_length=150, description="Topic or unit name (e.g. Data Structures)")
    question_text: str = Field(..., min_length=1, description="Question problem statement")
    option_a: str = Field(..., min_length=1, description="Option A")
    option_b: str = Field(..., min_length=1, description="Option B")
    option_c: str = Field(..., min_length=1, description="Option C")
    option_d: str = Field(..., min_length=1, description="Option D")
    correct_option: str = Field(..., description="Correct option: 'A', 'B', 'C', or 'D'")
    explanation: Optional[str] = Field(default=None, description="Detailed explanation of the correct solution")
    difficulty: str = Field(default="medium", description="Difficulty level: 'easy', 'medium', or 'hard'")

    @field_validator("correct_option")
    @classmethod
    def validate_correct_option(cls, v: str) -> str:
        clean = v.strip().upper()
        if clean not in {"A", "B", "C", "D"}:
            raise ValueError("correct_option must be one of 'A', 'B', 'C', or 'D'")
        return clean

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in {"easy", "medium", "hard"}:
            raise ValueError("difficulty must be one of 'easy', 'medium', or 'hard'")
        return clean


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(BaseModel):
    subject: Optional[str] = Field(default=None, min_length=1, max_length=100)
    topic: Optional[str] = Field(default=None, min_length=1, max_length=150)
    question_text: Optional[str] = Field(default=None, min_length=1)
    option_a: Optional[str] = Field(default=None, min_length=1)
    option_b: Optional[str] = Field(default=None, min_length=1)
    option_c: Optional[str] = Field(default=None, min_length=1)
    option_d: Optional[str] = Field(default=None, min_length=1)
    correct_option: Optional[str] = Field(default=None)
    explanation: Optional[str] = Field(default=None)
    difficulty: Optional[str] = Field(default=None)

    @field_validator("correct_option")
    @classmethod
    def validate_correct_option(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip().upper()
            if clean not in {"A", "B", "C", "D"}:
                raise ValueError("correct_option must be one of 'A', 'B', 'C', or 'D'")
            return clean
        return v

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip().lower()
            if clean not in {"easy", "medium", "hard"}:
                raise ValueError("difficulty must be one of 'easy', 'medium', or 'hard'")
            return clean
        return v


class QuestionAdminResponse(QuestionBase):
    """Full question details for Admin management (includes correct_option and explanation)."""
    id: int

    model_config = ConfigDict(from_attributes=True)


class QuestionStudentResponse(BaseModel):
    """Redacted question details for Students prior to submission (NO answers or explanations leaked)."""
    id: int
    subject: str
    topic: str
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    difficulty: str

    model_config = ConfigDict(from_attributes=True)
