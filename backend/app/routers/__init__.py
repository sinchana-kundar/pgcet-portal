from app.routers.auth import router as auth_router
from app.routers.notifications import router as notifications_router
from app.routers.study_materials import router as study_materials_router
from app.routers.downloads import router as downloads_router
from app.routers.questions import router as questions_router
from app.routers.mock_tests import router as mock_tests_router
from app.routers.attempts import router as attempts_router
from app.routers.practice import router as practice_router
from app.routers.results import router as results_router

__all__ = [
    "auth_router",
    "notifications_router",
    "study_materials_router",
    "downloads_router",
    "questions_router",
    "mock_tests_router",
    "attempts_router",
    "practice_router",
    "results_router",
]
