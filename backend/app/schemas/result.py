from datetime import date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ResultBase(BaseModel):
    reg_number: str = Field(..., min_length=1, max_length=50, description="Candidate registration number")
    dob: date = Field(..., description="Candidate date of birth (YYYY-MM-DD)")
    rank: int = Field(..., gt=0, description="State merit rank")
    marks: float = Field(..., ge=0.0, description="Score / marks obtained")
    category: str = Field(..., min_length=1, max_length=50, description="Reservation / admission category (e.g. GM, 2A, 3B, SC, ST)")


class ResultCreate(ResultBase):
    pass


class ResultAdminResponse(ResultBase):
    """Full result record for Administrator audit/review."""
    id: int

    model_config = ConfigDict(from_attributes=True)


class ResultPublicResponse(BaseModel):
    """Public lookup result without leaking the internal database ID."""
    reg_number: str
    dob: date
    rank: int
    marks: float
    category: str

    model_config = ConfigDict(from_attributes=True)


class PaginatedResultsResponse(BaseModel):
    """Paginated list of results for administrator review."""
    total: int
    page: int
    limit: int
    total_pages: int
    items: List[ResultAdminResponse]


class ImportRowError(BaseModel):
    row: int
    reg_number: Optional[str] = None
    reason: str


class ImportSummaryResponse(BaseModel):
    """Summary of bulk CSV results import."""
    total_rows: int
    imported: int
    skipped: int
    errors: List[ImportRowError]
