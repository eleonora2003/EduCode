from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

from dotenv import load_dotenv
load_dotenv()

Base = declarative_base()

engine = None
SessionLocal = None


def init_db():
    global engine, SessionLocal

    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

    if DATABASE_URL.startswith("sqlite"):
        engine = create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False}
        )
    else:
        engine = create_engine(DATABASE_URL)

    SessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False
    )


def get_session_local():
    if SessionLocal is None:
        raise Exception("DB not initialized")
    return SessionLocal