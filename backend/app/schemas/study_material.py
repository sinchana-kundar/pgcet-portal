from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class StudyMaterialBase(BaseModel):
    subject: str = Field(..., min_length=1, max_length=100, description="Subject (e.g. MCA, MBA, Computer Science)")
    topic: str = Field(..., min_length=1, max_length=150, description="Topic or unit name (e.g. Data Structures)")
    title: str = Field(..., min_length=1, max_length=255, description="Title of the study material")
    file_url: str = Field(..., min_length=1, max_length=500, description="URL or upload path to the material document")


class StudyMaterialCreate(StudyMaterialBase):
    pass


class StudyMaterialResponse(StudyMaterialBase):
    id: int
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)
