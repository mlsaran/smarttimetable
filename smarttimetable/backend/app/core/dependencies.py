from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import verify_token
from app.db.database import get_db
from app.db import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> models.User:
    """
    Get the current authenticated user.
    """
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """
    Get the current authenticated user if they are active.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

def get_current_scheduler(
    current_user: models.User = Depends(get_current_active_user),
) -> models.User:
    """
    Get the current authenticated user if they have scheduler role.
    """
    if current_user.role != "scheduler":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

def get_current_approver(
    current_user: models.User = Depends(get_current_active_user),
) -> models.User:
    """
    Get the current authenticated user if they have approver role.
    """
    if current_user.role != "approver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

def get_current_scheduler_or_approver(
    current_user: models.User = Depends(get_current_active_user),
) -> models.User:
    """
    Get the current authenticated user if they have scheduler or approver role.
    """
    if current_user.role not in ["scheduler", "approver"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user
