import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.database import engine, Base
from app.utils.limiter import limiter
# Import all models to ensure they are registered with Base.metadata before create_all
import app.models  # noqa: F401
from app.routers import (
    auth_router,
    notifications_router,
    study_materials_router,
    downloads_router,
    questions_router,
    mock_tests_router,
    attempts_router,
    practice_router,
    results_router,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown tasks."""
    # Ensure local uploads directory and organized subdirectories exist
    for sub in ["", "notifications", "materials", "downloads"]:
        target_sub = os.path.join(settings.UPLOAD_DIR, sub) if sub else settings.UPLOAD_DIR
        os.makedirs(target_sub, exist_ok=True)
    
    # Create database tables if database is reachable and not running in test mode
    if not settings.TESTING:
        try:
            Base.metadata.create_all(bind=engine)
            print("[DATABASE] Connected and tables verified/created successfully.")
        except Exception as exc:
            print(f"[DATABASE WARNING] Could not connect to database on startup: {exc}")
            print("[DATABASE WARNING] Please ensure PostgreSQL is running and DATABASE_URL in .env is configured correctly.")
    
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Register slowapi rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded static files (PDFs, notes, images)
for sub in ["", "notifications", "materials", "downloads"]:
    target_sub = os.path.join(settings.UPLOAD_DIR, sub) if sub else settings.UPLOAD_DIR
    os.makedirs(target_sub, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API Routers (mounted under /api)
app.include_router(auth_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(study_materials_router, prefix="/api")
app.include_router(downloads_router, prefix="/api")
app.include_router(questions_router, prefix="/api")
app.include_router(mock_tests_router, prefix="/api")
app.include_router(attempts_router, prefix="/api")
app.include_router(practice_router, prefix="/api")
app.include_router(results_router, prefix="/api")

# Also include top-level aliases without /api prefix for flexible frontend/client routing
app.include_router(notifications_router, include_in_schema=False)
app.include_router(study_materials_router, include_in_schema=False)
app.include_router(downloads_router, include_in_schema=False)
app.include_router(questions_router, include_in_schema=False)
app.include_router(mock_tests_router, include_in_schema=False)
app.include_router(attempts_router, include_in_schema=False)
app.include_router(practice_router, include_in_schema=False)
app.include_router(results_router, include_in_schema=False)


@app.get("/", tags=["General"])
def root():
    """Root endpoint welcoming visitors and directing to interactive documentation."""
    return {
        "message": "Welcome to PGCET Student Portal API",
        "version": settings.VERSION,
        "documentation": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["General"])
def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
    }
