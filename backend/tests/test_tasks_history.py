import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime

from app.services.task_service import TaskService


class TestTasksHistory:
    """Tests for tasks history (get_tasks) functionality."""
    
    @pytest.fixture
    def mock_db(self):
        """Create a mock database session."""
        db = MagicMock()
        db.query = MagicMock()
        return db
    
    @pytest.fixture
    def mock_task(self):
        """Create a mock task object."""
        task = MagicMock()
        task.id = 1
        task.user_id = 123
        task.language = "python"
        task.concept = "loops"
        task.difficulty = "easy"
        task.title = "Test Task"
        task.description = "A test task"
        task.test_cases = "assert True"
        task.expected_output = "True"
        task.is_validated = False
        task.validation_result = {}
        task.created_at = datetime(2024, 1, 15, 10, 30)
        return task
    
    def test_get_tasks_returns_user_tasks(self, mock_db, mock_task):
        """Should return all tasks for the specified user."""
        mock_query = MagicMock()
        mock_db.query.return_value.filter.return_value = mock_query
        mock_query.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_task]
        
        result = TaskService.get_tasks(db=mock_db, user_id=123)
        
        assert len(result) == 1
        assert result[0] == mock_task
        mock_db.query.assert_called_once()
    
    def test_get_tasks_filters_by_language(self, mock_db, mock_task):
        """Should filter tasks by language."""
        mock_query = MagicMock()
        mock_db.query.return_value.filter.return_value = mock_query
        mock_query.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_task]
        
        result = TaskService.get_tasks(db=mock_db, user_id=123, language="python")
        
        assert len(result) == 1

        assert mock_db.query.return_value.filter.call_count >= 1
    
    def test_get_tasks_filters_by_concept(self, mock_db, mock_task):
        """Should filter tasks by concept."""
        mock_query = MagicMock()
        mock_db.query.return_value.filter.return_value = mock_query
        mock_query.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_task]
        
        result = TaskService.get_tasks(db=mock_db, user_id=123, concept="loops")
        
        assert len(result) == 1
    
    def test_get_tasks_filters_by_difficulty(self, mock_db, mock_task):
        """Should filter tasks by difficulty."""
        mock_query = MagicMock()
        mock_db.query.return_value.filter.return_value = mock_query
        mock_query.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_task]
        
        result = TaskService.get_tasks(db=mock_db, user_id=123, difficulty="easy")
        
        assert len(result) == 1
    
    def test_get_tasks_applies_pagination(self, mock_db, mock_task):
        """Should apply pagination with skip and limit."""
        mock_query = MagicMock()
        mock_db.query.return_value.filter.return_value = mock_query
        mock_query.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_task]
        
        result = TaskService.get_tasks(db=mock_db, user_id=123, skip=10, limit=5)
        
        assert len(result) == 1

        mock_query.order_by.return_value.offset.assert_called_once_with(10)
        mock_query.order_by.return_value.offset.return_value.limit.assert_called_once_with(5)
    
    def test_get_tasks_orders_by_created_at_desc(self, mock_db, mock_task):
        """Should order tasks by created_at descending (newest first)."""
        mock_query = MagicMock()
        mock_db.query.return_value.filter.return_value = mock_query
        mock_query.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_task]
        
        result = TaskService.get_tasks(db=mock_db, user_id=123)
        
        assert len(result) == 1

        mock_query.order_by.assert_called_once()
    
    def test_get_tasks_with_multiple_filters(self, mock_db, mock_task):
        """Should apply multiple filters together."""
        # Build a proper mock chain for multiple filters
        mock_user_filter = MagicMock()
        mock_language_filter = MagicMock()
        mock_concept_filter = MagicMock()
        mock_difficulty_filter = MagicMock()
        mock_order = MagicMock()
        mock_offset = MagicMock()
        mock_limit = MagicMock()
        
        # Set up the chain: query().filter(user_id).filter(language).filter(concept).filter(difficulty).order_by().offset().limit().all()
        mock_db.query.return_value.filter.return_value = mock_user_filter
        mock_user_filter.filter.return_value = mock_language_filter
        mock_language_filter.filter.return_value = mock_concept_filter
        mock_concept_filter.filter.return_value = mock_difficulty_filter
        mock_difficulty_filter.order_by.return_value = mock_order
        mock_order.offset.return_value = mock_offset
        mock_offset.limit.return_value = mock_limit
        mock_limit.all.return_value = [mock_task]
        
        result = TaskService.get_tasks(
            db=mock_db, 
            user_id=123, 
            language="python",
            concept="loops",
            difficulty="easy"
        )
        
        assert len(result) == 1
        assert result[0] == mock_task
    
    def test_get_tasks_empty_result(self, mock_db):
        """Should return empty list when no tasks found."""
        mock_query = MagicMock()
        mock_db.query.return_value.filter.return_value = mock_query
        mock_query.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []
        
        result = TaskService.get_tasks(db=mock_db, user_id=123)
        
        assert len(result) == 0
        assert isinstance(result, list)
    
    def test_get_tasks_default_pagination(self, mock_db, mock_task):
        """Should use default skip=0 and limit=100."""
        mock_query = MagicMock()
        mock_db.query.return_value.filter.return_value = mock_query
        mock_query.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_task]
        
        result = TaskService.get_tasks(db=mock_db, user_id=123)
        
        assert len(result) == 1

        mock_query.order_by.return_value.offset.assert_called_once_with(0)
        mock_query.order_by.return_value.offset.return_value.limit.assert_called_once_with(100)