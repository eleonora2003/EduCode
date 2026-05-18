from sqlalchemy.orm import Session
from models import Task, Template

def create_task(db: Session, title: str, description: str, difficulty: str, user_id: int):
    new_task = Task(
        title=title,
        description=description,
        difficulty=difficulty,
        status="generated",
        user_id=user_id
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

def get_task(db: Session, task_id: int):
    return db.query(Task).filter(Task.task_id == task_id).first()


def get_tasks(db: Session):
    return db.query(Task).all()

def update_task(db: Session, task_id: int, title: str, description: str):
    task = db.query(Task).filter(Task.task_id == task_id).first()

    if not task:
        return None

    task.title = title
    task.description = description
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task_id: int):
    task = db.query(Task).filter(Task.task_id == task_id).first()

    if not task:
        return None

    db.delete(task)
    db.commit()
    return task


def get_template(db, concept, difficulty):
    return db.query(Template).filter(
        Template.concept == concept,
        Template.difficulty == difficulty
    ).first()

def get_tasks_by_user(db: Session, user_id: int):
    return db.query(Task).filter(Task.user_id == user_id).all()