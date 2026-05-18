from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi import Depends
from sqlalchemy.orm import Session
from openai import OpenAI
import os
import json
from database import init_db, get_db
import crud
from models import *
from auth.schemas import UserCreate, UserLogin, Token
from auth.crud import create_user, get_user_by_email
from auth.security import verify_password, create_access_token
from auth.dependencies import get_current_user


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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


@app.post("/register", response_model=dict)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    create_user(db, user)
    return {"message": "User created successfully"}


@app.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = get_user_by_email(db, user_credentials.email)
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/task")
def create_task(
    req: TaskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    template = crud.get_template(db, req.concept, req.difficulty)
    extra_rules = ""
    if template:
        extra_rules = f"Follow this teaching template:\n{template.description}"

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
        model="gpt-4o-mini",        
        messages=[
            {"role": "system", "content": "Return ONLY raw JSON. No markdown, no code blocks."},
            {"role": "user", "content": prompt}
        ]
    )

    content = response.choices[0].message.content.strip()
    
    if content.startswith("```"):
        content = content.replace("```json", "").replace("```", "").strip()

    try:
        data = json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON from AI: {content}")

    task = crud.create_task(
        db=db,
        title=data["title"],
        description=data["description"],
        difficulty=req.difficulty,
        user_id=current_user.user_id  
    )
    return task

@app.get("/tasks")
def read_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud.get_tasks_by_user(db, current_user.user_id)   # bomo dodali v crud


@app.get("/task/{task_id}")
def read_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = crud.get_task(db, task_id)
    if not task or task.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.put("/task/{task_id}")
def update_task(
    task_id: int,
    req: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = crud.get_task(db, task_id)
    if not task or task.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Task not found")
    
    updated = crud.update_task(db, task_id, req.title, req.description)
    return updated

@app.delete("/task/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = crud.get_task(db, task_id)
    if not task or task.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Task not found")
    
    deleted = crud.delete_task(db, task_id)
    return {"message": "Task deleted successfully"}

# @app.get("/test-db")
# def test_db(db: Session = Depends(get_db)):
#     return {"status": "db works"}