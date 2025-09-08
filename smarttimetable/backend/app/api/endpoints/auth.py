from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core import security
from app.core.config import settings
from app.db.database import get_db
from app.db import models
from app.schemas import user as schemas
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")

# Store OTPs temporarily in memory (in production, use Redis)
active_otps = {}

@router.post("/login/", response_model=schemas.UserResponse)
def login_request(
    *,
    db: Session = Depends(get_db),
    login_data: schemas.UserLogin
) -> Any:
    """
    Request login with email (sends OTP)
    """
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    
    if not user:
        # Create new user with read-only access if not exists
        user = models.User(email=login_data.email, role="readonly", is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Generate OTP
    otp = ''.join(secrets.choice('0123456789') for _ in range(6))
    active_otps[login_data.email] = otp
    
    # Send OTP email (mocked for development)
    # _send_otp_email(login_data.email, otp)
    
    return user

@router.post("/verify-otp/", response_model=schemas.Token)
def verify_otp(
    *,
    db: Session = Depends(get_db),
    email: str,
    otp: str
) -> Any:
    """
    Verify OTP and return access token
    """
    if email not in active_otps or active_otps[email] != otp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP",
        )
    
    # Clear used OTP
    del active_otps[email]
    
    # Get user and create access token
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

def _send_otp_email(email: str, otp: str) -> None:
    """
    Send OTP via email (mocked implementation)
    """
    # In a real implementation, you would use SMTP or an email service
    print(f"[MOCK EMAIL] Sending OTP {otp} to {email}")
    # For a real implementation:
    # msg = MIMEMultipart()
    # msg['From'] = 'noreply@smarttimetable.com'
    # msg['To'] = email
    # msg['Subject'] = 'Your SmartTimetable Login OTP'
    # body = f'Your OTP code is: {otp}. It will expire in 10 minutes.'
    # msg.attach(MIMEText(body, 'plain'))
    # 
    # server = smtplib.SMTP('smtp.example.com', 587)
    # server.starttls()
    # server.login('username', 'password')
    # server.send_message(msg)
    # server.quit()

@router.get("/me/", response_model=schemas.UserResponse)
def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> Any:
    """
    Get current user information
    """
    payload = security.verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return user


def get_current_active_user(
    current_user: schemas.UserResponse = Depends(get_current_user),
) -> schemas.UserResponse:
    """
    Get current active user
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    return current_user


def get_scheduler_user(
    current_user: schemas.UserResponse = Depends(get_current_active_user),
) -> schemas.UserResponse:
    """
    Get current user with scheduler role
    """
    if current_user.role != "scheduler":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user


def get_approver_user(
    current_user: schemas.UserResponse = Depends(get_current_active_user),
) -> schemas.UserResponse:
    """
    Get current user with approver role
    """
    if current_user.role != "approver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user
