"""Storage abstraction layer supporting Local Disk and Cloudinary.

Provides a unified interface for saving and deleting uploaded documents
(notifications, study materials, brochures, question papers).
"""

import os
import re
import shutil
import uuid
from typing import List, Optional
from fastapi import HTTPException, UploadFile, status

from app.config import get_settings

ALLOWED_PDF_EXTENSIONS = [".pdf"]
ALLOWED_MATERIAL_EXTENSIONS = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt"]
ALLOWED_DOWNLOAD_EXTENSIONS = [
    ".pdf",
    ".doc",
    ".docx",
    ".zip",
    ".rar",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
]


def sanitize_filename(filename: str) -> str:
    """Sanitize original filename to avoid directory traversal and special character issues."""
    base_name = os.path.basename(filename).strip()
    base_name = re.sub(r"\s+", "_", base_name)
    clean_name = re.sub(r"[^\w\.\-]", "", base_name)
    if not clean_name or clean_name.startswith("."):
        clean_name = f"document{clean_name}"
    return clean_name


def validate_file_upload(
    upload_file: UploadFile,
    allowed_extensions: Optional[List[str]] = None,
    max_size_mb: int = 25,
) -> str:
    """Validate filename presence, extension whitelist, and file size limits."""
    if not upload_file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file has an empty filename.",
        )

    _, ext = os.path.splitext(upload_file.filename)
    ext_lower = ext.lower()

    if allowed_extensions:
        normalized_allowed = [e.lower() for e in allowed_extensions]
        if ext_lower not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file extension '{ext}'. Allowed extensions: {', '.join(allowed_extensions)}",
            )

    # Validate file size
    upload_file.file.seek(0, 2)  # Seek to end
    file_size = upload_file.file.tell()
    upload_file.file.seek(0)  # Rewind to start

    max_bytes = max_size_mb * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size ({file_size / (1024 * 1024):.2f}MB) exceeds the maximum allowed limit of {max_size_mb}MB.",
        )

    return ext_lower


class StorageBackend:
    def save(
        self,
        upload_file: UploadFile,
        subfolder: str,
        allowed_extensions: Optional[List[str]] = None,
    ) -> str:
        raise NotImplementedError

    def delete(self, file_url: Optional[str]) -> bool:
        raise NotImplementedError


class LocalStorageBackend(StorageBackend):
    def save(
        self,
        upload_file: UploadFile,
        subfolder: str,
        allowed_extensions: Optional[List[str]] = None,
    ) -> str:
        settings = get_settings()
        validate_file_upload(
            upload_file,
            allowed_extensions=allowed_extensions,
            max_size_mb=settings.MAX_UPLOAD_SIZE_MB,
        )

        clean_name = sanitize_filename(upload_file.filename)
        unique_prefix = uuid.uuid4().hex[:12]
        unique_filename = f"{unique_prefix}_{clean_name}"

        target_dir = os.path.join(settings.UPLOAD_DIR, subfolder)
        os.makedirs(target_dir, exist_ok=True)
        file_destination = os.path.join(target_dir, unique_filename)

        try:
            upload_file.file.seek(0)
            with open(file_destination, "wb") as buffer:
                shutil.copyfileobj(upload_file.file, buffer)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save uploaded file locally: {str(exc)}",
            )

        return f"/uploads/{subfolder}/{unique_filename}"

    def delete(self, file_url: Optional[str]) -> bool:
        if not file_url or not isinstance(file_url, str):
            return False

        if not file_url.startswith("/uploads/"):
            return False

        settings = get_settings()
        rel_path = file_url[len("/uploads/") :]
        if ".." in rel_path:
            return False

        abs_path = os.path.join(settings.UPLOAD_DIR, rel_path)
        try:
            if os.path.isfile(abs_path):
                os.remove(abs_path)
                return True
        except Exception:
            pass
        return False


class CloudinaryStorageBackend(StorageBackend):
    def __init__(self):
        settings = get_settings()
        try:
            import cloudinary
            import cloudinary.uploader

            self.cloudinary = cloudinary
            self.uploader = cloudinary.uploader

            if settings.CLOUDINARY_URL:
                cloudinary.config(cloudinary_url=settings.CLOUDINARY_URL)
            elif settings.CLOUDINARY_CLOUD_NAME:
                cloudinary.config(
                    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                    api_key=settings.CLOUDINARY_API_KEY,
                    api_secret=settings.CLOUDINARY_API_SECRET,
                    secure=True,
                )
            else:
                # Fallback to local if credentials not provided
                self.uploader = None
        except ImportError:
            self.uploader = None

    def save(
        self,
        upload_file: UploadFile,
        subfolder: str,
        allowed_extensions: Optional[List[str]] = None,
    ) -> str:
        settings = get_settings()
        validate_file_upload(
            upload_file,
            allowed_extensions=allowed_extensions,
            max_size_mb=settings.MAX_UPLOAD_SIZE_MB,
        )

        if not self.uploader:
            # Fallback to local storage if Cloudinary is not configured
            return LocalStorageBackend().save(upload_file, subfolder, allowed_extensions)

        clean_name = sanitize_filename(upload_file.filename)
        name_no_ext, _ = os.path.splitext(clean_name)
        unique_public_id = f"{uuid.uuid4().hex[:12]}_{name_no_ext}"

        try:
            upload_file.file.seek(0)
            res = self.uploader.upload(
                upload_file.file,
                folder=f"pgcet_portal/{subfolder}",
                public_id=unique_public_id,
                resource_type="auto",
            )
            return res.get("secure_url") or res.get("url")
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload document to Cloudinary: {str(exc)}",
            )

    def delete(self, file_url: Optional[str]) -> bool:
        if not file_url or not isinstance(file_url, str):
            return False

        if not self.uploader or "res.cloudinary.com" not in file_url:
            return False

        try:
            # Extract public_id from Cloudinary URL
            # e.g. https://res.cloudinary.com/cloud/image/upload/v1234/pgcet_portal/notifications/id.pdf
            parts = file_url.split("/upload/")
            if len(parts) > 1:
                path_part = parts[1]
                # remove version if present (e.g. v12345/)
                if path_part.startswith("v") and "/" in path_part:
                    path_part = path_part.split("/", 1)[1]
                public_id, _ = os.path.splitext(path_part)
                self.uploader.destroy(public_id, resource_type="raw")
                self.uploader.destroy(public_id, resource_type="image")
                return True
        except Exception:
            pass
        return False


def get_storage() -> StorageBackend:
    """Return configured storage backend based on STORAGE_TYPE environment variable."""
    settings = get_settings()
    if settings.STORAGE_TYPE.lower() == "cloudinary":
        return CloudinaryStorageBackend()
    return LocalStorageBackend()


def save_upload_file(
    upload_file: UploadFile,
    subfolder: str,
    allowed_extensions: Optional[List[str]] = None,
) -> str:
    """Unified helper that saves file using the active storage backend."""
    storage = get_storage()
    return storage.save(upload_file, subfolder, allowed_extensions)


def delete_stored_file(file_url: Optional[str]) -> bool:
    """Unified helper that removes file from Cloudinary or local disk."""
    if not file_url:
        return False

    if "res.cloudinary.com" in file_url:
        return CloudinaryStorageBackend().delete(file_url)
    return LocalStorageBackend().delete(file_url)
