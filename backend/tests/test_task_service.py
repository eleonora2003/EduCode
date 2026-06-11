import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime

from app.services.task_service import TaskService
from app.models import Task
from app.schemas import TaskCreate, TaskUpdate


class TestTaskServiceCreateTask:
    """Tests for TaskService.create_task method."""
    
    def test_create_task_success(self, mock_db):
        """Should create and return a new task."""
        task_data = TaskCreate(
            title="Test Task",
            description="Test Description",
            language="Python",
            concept="Loops",
            difficulty="Basic"
        )
        
        mock_task = MagicMock(spec=Task)
        mock_task.id = 1
        mock_task.user_id = 1
        mock_task.title = "Test Task"
        
        mock_db.add = MagicMock()
        mock_db.commit = MagicMock()
        mock_db.refresh = MagicMock()
        
        with patch('app.services.task_service.Task', return_value=mock_task):
            result = TaskService.create_task(db=mock_db, task=task_data, user_id=1)
            
            assert result == mock_task
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once()
    
    def test_create_task_sets_user_id(self, mock_db):
        """Should set user_id on the task."""
        task_data = TaskCreate(
            title="Test",
            description="Test",
            language="Python",
            concept="Loops",
            difficulty="Basic"
        )
        
        mock_task = MagicMock(spec=Task)
        
        with patch('app.services.task_service.Task', return_value=mock_task) as mock_task_class:
            TaskService.create_task(db=mock_db, task=task_data, user_id=5)
            
            call_kwargs = mock_task_class.call_args[1]
            assert call_kwargs['user_id'] == 5


class TestTaskServiceGetTask:
    """Tests for TaskService.get_task method."""
    
    def test_get_task_found(self, mock_db):
        """Should return task if found and owned by user."""
        mock_task = MagicMock(spec=Task)
        mock_task.id = 1
        mock_task.user_id = 1
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_task
        
        result = TaskService.get_task(db=mock_db, task_id=1, user_id=1)
        
        assert result == mock_task
        mock_db.query.return_value.filter.return_value.first.assert_called_once()
    
    def test_get_task_not_found(self, mock_db):
        """Should return None if task not found."""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = TaskService.get_task(db=mock_db, task_id=999, user_id=1)
        
        assert result is None
    
    def test_get_task_wrong_user(self, mock_db):
        """Should return None if task belongs to different user."""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = TaskService.get_task(db=mock_db, task_id=1, user_id=2)
        
        assert result is None


class TestTaskServiceUpdateTask:
    """Tests for TaskService.update_task method."""
    
    def test_update_task_success(self, mock_db):
        """Should update task and return it."""
        mock_task = MagicMock(spec=Task)
        mock_task.id = 1
        mock_task.user_id = 1
        mock_task.title = "Old Title"
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_task
        mock_db.commit = MagicMock()
        mock_db.refresh = MagicMock()
        
        update_data = TaskUpdate(title="New Title")
        
        result = TaskService.update_task(
            db=mock_db,
            task_id=1,
            user_id=1,
            task_update=update_data
        )
        
        assert result == mock_task
        assert mock_task.title == "New Title"
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    def test_update_task_not_found(self, mock_db):
        """Should return None if task not found."""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        update_data = TaskUpdate(title="New Title")
        
        result = TaskService.update_task(
            db=mock_db,
            task_id=999,
            user_id=1,
            task_update=update_data
        )
        
        assert result is None
        mock_db.commit.assert_not_called()
    
    def test_update_task_multiple_fields(self, mock_db):
        """Should update multiple fields."""
        mock_task = MagicMock(spec=Task)
        mock_task.id = 1
        mock_task.user_id = 1
        mock_task.title = "Old"
        mock_task.description = "Old"
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_task
        mock_db.commit = MagicMock()
        mock_db.refresh = MagicMock()
        
        update_data = TaskUpdate(title="New Title", description="New Description")
        
        result = TaskService.update_task(
            db=mock_db,
            task_id=1,
            user_id=1,
            task_update=update_data
        )
        
        assert result == mock_task
        assert mock_task.title == "New Title"
        assert mock_task.description == "New Description"


class TestTaskServiceDeleteTask:
    """Tests for TaskService.delete_task method."""
    
    def test_delete_task_success(self, mock_db):
        """Should delete task and return True."""
        mock_task = MagicMock(spec=Task)
        mock_task.id = 1
        mock_task.user_id = 1
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_task
        mock_db.delete = MagicMock()
        mock_db.commit = MagicMock()
        
        result = TaskService.delete_task(db=mock_db, task_id=1, user_id=1)
        
        assert result is True
        mock_db.delete.assert_called_once_with(mock_task)
        mock_db.commit.assert_called_once()
    
    def test_delete_task_not_found(self, mock_db):
        """Should return False if task not found."""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_db.delete = MagicMock()
        mock_db.commit = MagicMock()
        
        result = TaskService.delete_task(db=mock_db, task_id=999, user_id=1)
        
        assert result is False
        mock_db.delete.assert_not_called()
        mock_db.commit.assert_not_called()


class TestTaskServiceGetTaskStatistics:
    """Tests for TaskService.get_task_statistics method."""
    
    def test_statistics_empty(self, mock_db):
        """Should return zeros for empty user."""
        mock_db.query.return_value.filter.return_value.count.return_value = 0
        
        result = TaskService.get_task_statistics(user_id=1, db=mock_db)
        
        assert result["total_tasks"] == 0
        assert result["validated_tasks"] == 0
        assert result["failed_tasks"] == 0
        assert result["pending_tasks"] == 0
    
    def test_statistics_with_tasks(self, mock_db):
        """Should return correct statistics."""

        mock_db.query.return_value.filter.return_value.count.return_value = 10
        
        result = TaskService.get_task_statistics(user_id=1, db=mock_db)
        
        assert result["total_tasks"] == 10
    
    def test_statistics_pending_calculation(self, mock_db):
        """Should correctly calculate pending tasks."""
        # Setup: total=10, validated=6
        mock_db.query.return_value.filter.return_value.count.return_value = 10
        
        result = TaskService.get_task_statistics(user_id=1, db=mock_db)
        
        assert result["pending_tasks"] == result["total_tasks"] - result["validated_tasks"]