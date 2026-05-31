from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    openai_api_key: str
    
    database_url: str = "postgresql://postgres:postgres@postgres:5432/tasksdb"
    
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    docker_socket: str = "/var/run/docker.sock"
    
    cors_origins: list = ["http://localhost:3000", "http://127.0.0.1:3000"]

    google_client_id: str = ""
    google_client_secret: str = ""

    github_client_id: str = ""
    github_client_secret: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()