import pytest
from datetime import datetime
from pydantic import ValidationError

from app.schemas import (
    UserBase, UserCreate, UserLogin, UserResponse, UserUpdate,
    Token, TokenData,
    TaskBase, TaskCreate, TaskUpdate, TaskResponse, TaskGenerateRequest, TaskGenerateResponse,
    TemplateBase, TemplateCreate, TemplateResponse,
    ExportRequest,
    TaskStatistics, ValidationStatistics,
)


class TestUserBase:
    """Tests for UserBase schema."""
    
    def test_valid_user_base(self):
        """Should create valid UserBase."""
        user = UserBase(email="test@example.com")
        assert user.email == "test@example.com"
        assert user.full_name is None
    
    def test_user_base_with_full_name(self):
        """Should accept full_name."""
        user = UserBase(email="test@example.com", full_name="Test User")
        assert user.full_name == "Test User"
    
    def test_invalid_email(self):
        """Should reject invalid email."""
        with pytest.raises(ValidationError):
            UserBase(email="invalid-email")


class TestUserCreate:
    """Tests for UserCreate schema."""
    
    def test_valid_user_create(self):
        """Should create valid UserCreate."""
        user = UserCreate(email="test@example.com", password="password123")
        assert user.email == "test@example.com"
        assert user.password == "password123"
    
    def test_password_min_length(self):
        """Should require minimum 8 characters for password."""
        with pytest.raises(ValidationError):
            UserCreate(email="test@example.com", password="short")
    
    def test_password_max_length(self):
        """Should reject password exceeding 72 characters."""
        long_password = "a" * 73
        with pytest.raises(ValidationError):
            UserCreate(email="test@example.com", password=long_password)
    
    def test_password_exactly_72_chars(self):
        """Should accept password of exactly 72 characters."""
        password = "a" * 72
        user = UserCreate(email="test@example.com", password=password)
        assert user.password == password


class TestUserLogin:
    """Tests for UserLogin schema."""
    
    def test_valid_login(self):
        """Should create valid UserLogin."""
        login = UserLogin(email="test@example.com", password="password123")
        assert login.email == "test@example.com"
        assert login.password == "password123"
    
    def test_invalid_email(self):
        """Should reject invalid email."""
        with pytest.raises(ValidationError):
            UserLogin(email="invalid", password="password123")


class TestUserResponse:
    """Tests for UserResponse schema."""
    
    def test_valid_user_response(self):
        """Should create valid UserResponse."""
        user = UserResponse(
            id=1,
            email="test@example.com",
            role="teacher",
            is_active=True,
            created_at=datetime.now()
        )
        assert user.id == 1
        assert user.email == "test@example.com"
        assert user.role == "teacher"
        assert user.is_active is True


class TestToken:
    """Tests for Token schema."""
    
    def test_valid_token(self):
        """Should create valid Token."""
        token = Token(access_token="abc123", token_type="bearer")
        assert token.access_token == "abc123"
        assert token.token_type == "bearer"


class TestTokenData:
    """Tests for TokenData schema."""
    
    def test_valid_token_data(self):
        """Should create valid TokenData."""
        data = TokenData(email="test@example.com")
        assert data.email == "test@example.com"
    
    def test_empty_token_data(self):
        """Should allow empty email."""
        data = TokenData()
        assert data.email is None


class TestTaskBase:
    """Tests for TaskBase schema."""
    
    def test_valid_task_base(self):
        """Should create valid TaskBase."""
        task = TaskBase(
            title="Test Task",
            description="Test Description",
            language="Python",
            concept="Loops",
            difficulty="Basic"
        )
        assert task.title == "Test Task"
        assert task.language == "Python"
        assert task.difficulty == "Basic"
    
    def test_invalid_language(self):
        """Should reject invalid language."""
        with pytest.raises(ValidationError):
            TaskBase(
                title="Test",
                description="Test",
                language="C++",
                concept="Loops",
                difficulty="Basic"
            )
    
    def test_invalid_difficulty(self):
        """Should reject invalid difficulty."""
        with pytest.raises(ValidationError):
            TaskBase(
                title="Test",
                description="Test",
                language="Python",
                concept="Loops",
                difficulty="Expert"
            )
    
    def test_optional_fields(self):
        """Should accept optional fields."""
        task = TaskBase(
            title="Test",
            description="Test",
            language="Python",
            concept="Loops",
            difficulty="Basic",
            template_name="Custom",
            examples="Example 1",
            solution="def solution(): pass",
            tests="assert True"
        )
        assert task.template_name == "Custom"
        assert task.examples == "Example 1"
        assert task.solution == "def solution(): pass"
        assert task.tests == "assert True"


