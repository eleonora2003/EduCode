import re
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Template
from ..schemas import (
    TaskCreate, TaskResponse, TaskUpdate,
    TaskGenerateRequest, TaskGenerateResponse,
    TaskRefineRequest, TaskRefineResponse,
    TaskStatistics,
    ExerciseSeriesRequest, ExerciseSeriesResponse, ExerciseItem,
)
from ..auth import get_current_user
from ..services.task_service import TaskService
from ..services.generation_service import generation_service

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


def extract_language_from_description(description: str) -> str:
    if not description:
        return "Python"
    match = re.search(r"Language:\s*(\w+)", description, re.IGNORECASE)
    if match:
        lang = match.group(1).strip().lower()
        if lang == "python":
            return "Python"
        if lang == "java":
            return "Java"
    return "Python"


@router.post("/generate", response_model=TaskGenerateResponse)
def generate_task(
    request: TaskGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    selected_template = None
    template_name = request.template or "Default Template"
    language = request.language
    concept = request.concept
    difficulty = request.difficulty

    if request.template_id:
        selected_template = db.query(Template).filter(
            Template.template_id == request.template_id,
            Template.user_id == current_user.id
        ).first()

        if not selected_template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )

        language = language or extract_language_from_description(selected_template.description)
        concept = concept or selected_template.concept or "General"
        difficulty = difficulty or selected_template.difficulty or "Basic"

        template_name = f"""{selected_template.name}

Use this custom template:
{selected_template.description}
"""

    if not all([language, concept, difficulty]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing language, concept, or difficulty for generation",
        )

    result = generation_service.generate_task(
        language=language,
        concept=concept,
        difficulty=difficulty,
        template_name=template_name
    )

    return TaskGenerateResponse(
        title=result["title"],
        description=result["description"],
        examples=result.get("examples"),
        solution=result.get("solution"),
        tests=result.get("tests"),
        language=language,
        concept=concept,
        difficulty=difficulty,
    )


@router.post("/generate-series", response_model=ExerciseSeriesResponse)
def generate_exercise_series(
    request: ExerciseSeriesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a progressive exercise series (Exercise 1, 2, 3…)."""
    selected_template = None
    template_name = request.template or "Default Template"
    language = request.language
    concept = request.concept

    if request.template_id:
        selected_template = db.query(Template).filter(
            Template.template_id == request.template_id,
            Template.user_id == current_user.id,
        ).first()

        if not selected_template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found",
            )

        language = language or extract_language_from_description(selected_template.description)
        concept = concept or selected_template.concept or "General"
        template_name = f"""{selected_template.name}

Use this custom template:
{selected_template.description}
"""

    if not all([language, concept]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing language or concept for series generation",
        )

    result = generation_service.generate_exercise_series(
        language=language,
        concept=concept,
        template_name=template_name,
        exercise_count=request.exercise_count,
    )

    return ExerciseSeriesResponse(
        series_title=result["series_title"],
        language=result["language"],
        concept=result["concept"],
        exercises=[ExerciseItem(**ex) for ex in result["exercises"]],
    )


@router.post("/refine", response_model=TaskRefineResponse)
def refine_task_section(
    request: TaskRefineRequest,
    current_user: User = Depends(get_current_user),
):
    context = request.context.model_dump() if request.context else {}

    result = generation_service.refine_section(
        field=request.field,
        instruction=request.instruction,
        content=request.content,
        selected_text=request.selected_text,
        context=context,
    )

    if result.get("error"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to refine section: {result['error']}",
        )

    return TaskRefineResponse(
        field=result["field"],
        content=result["content"],
        tests=result.get("tests"),
    )


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
    return TaskService.get_task_statistics(user_id=current_user.id, db=db)


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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

    return None