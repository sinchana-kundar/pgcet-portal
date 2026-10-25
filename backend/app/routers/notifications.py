from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.auth.dependencies import get_admin_user
from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    NotificationUpdate,
)
from app.utils.file_upload import (
    ALLOWED_PDF_EXTENSIONS,
    delete_stored_file,
    save_upload_file,
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse])
def get_notifications(db: Session = Depends(get_db)):
    """Retrieve all notifications, ordered newest first."""
    return (
        db.query(Notification)
        .order_by(Notification.published_at.desc(), Notification.id.desc())
        .all()
    )


@router.get("/{id}", response_model=NotificationResponse)
def get_notification(id: int, db: Session = Depends(get_db)):
    """Retrieve a single notification by ID."""
    notification = db.query(Notification).filter(Notification.id == id).first()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return notification


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_notification(
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
    title: Optional[str] = Form(None, description="Notification headline"),
    description: Optional[str] = Form(None, description="Notification body content"),
    pdf_url: Optional[str] = Form(None, description="Optional direct URL to PDF"),
    file: Optional[UploadFile] = File(None, description="Optional PDF document to upload"),
):
    """Create a new notification (Admin only).
    
    Accepts multipart/form-data with optional PDF upload or application/json payload.
    """
    content_type = request.headers.get("content-type", "")

    if content_type.startswith("application/json"):
        try:
            body = await request.json()
            payload = NotificationCreate.model_validate(body)
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
        final_description = payload.description.strip()
        final_pdf_url = payload.pdf_url.strip() if payload.pdf_url else None
    else:
        if not title or not title.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Field 'title' is required.",
            )
        if not description or not description.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Field 'description' is required.",
            )

        final_title = title.strip()
        final_description = description.strip()
        final_pdf_url = pdf_url.strip() if pdf_url else None

        if file and file.filename:
            final_pdf_url = save_upload_file(
                upload_file=file,
                subfolder="notifications",
                allowed_extensions=ALLOWED_PDF_EXTENSIONS,
            )

    new_notification = Notification(
        title=final_title,
        description=final_description,
        pdf_url=final_pdf_url,
    )
    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)
    return new_notification


@router.put("/{id}", response_model=NotificationResponse)
async def update_notification(
    id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
    title: Optional[str] = Form(None, description="Updated headline"),
    description: Optional[str] = Form(None, description="Updated body content"),
    pdf_url: Optional[str] = Form(None, description="Updated direct URL to PDF"),
    file: Optional[UploadFile] = File(None, description="Optional replacement PDF document to upload"),
):
    """Edit an existing notification (Admin only)."""
    notification = db.query(Notification).filter(Notification.id == id).first()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    content_type = request.headers.get("content-type", "")

    if content_type.startswith("application/json"):
        try:
            body = await request.json()
            payload = NotificationUpdate.model_validate(body)
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

        if payload.title is not None:
            notification.title = payload.title.strip()
        if payload.description is not None:
            notification.description = payload.description.strip()
        if payload.pdf_url is not None:
            notification.pdf_url = payload.pdf_url.strip() if payload.pdf_url else None
    else:
        if file and file.filename:
            # Clean up old upload if exists
            if notification.pdf_url:
                delete_stored_file(notification.pdf_url)
            notification.pdf_url = save_upload_file(
                upload_file=file,
                subfolder="notifications",
                allowed_extensions=ALLOWED_PDF_EXTENSIONS,
            )
        elif pdf_url is not None:
            notification.pdf_url = pdf_url.strip() if pdf_url else None

        if title is not None and title.strip():
            notification.title = title.strip()
        if description is not None and description.strip():
            notification.description = description.strip()

    db.commit()
    db.refresh(notification)
    return notification


@router.delete("/{id}")
def delete_notification(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """Delete a notification and its associated uploaded file (Admin only)."""
    notification = db.query(Notification).filter(Notification.id == id).first()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    if notification.pdf_url:
        delete_stored_file(notification.pdf_url)

    db.delete(notification)
    db.commit()
    return {
        "message": "Notification deleted successfully",
        "id": id,
    }
