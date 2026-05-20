from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .database import engine, Base, init_db
from .routers import auth, tasks, export, templates

from .models import User, Task, Template


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler - initialize database on startup."""

    print("Starting up EduCode application...")
    init_db()
    print("Database initialized successfully!")
    yield

    print("Shutting down EduCode application...")


app = FastAPI(
    title="EduCode API",
    description="Intelligent tool for programming teachers to generate, validate, and export programming tasks",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    """Health check endpoint."""
    return {
        "status": "running",
        "application": "EduCode API",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy"}


app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(export.router)
app.include_router(templates.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)