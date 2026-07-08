from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserResponse, Token, UserLogin
from ..auth import (
    authenticate_user, 
    create_access_token, 
    get_password_hash,
    get_current_user
)
from ..config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse)
def register(
    user: UserCreate,
    response: Response,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Register a new user or link password to an existing OAuth account.
    
    - **email**: User's email address (must be unique)
    - **password**: Password (minimum 8 characters)
    - **full_name**: Optional full name
    """
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        if existing_user.hashed_password is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        existing_user.hashed_password = get_password_hash(user.password)
        if user.full_name and not existing_user.full_name:
            existing_user.full_name = user.full_name
            
        db.commit()
        db.refresh(existing_user)
        
        response.status_code = status.HTTP_200_OK
        return existing_user
    
    db_user = User(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    response.status_code = status.HTTP_201_CREATED
    return db_user


@router.post("/login", response_model=Token)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Authenticate user and return JWT token.
    
    - **username**: User's email address
    - **password**: User's password
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login/json", response_model=Token)
def login_json(
    login_data: UserLogin,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Authenticate user with JSON body and return JWT token.
    
    - **email**: User's email address
    - **password**: User's password
    """
    user = authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Get current authenticated user information.
    
    Requires a valid JWT token in the Authorization header.
    """
    return current_user


@router.post("/logout")
def logout(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Logout current user (client should remove token).
    
    Note: JWT tokens are stateless, so logout is handled client-side
    by removing the token from storage.
    """
    return {"message": "Successfully logged out. Please remove the token from your client."}