from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from .database import Base


class UserRole(str, enum.Enum):
    """User roles in the system."""
    TEACHER = "teacher"
    ADMIN = "admin"


class User(Base):
    """User model for authentication and task ownership."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.TEACHER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    tasks = relationship("Task", back_populates="owner", cascade="all, delete-orphan")
    templates = relationship("Template", back_populates="owner", cascade="all, delete-orphan")


class Template(Base):
    """Custom template model - stores user-created task templates."""
    __tablename__ = "templates"

    template_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(String(20), nullable=False)
    concept = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    owner = relationship("User", back_populates="templates")


class Task(Base):
    """Programming task model - stores generated tasks."""
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    language = Column(String(50), nullable=False)
    concept = Column(String(100), nullable=False)  
    difficulty = Column(String(20), nullable=False)  
    template_name = Column(String(100), nullable=True)
    examples = Column(Text, nullable=True)
    solution = Column(Text, nullable=True)
    tests = Column(Text, nullable=True)
    is_validated = Column(Boolean, default=False, nullable=False)
    validation_result = Column(JSON, nullable=True)  
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    owner = relationship("User", back_populates="tasks")
