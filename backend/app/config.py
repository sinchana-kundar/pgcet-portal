import os
from functools import lru_cache
from typing import List, Optional
from dotenv import load_dotenv
from pydantic import BaseModel

# Preload variables from .env if present
load_dotenv()


class Settings(BaseModel):
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "PGCET Student Portal API")
    VERSION: str = os.getenv("VERSION", "1.0.0")
    DESCRIPTION: str = os.getenv("DESCRIPTION", "Backend API for Post Graduate Common Entrance Test (PGCET) Aspirant Portal")

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/pgcet_portal")

    # JWT Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretjwtkey_replace_with_a_secure_random_string_in_production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    ADMIN_SIGNUP_SECRET: Optional[str] = os.getenv("ADMIN_SIGNUP_SECRET", None)

    # File Storage
    STORAGE_TYPE: str = os.getenv("STORAGE_TYPE", "local")  # "local" or "cloudinary"
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "25"))

    # Cloudinary Credentials (active when STORAGE_TYPE=cloudinary)
    CLOUDINARY_URL: Optional[str] = os.getenv("CLOUDINARY_URL", None)
    CLOUDINARY_CLOUD_NAME: Optional[str] = os.getenv("CLOUDINARY_CLOUD_NAME", None)
    CLOUDINARY_API_KEY: Optional[str] = os.getenv("CLOUDINARY_API_KEY", None)
    CLOUDINARY_API_SECRET: Optional[str] = os.getenv("CLOUDINARY_API_SECRET", None)

    # Rate Limiting (slowapi format)
    RATE_LIMIT_LOGIN: str = os.getenv("RATE_LIMIT_LOGIN", "10/minute")
    RATE_LIMIT_SIGNUP: str = os.getenv("RATE_LIMIT_SIGNUP", "5/minute")
    RATE_LIMIT_LOOKUP: str = os.getenv("RATE_LIMIT_LOOKUP", "20/minute")

    # Testing mode
    TESTING: bool = os.getenv("TESTING", "false").lower() in ("true", "1")

    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Parse CORS origins from environment variable or fallback to local development origins."""
        raw_origins = os.getenv("CORS_ORIGINS")
        if raw_origins and raw_origins.strip():
            return [orig.strip() for orig in raw_origins.split(",") if orig.strip()]
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]

    @property
    def normalized_database_url(self) -> str:
        """Fix legacy 'postgres://' URLs and ensure compatible psycopg driver if needed."""
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg://", 1)
        elif url.startswith("postgresql://") and "+psycopg" not in url:
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url


@lru_cache()
def get_settings() -> Settings:
    return Settings()
