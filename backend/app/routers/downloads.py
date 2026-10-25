from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.auth.dependencies import get_admin_user
from app.database import get_db
from app.models.download import Download
from app.models.user import User
from app.schemas.download import (
    DownloadCreate,
    DownloadResponse,
)
from app.utils.file_upload import (
    ALLOWED_DOWNLOAD_EXTENSIONS,
    delete_stored_file,
    save_upload_file,
)

router = APIRouter(prefix="/downloads", tags=["Downloads"])


@router.get("", response_model=List[DownloadResponse])
def get_downloads(
    category: Optional[str] = Query(None, description="Filter by category (e.g. brochure, previous_year_paper)"),
    db: Session = Depends(get_db),
):
    """Retrieve downloadable items with optional filtering by category."""
    query = db.query(Download)

    if category and category.strip():
        query = query.filter(Download.category.ilike(f"%{category.strip()}%"))

    return query.order_by(Download.id.desc()).all()


@router.post("", response_model=DownloadResponse, status_code=status.HTTP_201_CREATED)
async def create_download(
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
    title: Optional[str] = Form(None, description="Resource title"),
    category: Optional[str] = Form(None, description="Resource category (e.g. brochure, previous_year_paper, syllabus)"),
    file_url: Optional[str] = Form(None, description="Direct URL to file (if not uploading)"),
    file: Optional[UploadFile] = File(None, description="File to upload (PDF, DOC, ZIP, etc.)"),
):
    """Upload or register a new downloadable resource (Admin only)."""
    content_type = request.headers.get("content-type", "")

    if content_type.startswith("application/json"):
        try:
            body = await request.json()
            payload = DownloadCreate.model_validate(body)
        except ValidationError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=exc.errors(),
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON payload",
            )

        final_title = payload.title.strip()
        final_category = payload.category.strip()
        final_file_url = payload.file_url.strip()
    else:
        if not title or not title.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Field 'title' is required.",
            )
        if not category or not category.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Field 'category' is required.",
            )

        if file and file.filename:
            final_file_url = save_upload_file(
                upload_file=file,
                subfolder="downloads",
                allowed_extensions=ALLOWED_DOWNLOAD_EXTENSIONS,
            )
        elif file_url and file_url.strip():
            final_file_url = file_url.strip()
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File upload or 'file_url' is required to register a download resource.",
            )

        final_title = title.strip()
        final_category = category.strip()

    new_download = Download(
        title=final_title,
        category=final_category,
        file_url=final_file_url,
    )
    db.add(new_download)
    db.commit()
    db.refresh(new_download)
    return new_download


@router.delete("/{id}")
def delete_download(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """Delete a download resource and its uploaded file (Admin only)."""
    download = db.query(Download).filter(Download.id == id).first()
    if not download:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Download resource not found",
        )

    if download.file_url:
        delete_stored_file(download.file_url)

    db.delete(download)
    db.commit()
    return {
        "message": "Download resource deleted successfully",
        "id": id,
    }
