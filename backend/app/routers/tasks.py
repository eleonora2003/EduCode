from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import (
    TaskCreate, TaskResponse, TaskUpdate, 
    TaskGenerateRequest, TaskGenerateResponse,
    TaskStatistics
)
from ..auth import get_current_user
from ..services.task_service import TaskService
from ..services.generation_service import generation_service

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


@router.post("/generate", response_model=TaskGenerateResponse)
def generate_task(
    request: TaskGenerateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate a new programming task using AI.
    
    - **language**: Programming language (Python or Java)
    - **concept**: Programming concept to focus on
    - **difficulty**: Difficulty level (Basic, Intermediate, Advanced)
    - **template**: Template style (optional)
    
    This endpoint uses OpenAI to generate a complete task with description,
    solution, and tests. The task is NOT automatically saved - use the
    POST /api/tasks endpoint to save it.
    """
    result = generation_service.generate_task(
        language=request.language,
        concept=request.concept,
        difficulty=request.difficulty,
        template_name=request.template
    )
    
    return TaskGenerateResponse(**result)


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create and save a new task.
    
    The task will be associated with the currently authenticated user.
    """
    return TaskService.create_task(db=db, task=task, user_id=current_user.id)


@router.get("", response_model=List[TaskResponse])
def get_tasks(
    language: Optional[str] = Query(None),
    concept: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all tasks for the current user.
    
    Optional filters:
    - **language**: Filter by programming language
    - **concept**: Filter by programming concept
    - **difficulty**: Filter by difficulty level
    """
    return TaskService.get_tasks(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        language=language,
        concept=concept,
        difficulty=difficulty
    )


@router.get("/statistics", response_model=TaskStatistics)
def get_task_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get statistics about the current user's tasks.
    """
    return TaskService.get_task_statistics(user_id=current_user.id, db=db)


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific task by ID.
    
    Only returns tasks owned by the current user.
    """
    task = TaskService.get_task(db=db, task_id=task_id, user_id=current_user.id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an existing task.
    
    Only allows updating tasks owned by the current user.
    """
    updated_task = TaskService.update_task(
        db=db,
        task_id=task_id,
        user_id=current_user.id,
        task_update=task_update
    )
    if not updated_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return updated_task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a task.
    
    Only allows deleting tasks owned by the current user.
    """
    success = TaskService.delete_task(
        db=db,
        task_id=task_id,
        user_id=current_user.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )