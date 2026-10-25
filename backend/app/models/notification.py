from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    pdf_url = Column(String(500), nullable=True)
    published_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

