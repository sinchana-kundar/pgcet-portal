from sqlalchemy import Column, Integer, String
from app.database import Base


class Download(Base):
    __tablename__ = "downloads"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    category = Column(String(50), nullable=False, index=True)  # e.g., 'brochure', 'previous_year_paper'
