from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=72)
    
    @field_validator('password')
    @classmethod
    def validate_password_length(cls, v):
        if len(v) > 72:
            raise ValueError('Password cannot exceed 72 characters')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


# ============ Task Schemas ============

class TaskBase(BaseModel):
    title: str
    description: str
    language: str
    concept: str
    difficulty: str
    template_name: Optional[str] = None
    examples: Optional[str] = None
    solution: Optional[str] = None
    tests: Optional[str] = None

    @field_validator('language')
    @classmethod
    def validate_language(cls, v):
        allowed_languages = ['Python', 'Java']
        if v not in allowed_languages:
            raise ValueError(f'Language must be one of: {", ".join(allowed_languages)}. The system currently supports only Python and Java.')
        return v

    @field_validator('difficulty')
    @classmethod
    def validate_difficulty(cls, v):
        allowed_difficulties = ['Basic', 'Intermediate', 'Advanced']
        if v not in allowed_difficulties:
            raise ValueError(f'Difficulty must be one of: {", ".join(allowed_difficulties)}')
        return v


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    solution: Optional[str] = None
    tests: Optional[str] = None
    status: Optional[str] = None
    is_validated: Optional[bool] = None
    validation_result: Optional[dict] = None
    passed_tests: Optional[int] = None
    total_tests: Optional[int] = None
    execution_time: Optional[str] = None


class TaskResponse(TaskBase):
    id: int
    user_id: int
    is_validated: bool
    validation_result: Optional[dict] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    execution_time: Optional[str] = None
    status: Optional[str] = None
    passed_tests: Optional[int] = 0
    total_tests: Optional[int] = 0

    class Config:
        from_attributes = True


class TaskGenerateRequest(BaseModel):
    language: str
    concept: str
    difficulty: str
    template: str = "Default Template"
    template_id: Optional[int] = None

    @field_validator('language')
    @classmethod
    def validate_language(cls, v):
        allowed_languages = ['Python', 'Java']
        if v not in allowed_languages:
            raise ValueError(f'Language must be one of: {", ".join(allowed_languages)}. The system currently supports only Python and Java.')
        return v


class TaskGenerateResponse(BaseModel):
    title: str
    description: str
    examples: Optional[str] = None
    solution: Optional[str] = None
    tests: Optional[str] = None


class ValidationFixResponse(BaseModel):
    solution: str
    tests: str
    explanation: Optional[str] = None
    message: str


# ============ Template Schemas ============

class TemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    difficulty: str
    concept: str


class TemplateCreate(TemplateBase):
    pass


class TemplateResponse(TemplateBase):
    template_id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ============ Export Schemas ============

class ExportRequest(BaseModel):
    task_ids: List[int]
    format: str  # pdf, markdown, moodle_xml

    @field_validator('format')
    @classmethod
    def validate_format(cls, v):
        allowed_formats = ['pdf', 'markdown', 'moodle_xml']
        if v not in allowed_formats:
            raise ValueError(f'Format must be one of: {", ".join(allowed_formats)}')
        return v


# ============ Statistics Schemas ============

class TaskStatistics(BaseModel):
    total_tasks: int
    validated_tasks: int
    failed_tasks: int
    pending_tasks: int


class ValidationStatistics(BaseModel):
    total_validations: int
    passed: int
    failed: int
    average_execution_time: float


# ============ Chat Schemas ============

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


class ChatResponse(BaseModel):
    reply: str
