from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class DownloadBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Resource title")
    file_url: str = Field(..., min_length=1, max_length=500, description="URL or upload path to the downloadable file")
    category: str = Field(..., min_length=1, max_length=50, description="Category (e.g. 'brochure', 'previous_year_paper', 'syllabus')")


class DownloadCreate(DownloadBase):
    pass


class DownloadResponse(DownloadBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
