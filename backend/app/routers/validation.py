from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from time import time

from ..auth import get_current_user
from ..database import get_db
from ..models import Task, User
from ..schemas import TaskUpdate, ValidationFixResponse
from ..services.generation_service import generation_service
from ..services.sandbox_service import (
    run_java_validation,
    run_python_validation,
    summarize_validation_failure,
)
from ..services.task_service import TaskService

router = APIRouter(
    prefix="/api/validation",
    tags=["Validation"]
)


def _run_validation_for_task(task: Task) -> dict:
    language = (task.language or "Python").strip().lower()

    if language == "java":
        return run_java_validation(
            solution_code=task.solution,
            test_code=task.tests,
        )

    return run_python_validation(
        solution_code=task.solution,
        test_code=task.tests,
    )


def _build_validation_result(task: Task, result: dict, execution_time: float) -> dict:
    passed = result["passed"]
    logs = result.get("logs") or "No output received"
    status_value = "passed" if passed else "failed"

    validation_result = {
        "passed": passed,
        "status": status_value,
        "logs": logs,
        "execution_time": execution_time,
        "passed_tests": result["passed_tests"],
        "total_tests": result["total_tests"],
        "language": task.language or "Python",
    }

    if not passed:
        validation_result["failure_reason"] = summarize_validation_failure(
            logs,
            task.language or "Python",
        )

    return validation_result


@router.post(
    "/validate-solution",
    responses={
        404: {"description": "Task not found"},
        400: {"description": "Missing code"}
    }
)
def validate_solution(
    task_id: int,
    force: Annotated[bool, Query()] = False,
    db: Annotated[Session, Depends(get_db)] = None,
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    task = TaskService.get_task(db=db, task_id=task_id, user_id=current_user.id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not task.solution or not task.tests:
        raise HTTPException(status_code=400, detail="Missing code")

    if (
        not force
        and task.status in ["passed", "failed"]
        and task.validation_result
        and task.status != "running"
    ):
        return task.validation_result

    task.status = "running"
    db.commit()

    start_time = time()
    result = _run_validation_for_task(task)
    execution_time = round(time() - start_time, 3)

    validation_result = _build_validation_result(task, result, execution_time)

    task.is_validated = True
    task.status = validation_result["status"]
    task.execution_time = str(execution_time)
    task.validation_result = validation_result
    task.passed_tests = result["passed_tests"]
    task.total_tests = result["total_tests"]

    db.commit()
    db.refresh(task)

    return validation_result


@router.post(
    "/fix-with-ai",
    response_model=ValidationFixResponse,
    responses={
        404: {"description": "Task not found"},
        400: {"description": "Missing code or task already passed validation"},
        502: {"description": "Failed to rewrite code"}
    }
)
def fix_validation_with_ai(
    task_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    task = TaskService.get_task(db=db, task_id=task_id, user_id=current_user.id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not task.solution or not task.tests:
        raise HTTPException(status_code=400, detail="Missing code")

    validation = task.validation_result or {}
    if validation.get("passed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task already passed validation",
        )

    fix_result = generation_service.fix_validation_failure(
        title=task.title,
        description=task.description or "",
        examples=task.examples or "",
        language=task.language or "Python",
        concept=task.concept or "General",
        difficulty=task.difficulty or "Basic",
        solution=task.solution,
        tests=task.tests,
        validation_logs=validation.get("logs") or "",
        failure_reason=validation.get("failure_reason") or "",
    )

    if fix_result.get("error"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to rewrite code: {fix_result['error']}",
        )

    TaskService.update_task(
        db=db,
        task_id=task_id,
        user_id=current_user.id,
        task_update=TaskUpdate(
            solution=fix_result["solution"],
            tests=fix_result["tests"],
            status="pending",
            is_validated=False,
            validation_result=None,
            passed_tests=0,
            total_tests=0,
            execution_time=None,
        ),
    )

    return ValidationFixResponse(
        solution=fix_result["solution"],
        tests=fix_result["tests"],
        explanation=fix_result.get("explanation"),
        message="Solution and tests rewritten. Run validation again to verify.",
    )