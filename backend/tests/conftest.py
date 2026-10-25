import os
import pytest

# Ensure test mode is flagged before settings initialization
os.environ["TESTING"] = "true"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
import app.models  # Ensure all models are registered
from app.main import app

# Create in-memory SQLite database for isolated test execution
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


from app.config import get_settings

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create tables before test suite and drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    # Clean up any test files created in uploads/
    settings = get_settings()
    if os.path.exists(settings.UPLOAD_DIR):
        for root, _, files in os.walk(settings.UPLOAD_DIR):
            for f in files:
                if f != ".gitkeep":
                    try:
                        os.remove(os.path.join(root, f))
                    except Exception:
                        pass



@pytest.fixture()
def db_session():
    """Provides a transactional database session per test function."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
