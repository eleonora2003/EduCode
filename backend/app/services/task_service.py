from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import Task, User
from ..schemas import TaskCreate, TaskUpdate, TaskGenerateRequest


class TaskService:
    """Service layer for task operations."""
    
    @staticmethod
    def create_task(db: Session, task: TaskCreate, user_id: int) -> Task:
        """Create a new task for the current user."""
        db_task = Task(**task.model_dump(), user_id=user_id)
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task
    
    @staticmethod
    def get_task(db: Session, task_id: int, user_id: int) -> Optional[Task]:
        """Get a task by ID (only if owned by the user)."""
        return db.query(Task).filter(
            Task.id == task_id,
            Task.user_id == user_id
        ).first()
    
    @staticmethod
    def get_tasks(
        db: Session, 
        user_id: int, 
        skip: int = 0, 
        limit: int = 100,
        language: Optional[str] = None,
        concept: Optional[str] = None,
        difficulty: Optional[str] = None
    ) -> List[Task]:
        """Get all tasks for a user with optional filters."""
        query = db.query(Task).filter(Task.user_id == user_id)
        
        if language:
            query = query.filter(Task.language == language)
        if concept:
            query = query.filter(Task.concept == concept)
        if difficulty:
            query = query.filter(Task.difficulty == difficulty)
        
        return query.order_by(Task.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_task(
        db: Session, 
        task_id: int, 
        user_id: int, 
        task_update: TaskUpdate
    ) -> Optional[Task]:
        """Update a task (only if owned by the user)."""
        db_task = db.query(Task).filter(
            Task.id == task_id,
            Task.user_id == user_id
        ).first()
        
        if db_task:
            update_data = task_update.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_task, field, value)
            
            db.commit()
            db.refresh(db_task)
        
        return db_task
    
    @staticmethod
    def delete_task(db: Session, task_id: int, user_id: int) -> bool:
        """Delete a task (only if owned by the user)."""
        db_task = db.query(Task).filter(
            Task.id == task_id,
            Task.user_id == user_id
        ).first()
        
        if db_task:
            db.delete(db_task)
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_task_statistics(user_id: int, db: Session) -> dict:
        """Get statistics about tasks for a user."""
        total = db.query(Task).filter(Task.user_id == user_id).count()
        validated = db.query(Task).filter(
            Task.user_id == user_id,
            Task.is_validated == True
        ).count()
        failed = db.query(Task).filter(
            Task.user_id == user_id,
            Task.is_validated == True,
            Task.validation_result.op("->>")("status") == "failed"

        ).count()
        pending = total - validated
        
        return {
            "total_tasks": total,
            "validated_tasks": validated,
            "failed_tasks": failed,
            "pending_tasks": pending
        }
    
   
