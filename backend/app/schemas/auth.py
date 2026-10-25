from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRole(str, Enum):
    STUDENT = "student"
    ADMIN = "admin"


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of the user")
    email: EmailStr = Field(..., description="Valid email address")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128, description="Password (at least 6 characters)")
    role: UserRole = Field(default=UserRole.STUDENT, description="Account role: 'student' or 'admin'")


class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")


class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    sub: Optional[str] = None  # user email
    user_id: Optional[int] = None
    role: Optional[str] = None
    exp: Optional[int] = None
