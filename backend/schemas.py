from pydantic import BaseModel


class TaskCreate(BaseModel):
    language: str
    concept: str
    difficulty: str


class TaskResponse(BaseModel):
    task: str