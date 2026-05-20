from fastapi import APIRouter, Depends, HTTPException, Response
from typing import List
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Task
from ..schemas import ExportRequest
from ..auth import get_current_user
from ..services.task_service import TaskService
from ..services.export_service import ExportService

router = APIRouter(prefix="/api/export", tags=["Export"])


@router.post("")
def export_tasks(
    request: ExportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export tasks in the specified format.
    
    - **task_ids**: List of task IDs to export
    - **format**: Export format (pdf, markdown, moodle_xml)
    
    Returns the exported content in the requested format.
    """
    # Get all tasks and verify ownership
    tasks = []
    for task_id in request.task_ids:
        task = TaskService.get_task(db=db, task_id=task_id, user_id=current_user.id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with ID {task_id} not found"
            )
        tasks.append(task)
    
    if not tasks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No tasks to export"
        )
    
    # Export based on format
    filename = ExportService.get_export_filename(request.format)
    
    if request.format == "pdf":

        pdf_bytes = ExportService.export_to_pdf(tasks)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    
    elif request.format == "markdown":

        markdown_content = ExportService.export_to_markdown(tasks)
        return Response(
            content=markdown_content,
            media_type="text/markdown",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    
    elif request.format == "moodle_xml":

        xml_content = ExportService.export_to_moodle_xml(tasks)
        return Response(
            content=xml_content,
            media_type="application/xml",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported export format: {request.format}"
        )


@router.get("/{task_id}/markdown")
def export_task_markdown(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export a single task as Markdown.
    """
    task = TaskService.get_task(db=db, task_id=task_id, user_id=current_user.id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    markdown_content = ExportService.export_to_markdown([task])
    filename = ExportService.get_export_filename("markdown")
    
    return Response(
        content=markdown_content,
        media_type="text/markdown",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/{task_id}/pdf")
def export_task_pdf(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export a single task as PDF.
    """
    task = TaskService.get_task(db=db, task_id=task_id, user_id=current_user.id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    pdf_bytes = ExportService.export_to_pdf([task])
    filename = ExportService.get_export_filename("pdf")
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )