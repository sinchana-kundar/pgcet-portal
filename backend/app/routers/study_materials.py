from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.auth.dependencies import get_admin_user
from app.database import get_db
from app.models.study_material import StudyMaterial
from app.models.user import User
from app.schemas.study_material import (
    StudyMaterialCreate,
    StudyMaterialResponse,
)
from app.utils.file_upload import (
    ALLOWED_MATERIAL_EXTENSIONS,
    delete_stored_file,
    save_upload_file,
)

router = APIRouter(prefix="/study-materials", tags=["Study Materials"])


@router.get("", response_model=List[StudyMaterialResponse])
def get_study_materials(
    subject: Optional[str] = Query(None, description="Filter by subject (e.g. MCA, Mathematics)"),
    topic: Optional[str] = Query(None, description="Filter by topic (e.g. Data Structures)"),
    db: Session = Depends(get_db),
):
    """Retrieve study materials with optional filtering by subject and topic."""
    query = db.query(StudyMaterial)

    if subject and subject.strip():
        query = query.filter(StudyMaterial.subject.ilike(f"%{subject.strip()}%"))
    if topic and topic.strip():
        query = query.filter(StudyMaterial.topic.ilike(f"%{topic.strip()}%"))

    return query.order_by(StudyMaterial.uploaded_at.desc(), StudyMaterial.id.desc()).all()


@router.post("", response_model=StudyMaterialResponse, status_code=status.HTTP_201_CREATED)
async def create_study_material(
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
    subject: Optional[str] = Form(None, description="Subject (e.g. MCA, MBA)"),
    topic: Optional[str] = Form(None, description="Topic or unit name"),
    title: Optional[str] = Form(None, description="Title of the study material"),
    file_url: Optional[str] = Form(None, description="Direct URL to file (if not uploading)"),
    file: Optional[UploadFile] = File(None, description="Document to upload (PDF, DOC, DOCX, PPT, etc.)"),
):
    """Upload or register a new study material (Admin only)."""
    content_type = request.headers.get("content-type", "")

    if content_type.startswith("application/json"):
        try:
            body = await request.json()
            payload = StudyMaterialCreate.model_validate(body)
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

        final_subject = payload.subject.strip()
        final_topic = payload.topic.strip()
        final_title = payload.title.strip()
        final_file_url = payload.file_url.strip()
    else:
        if not subject or not subject.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Field 'subject' is required.",
            )
        if not topic or not topic.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Field 'topic' is required.",
            )
        if not title or not title.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Field 'title' is required.",
            )

        if file and file.filename:
            final_file_url = save_upload_file(
                upload_file=file,
                subfolder="materials",
                allowed_extensions=ALLOWED_MATERIAL_EXTENSIONS,
            )
        elif file_url and file_url.strip():
            final_file_url = file_url.strip()
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File upload or 'file_url' is required to register study material.",
            )

        final_subject = subject.strip()
        final_topic = topic.strip()
        final_title = title.strip()

    new_material = StudyMaterial(
        subject=final_subject,
        topic=final_topic,
        title=final_title,
        file_url=final_file_url,
    )
    db.add(new_material)
    db.commit()
    db.refresh(new_material)
    return new_material


@router.delete("/{id}")
def delete_study_material(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """Delete a study material entry and its uploaded document (Admin only)."""
    material = db.query(StudyMaterial).filter(StudyMaterial.id == id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study material not found",
        )

    if material.file_url:
        delete_stored_file(material.file_url)

    db.delete(material)
    db.commit()
    return {
        "message": "Study material deleted successfully",
        "id": id,
    }
