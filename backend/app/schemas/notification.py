from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class NotificationBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Notification headline")
    description: str = Field(..., min_length=1, description="Detailed notification content")
    pdf_url: Optional[str] = Field(default=None, max_length=500, description="URL or upload path to the notification PDF")


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255, description="Updated headline")
    description: Optional[str] = Field(default=None, min_length=1, description="Updated notification content")
    pdf_url: Optional[str] = Field(default=None, max_length=500, description="Updated URL or upload path to PDF")


class NotificationResponse(NotificationBase):
    id: int
    published_at: datetime

    model_config = ConfigDict(from_attributes=True)
