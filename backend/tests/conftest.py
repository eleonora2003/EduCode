import os
import pytest
from unittest.mock import MagicMock, patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("OPENAI_API_KEY", "test-openai-key")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

from app.database import Base, get_db
from app.models import User, Task, Template
from app.config import settings


SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=None
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def test_engine():
    """Create test database engine."""
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session(test_engine):
    """Create a fresh database session for each test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def mock_db():
    """Mock database session for unit tests."""
    db = MagicMock()
    return db


@pytest.fixture()
def sample_user():
    """Sample user data for testing."""
    return {
        "id": 1,
        "email": "test@example.com",
        "hashed_password": "placeholder_hash",
        "full_name": "Test User",
        "role": "teacher",
        "is_active": True
    }


@pytest.fixture()
def sample_task():
    """Sample task data for testing."""
    return {
        "id": 1,
        "user_id": 1,
        "title": "Test Task",
        "description": "Test Description",
        "language": "Python",
        "concept": "Loops",
        "difficulty": "Basic",
        "status": "pending",
        "is_validated": False
    }


@pytest.fixture()
def sample_template():
    """Sample template data for testing."""
    return {
        "template_id": 1,
        "user_id": 1,
        "name": "Test Template",
        "description": "Test Description",
        "difficulty": "Basic",
        "concept": "Loops"
    }


@pytest.fixture()
def mock_settings(monkeypatch):
    """Mock settings for testing."""
    monkeypatch.setattr(settings, "secret_key", "test-secret-key")
    monkeypatch.setattr(settings, "algorithm", "HS256")
    monkeypatch.setattr(settings, "access_token_expire_minutes", 30)
    return settings