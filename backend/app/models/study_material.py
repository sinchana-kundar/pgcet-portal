from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base


class StudyMaterial(Base):
    __tablename__ = "study_materials"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(100), nullable=False, index=True)
    topic = Column(String(150), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

