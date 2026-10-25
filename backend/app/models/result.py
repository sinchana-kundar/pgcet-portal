from sqlalchemy import Column, Integer, String, Float, Date
from app.database import Base


class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    reg_number = Column(String(50), unique=True, index=True, nullable=False)
    dob = Column(Date, nullable=False, index=True)
    rank = Column(Integer, nullable=False, index=True)
    marks = Column(Float, nullable=False)
    category = Column(String(50), nullable=False)  # e.g., 'GM', '2A', '3B', 'SC', 'ST'
