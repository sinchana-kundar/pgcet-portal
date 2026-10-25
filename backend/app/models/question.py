from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(100), nullable=False, index=True)
    topic = Column(String(150), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    option_a = Column(Text, nullable=False)
    option_b = Column(Text, nullable=False)
    option_c = Column(Text, nullable=False)
    option_d = Column(Text, nullable=False)
    correct_option = Column(String(1), nullable=False)  # 'A', 'B', 'C', 'D'
    explanation = Column(Text, nullable=True)
    difficulty = Column(String(20), nullable=False, default="medium", index=True)  # 'easy', 'medium', 'hard'


    # Relationships
    mock_tests = relationship("MockTest", secondary="mock_test_questions", back_populates="questions")
    attempt_answers = relationship("AttemptAnswer", back_populates="question", cascade="all, delete-orphan")