class TestTaskCreate:
    """Tests for TaskCreate schema."""
    
    def test_valid_task_create(self):
        """Should create valid TaskCreate."""
        task = TaskCreate(
            title="Test",
            description="Test",
            language="Python",
            concept="Loops",
            difficulty="Basic"
        )
        assert task.title == "Test"


class TestTaskUpdate:
    """Tests for TaskUpdate schema."""
    
    def test_valid_task_update(self):
        """Should create valid TaskUpdate with optional fields."""
        update = TaskUpdate(title="New Title")
        assert update.title == "New Title"
        assert update.description is None
    
    def test_partial_update(self):
        """Should allow partial updates."""
        update = TaskUpdate(description="New description")
        assert update.description == "New description"
        assert update.title is None


class TestTaskGenerateRequest:
    """Tests for TaskGenerateRequest schema."""
    
    def test_valid_request(self):
        """Should create valid TaskGenerateRequest."""
        request = TaskGenerateRequest(
            language="Python",
            concept="Loops",
            difficulty="Basic"
        )
        assert request.language == "Python"
        assert request.template == "Default Template"
        assert request.template_id is None
    
    def test_with_template_id(self):
        """Should accept template_id."""
        request = TaskGenerateRequest(
            language="Python",
            concept="Loops",
            difficulty="Basic",
            template_id=5
        )
        assert request.template_id == 5
    
    def test_invalid_language(self):
        """Should reject invalid language."""
        with pytest.raises(ValidationError):
            TaskGenerateRequest(
                language="JavaScript",
                concept="Loops",
                difficulty="Basic"
            )


class TestTaskGenerateResponse:
    """Tests for TaskGenerateResponse schema."""
    
    def test_valid_response(self):
        """Should create valid TaskGenerateResponse."""
        response = TaskGenerateResponse(
            title="Test Task",
            description="Test Description"
        )
        assert response.title == "Test Task"
        assert response.description == "Test Description"
    
    def test_with_optional_fields(self):
        """Should accept optional fields."""
        response = TaskGenerateResponse(
            title="Test",
            description="Test",
            examples="Example",
            solution="def solution(): pass",
            tests="assert True"
        )
        assert response.examples == "Example"
        assert response.solution == "def solution(): pass"
        assert response.tests == "assert True"


class TestTemplateBase:
    """Tests for TemplateBase schema."""
    
    def test_valid_template(self):
        """Should create valid TemplateBase."""
        template = TemplateBase(
            name="Test Template",
            difficulty="Basic",
            concept="Loops"
        )
        assert template.name == "Test Template"
        assert template.difficulty == "Basic"
        assert template.concept == "Loops"
    
    def test_with_description(self):
        """Should accept optional description."""
        template = TemplateBase(
            name="Test",
            difficulty="Basic",
            concept="Loops",
            description="A test template"
        )
        assert template.description == "A test template"


class TestExportRequest:
    """Tests for ExportRequest schema."""
    
    def test_valid_export_pdf(self):
        """Should create valid ExportRequest for PDF."""
        request = ExportRequest(task_ids=[1, 2, 3], format="pdf")
        assert request.task_ids == [1, 2, 3]
        assert request.format == "pdf"
    
    def test_valid_export_markdown(self):
        """Should create valid ExportRequest for Markdown."""
        request = ExportRequest(task_ids=[1], format="markdown")
        assert request.format == "markdown"
    
    def test_valid_export_moodle(self):
        """Should create valid ExportRequest for Moodle XML."""
        request = ExportRequest(task_ids=[1], format="moodle_xml")
        assert request.format == "moodle_xml"
    
    def test_invalid_format(self):
        """Should reject invalid format."""
        with pytest.raises(ValidationError):
            ExportRequest(task_ids=[1], format="html")
    
    def test_empty_task_ids(self):
        """Should accept empty task_ids list."""
        request = ExportRequest(task_ids=[], format="pdf")
        assert request.task_ids == []


class TestTaskStatistics:
    """Tests for TaskStatistics schema."""
    
    def test_valid_statistics(self):
        """Should create valid TaskStatistics."""
        stats = TaskStatistics(
            total_tasks=10,
            validated_tasks=5,
            failed_tasks=2,
            pending_tasks=3
        )
        assert stats.total_tasks == 10
        assert stats.validated_tasks == 5
        assert stats.failed_tasks == 2
        assert stats.pending_tasks == 3


class TestValidationStatistics:
    """Tests for ValidationStatistics schema."""
    
    def test_valid_validation_stats(self):
        """Should create valid ValidationStatistics."""
        stats = ValidationStatistics(
            total_validations=10,
            passed=7,
            failed=3,
            average_execution_time=1.5
        )
        assert stats.total_validations == 10
        assert stats.average_execution_time == 1.5
