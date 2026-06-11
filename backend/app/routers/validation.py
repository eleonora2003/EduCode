from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from time import time

from ..database import get_db
from ..models import Task
from ..services.sandbox_service import run_python_validation, run_java_validation

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
        raise HTTPException(status_code=400, detail="Missing solution or tests")

    task.status = "running"
    db.commit()

    start_time = time()

    language = (task.language or "").strip().lower()

    if language == "python":
        result = run_python_validation(
            solution_code=task.solution,
            test_code=task.tests
        )
    elif language == "java":
        result = run_java_validation(
            solution_code=task.solution,
            test_code=task.tests
        )
    else:
        task.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {task.language}"
        )

    execution_time = round(time() - start_time, 3)

    validation_result = {
        "passed": result.get("passed", False),
        "logs": result.get("logs", ""),
        "execution_time": execution_time,
        "passed_tests": result.get("passed_tests", 0),
        "total_tests": result.get("total_tests", 0),
    }

    task.is_validated = True
    task.status = "passed" if validation_result["passed"] else "failed"
    task.execution_time = str(execution_time)
    task.validation_result = validation_result
    task.passed_tests = validation_result["passed_tests"]
    task.total_tests = validation_result["total_tests"]

    db.commit()
    db.refresh(task)

    return validation_result