from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi import Depends
from sqlalchemy.orm import Session
from openai import OpenAI
import os
import json
from database import SessionLocal
import crud
from models import *


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class TaskRequest(BaseModel):
    language: str
    concept: str
    difficulty: str


@app.get("/")
def root():
    return {"status": "backend running"}


@app.post("/generate-task")
def generate_task(req: TaskRequest):

    prompt = f"""
    Create a programming exercise.

    Language: {req.language}
    Concept: {req.concept}
    Difficulty: {req.difficulty}

    Provide only the task description.
    """

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": "You generate programming tasks for teachers."},
            {"role": "user", "content": prompt}
        ]
    )

    return {
        "task": response.choices[0].message.content
    }


@app.post("/task")
def create_task(req: TaskRequest, db: Session = Depends(get_db)):

    prompt = f"""
    Create a programming exercise.

    Language: {req.language}
    Concept: {req.concept}
    Difficulty: {req.difficulty}

    Return JSON with:
    title, description
    """

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": "Return ONLY valid JSON."},
            {"role": "user", "content": prompt}
        ]
    )

    content = response.choices[0].message.content

    try:
        data = json.loads(content)
    except:
        raise HTTPException(status_code=500, detail="Invalid JSON from AI")

    task = crud.create_task(
        db,
        title=data["title"],
        description=data["description"]
    )

    return task

@app.get("/task/{task_id}")
def read_task(task_id: int, db: Session = Depends(get_db)):
    return crud.get_task(db, task_id)

@app.get("/tasks")
def read_tasks(db: Session = Depends(get_db)):
    return crud.get_tasks(db)

@app.put("/task/{task_id}")
def update_task(task_id: int, req: TaskRequest, db: Session = Depends(get_db)):
    updated = crud.update_task(db, task_id, req.language, req.concept)

    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")

    return updated

@app.delete("/task/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_task(db, task_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")

    return {"message": "Task deleted"}