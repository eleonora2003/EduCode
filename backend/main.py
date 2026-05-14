from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi import Depends
from sqlalchemy.orm import Session
from openai import OpenAI
import os
import json
from database import SessionLocal, get_session_local, init_db
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
    SessionLocalLocal = get_session_local()
    db = SessionLocalLocal()
    try:
        yield db
    finally:
        db.close()

class TaskRequest(BaseModel):
    language: str
    concept: str
    difficulty: str
    
class TaskUpdate(BaseModel):
    title: str
    description: str

@app.on_event("startup")
def startup():
    init_db()
    
@app.get("/")
def root():
    return {"status": "backend running"}


# @app.post("/generate-task")
# def generate_task(req: TaskRequest):

#     prompt = f"""
#     Create a programming exercise.

#     Language: {req.language}
#     Concept: {req.concept}
#     Difficulty: {req.difficulty}

#     Provide only the task description.
#     """

#     response = client.chat.completions.create(
#         model="gpt-4.1-mini",
#         messages=[
#             {"role": "system", "content": "You generate programming tasks for teachers."},
#             {"role": "user", "content": prompt}
#         ]
#     )

#     return {
#         "task": response.choices[0].message.content
#     }


@app.post("/task")
def create_task(req: TaskRequest, db: Session = Depends(get_db)):

    template = crud.get_template(db, req.concept, req.difficulty)

    extra_rules = ""
    if template:
        extra_rules = f"""
        Follow this teaching template:
        {template.description}
        """

    prompt = f"""
    Create a programming exercise.

    Language: {req.language}
    Concept: {req.concept}
    Difficulty: {req.difficulty}

    {extra_rules}

    Return ONLY JSON in this format:
    {{
      "title": "string",
      "description": "string"
    }}
    """

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "Return ONLY raw JSON. Do NOT use markdown or code blocks."
            },
            {"role": "user", "content": prompt}
        ]
    )

    content = response.choices[0].message.content
    print("AI RESPONSE:", content)

    if not content:
        raise HTTPException(status_code=500, detail="Empty response from AI")

    content = content.strip()

    if content.startswith("```"):
        content = content.replace("```json", "").replace("```", "").strip()

    try:
        data = json.loads(content)
    except Exception:
        raise HTTPException(status_code=500, detail=f"Invalid JSON from AI: {content}")

    task = crud.create_task(
        db,
        title=data["title"],
        description=data["description"],
        difficulty=req.difficulty
    )

    return task

@app.get("/task/{task_id}")
def read_task(task_id: int, db: Session = Depends(get_db)):
    return crud.get_task(db, task_id)

@app.get("/tasks")
def read_tasks(db: Session = Depends(get_db)):
    return crud.get_tasks(db)

@app.put("/task/{task_id}")
def update_task(task_id: int, req: TaskUpdate, db: Session = Depends(get_db)):
    updated = crud.update_task(db, task_id, req.title, req.description)

    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")

    return updated

@app.delete("/task/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_task(db, task_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")

    return {"message": "Task deleted"}

# @app.get("/test-db")
# def test_db(db: Session = Depends(get_db)):
#     return {"status": "db works"}