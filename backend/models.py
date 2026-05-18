from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Language(Base):
    __tablename__ = "languages"

    language_id = Column(Integer, primary_key=True)
    name = Column(String)
    version = Column(String)
    supported = Column(Boolean, default=True)


class Template(Base):
    __tablename__ = "templates"

    template_id = Column(Integer, primary_key=True)
    name = Column(String)
    description = Column(Text)
    difficulty = Column(String)
    concept = Column(String)


class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(Integer, primary_key=True)
    title = Column(String)
    description = Column(Text)
    difficulty = Column(String)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.user_id"))
    language_id = Column(Integer, ForeignKey("languages.language_id"))
    template_id = Column(Integer, ForeignKey("templates.template_id"))


class TestCase(Base):
    __tablename__ = "test_cases"

    test_id = Column(Integer, primary_key=True)
    input = Column(Text)
    expected_output = Column(Text)
    task_id = Column(Integer, ForeignKey("tasks.task_id"))


class Solution(Base):
    __tablename__ = "solutions"

    solution_id = Column(Integer, primary_key=True)
    code = Column(Text)
    task_id = Column(Integer, ForeignKey("tasks.task_id"))


class ValidationResult(Base):
    __tablename__ = "validation_results"

    validation_id = Column(Integer, primary_key=True)
    status = Column(String)
    execution_time = Column(String)
    memory_usage = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    task_id = Column(Integer, ForeignKey("tasks.task_id"))