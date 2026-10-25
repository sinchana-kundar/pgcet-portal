import csv
import io
import math
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.dependencies import get_admin_user
from app.database import get_db
from app.models.result import Result
from app.models.user import User
from app.schemas.result import (
    ImportRowError,
    ImportSummaryResponse,
    PaginatedResultsResponse,
    ResultAdminResponse,
    ResultCreate,
    ResultPublicResponse,
)
from app.config import get_settings
from app.utils.date_parser import parse_date
from app.utils.limiter import limiter
from app.utils.rate_limiter import lookup_rate_limiter

settings = get_settings()
router = APIRouter(tags=["Results & Rank Lookup"])


# ==============================================================================
# 1. ADMIN RESULTS MANAGEMENT
# ==============================================================================

@router.post(
    "/admin/results",
    response_model=ResultAdminResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Admin - Results"],
)
def create_result(
    payload: ResultCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """Add a single candidate result record (Admin only)."""
    clean_reg = payload.reg_number.strip().upper()

    existing = (
        db.query(Result)
        .filter(func.upper(Result.reg_number) == clean_reg)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Result for registration number '{clean_reg}' already exists.",
        )

    result_record = Result(
        reg_number=clean_reg,
        dob=payload.dob,
        rank=payload.rank,
        marks=payload.marks,
        category=payload.category.strip().upper(),
    )
    db.add(result_record)
    db.commit()
    db.refresh(result_record)
    return result_record


@router.post(
    "/admin/results/import",
    response_model=ImportSummaryResponse,
    tags=["Admin - Results"],
)
async def import_results_csv(
    file: UploadFile = File(..., description="CSV file with columns: reg_number, rank, marks, category, dob"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """Bulk import candidate results from CSV file upload (Admin only).
    
    Validates all rows, skips malformed or duplicate entries, and returns a detailed audit summary.
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a valid .csv file.",
        )

    content = await file.read()
    try:
        decoded_content = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            decoded_content = content.decode("latin-1")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to decode file encoding. Please ensure the CSV is UTF-8 encoded.",
            )

    reader = csv.reader(io.StringIO(decoded_content))
    try:
        header_row = next(reader)
    except StopIteration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded CSV file is empty.",
        )

    # Normalize header column mapping
    header_map = {}
    aliases = {
        "reg_number": ["reg_number", "reg_no", "registration_number", "registration_no", "regno"],
        "rank": ["rank", "merit_rank", "state_rank"],
        "marks": ["marks", "score", "total_marks"],
        "category": ["category", "caste", "reservation_category"],
        "dob": ["dob", "date_of_birth", "birth_date"],
    }

    for idx, raw_h in enumerate(header_row):
        h_clean = raw_h.strip().lower().replace(" ", "_")
        for std_key, alias_list in aliases.items():
            if h_clean in alias_list:
                header_map[std_key] = idx
                break

    required_keys = ["reg_number", "rank", "marks", "category", "dob"]
    missing_keys = [k for k in required_keys if k not in header_map]
    if missing_keys:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"CSV is missing required headers: {', '.join(missing_keys)}. Expected columns: reg_number, rank, marks, category, dob.",
        )

    # Preload existing registration numbers from database to catch collisions
    existing_regs = {r[0].upper() for r in db.query(Result.reg_number).all()}
    seen_in_batch = set()
    results_to_insert = []
    errors = []

    row_idx = 1  # 1-indexed, header is row 1
    for row in reader:
        row_idx += 1
        # Skip completely empty rows
        if not row or not any(cell.strip() for cell in row):
            continue

        # Extract values
        try:
            raw_reg = row[header_map["reg_number"]].strip() if len(row) > header_map["reg_number"] else ""
            raw_rank = row[header_map["rank"]].strip() if len(row) > header_map["rank"] else ""
            raw_marks = row[header_map["marks"]].strip() if len(row) > header_map["marks"] else ""
            raw_cat = row[header_map["category"]].strip() if len(row) > header_map["category"] else ""
            raw_dob = row[header_map["dob"]].strip() if len(row) > header_map["dob"] else ""
        except IndexError:
            errors.append(
                ImportRowError(
                    row=row_idx,
                    reg_number=None,
                    reason="Row has fewer columns than specified by header.",
                )
            )
            continue

        clean_reg = raw_reg.upper()
        if not clean_reg:
            errors.append(
                ImportRowError(
                    row=row_idx,
                    reg_number=None,
                    reason="Registration number cannot be empty.",
                )
            )
            continue

        # Duplicate check against current batch (seen earlier in this file)
        if clean_reg in seen_in_batch:
            errors.append(
                ImportRowError(
                    row=row_idx,
                    reg_number=clean_reg,
                    reason=f"Duplicate registration number '{clean_reg}' encountered multiple times in CSV.",
                )
            )
            continue

        # Duplicate check against DB (already persisted in database)
        if clean_reg in existing_regs:
            errors.append(
                ImportRowError(
                    row=row_idx,
                    reg_number=clean_reg,
                    reason=f"Registration number '{clean_reg}' already exists in database.",
                )
            )
            continue

        # Validate Rank
        try:
            parsed_rank = int(raw_rank)
            if parsed_rank <= 0:
                raise ValueError()
        except ValueError:
            errors.append(
                ImportRowError(
                    row=row_idx,
                    reg_number=clean_reg,
                    reason=f"Rank must be a positive integer, got: '{raw_rank}'.",
                )
            )
            continue

        # Validate Marks
        try:
            parsed_marks = float(raw_marks)
            if parsed_marks < 0:
                raise ValueError()
        except ValueError:
            errors.append(
                ImportRowError(
                    row=row_idx,
                    reg_number=clean_reg,
                    reason=f"Marks must be a non-negative number, got: '{raw_marks}'.",
                )
            )
            continue

        # Validate Category
        clean_cat = raw_cat.upper()
        if not clean_cat:
            errors.append(
                ImportRowError(
                    row=row_idx,
                    reg_number=clean_reg,
                    reason="Category cannot be empty.",
                )
            )
            continue

        # Validate Date of Birth
        try:
            parsed_dob = parse_date(raw_dob)
        except ValueError as exc:
            errors.append(
                ImportRowError(
                    row=row_idx,
                    reg_number=clean_reg,
                    reason=f"Invalid date of birth format: {str(exc)}",
                )
            )
            continue

        # All fields valid
        seen_in_batch.add(clean_reg)
        existing_regs.add(clean_reg)
        results_to_insert.append(
            Result(
                reg_number=clean_reg,
                dob=parsed_dob,
                rank=parsed_rank,
                marks=parsed_marks,
                category=clean_cat,
            )
        )

    if results_to_insert:
        db.add_all(results_to_insert)
        db.commit()

    total_rows = (row_idx - 1)  # exclude header row
    return ImportSummaryResponse(
        total_rows=total_rows,
        imported=len(results_to_insert),
        skipped=len(errors),
        errors=errors,
    )


@router.get(
    "/admin/results",
    response_model=PaginatedResultsResponse,
    tags=["Admin - Results"],
)
def get_results_list(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(50, ge=1, le=500, description="Items per page"),
    category: Optional[str] = Query(None, description="Optional category filter (e.g. GM, 2A, SC)"),
    search: Optional[str] = Query(None, description="Optional search by registration number"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """Retrieve a paginated list of all candidate results (Admin only)."""
    query = db.query(Result)

    if category and category.strip():
        query = query.filter(Result.category.ilike(f"%{category.strip()}%"))

    if search and search.strip():
        query = query.filter(Result.reg_number.ilike(f"%{search.strip()}%"))

    total = query.count()
    total_pages = math.ceil(total / limit) if total > 0 else 1
    items = (
        query.order_by(Result.rank.asc(), Result.id.asc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return PaginatedResultsResponse(
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
        items=items,
    )


@router.delete(
    "/admin/results/{id}",
    tags=["Admin - Results"],
)
def delete_result(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """Delete a candidate result entry (Admin only)."""
    record = db.query(Result).filter(Result.id == id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Result record not found",
        )

    db.delete(record)
    db.commit()
    return {
        "message": "Result record deleted successfully",
        "id": id,
    }


# ==============================================================================
# 2. PUBLIC RESULT / RANK LOOKUP
# ==============================================================================

@router.get(
    "/results/lookup",
    response_model=ResultPublicResponse,
    tags=["Results & Rank Lookup"],
)
@limiter.limit(settings.RATE_LIMIT_LOOKUP)
def lookup_result(
    request: Request,
    reg_number: str = Query(..., min_length=1, description="Candidate registration number"),
    dob: str = Query(..., min_length=1, description="Candidate date of birth (YYYY-MM-DD or DD-MM-YYYY)"),
    db: Session = Depends(get_db),
):
    """Public candidate rank and score lookup.
    
    Requires both registration number and date of birth for identity verification.
    Guarantees zero information leakage for invalid registration numbers or incorrect credentials.
    Protected against brute-force attacks via sliding window rate limiting.
    """
    # Enforce brute-force protection
    lookup_rate_limiter.check(request, limit=20, window_seconds=60)

    clean_reg = reg_number.strip().upper()

    try:
        parsed_dob = parse_date(dob)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date of birth format. Please provide date as YYYY-MM-DD (e.g. 2001-05-15).",
        )

    record = (
        db.query(Result)
        .filter(
            func.upper(Result.reg_number) == clean_reg,
            Result.dob == parsed_dob,
        )
        .first()
    )

    if not record:
        # Deliberately identical error message whether reg_number does not exist
        # OR reg_number exists but DOB was incorrect — prevents user enumeration.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No result found for the provided registration number and date of birth.",
        )

    return record
