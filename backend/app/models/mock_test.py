from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

# Association table for Many-to-Many relation between MockTest and Question
mock_test_questions = Table(
    "mock_test_questions",
    Base.metadata,
    Column("mock_test_id", Integer, ForeignKey("mock_tests.id", ondelete="CASCADE"), primary_key=True),
    Column("question_id", Integer, ForeignKey("questions.id", ondelete="CASCADE"), primary_key=True),
)


class MockTest(Base):
    __tablename__ = "mock_tests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    subject = Column(String(100), nullable=False, index=True)
    duration_minutes = Column(Integer, nullable=False, default=60)
    total_questions = Column(Integer, nullable=False, default=0)

    # Relationships
    questions = relationship("Question", secondary=mock_test_questions, back_populates="mock_tests")
    attempts = relationship("Attempt", back_populates="mock_test", cascade="all, delete-orphan")
