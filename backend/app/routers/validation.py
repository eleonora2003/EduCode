from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from time import time

from ..database import get_db
from ..models import Task
from ..services.sandbox_service import run_python_validation

router = APIRouter(
    prefix="/api/validation",
    tags=["Validation"]
)


@router.post("/validate-solution")
def validate_solution(task_id: int, db: Session = Depends(get_db)):

    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not task.solution or not task.tests:
        raise HTTPException(status_code=400, detail="Missing solution or tests. Save the task first.")

    language = (task.language or "Python").lower()
    if language != "python":
        raise HTTPException(
            status_code=400,
            detail=f"Validation is only supported for Python tasks (got {task.language}).",
        )

    task.status = "running"
    db.commit()

    start_time = time()

    result = run_python_validation(
        solution_code=task.solution,
        test_code=task.tests
    )

    execution_time = round(time() - start_time, 3)

    validation_result = {
        "passed": result["passed"],
        "logs": result["logs"],
        "execution_time": execution_time,
        "passed_tests": result["passed_tests"],
        "total_tests": result["total_tests"],
        "status": "passed" if result["passed"] else "failed",
    }

    task.is_validated = True
    task.status = "passed" if result["passed"] else "failed"
    task.execution_time = str(execution_time)
    task.validation_result = validation_result
    task.passed_tests = result["passed_tests"]
    task.total_tests = result["total_tests"]

    db.commit()
    db.refresh(task)

    return validation_result