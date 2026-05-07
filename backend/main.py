from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os

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