from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.schemas import subject as schemas
from app.api.endpoints.auth import get_scheduler_user
from app.schemas.user import UserResponse

router = APIRouter()

@router.get("/", response_model=List[schemas.SubjectResponse])
def list_subjects(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    List all subjects
    """
    subjects = db.query(models.Subject).offset(skip).limit(limit).all()
    return subjects

@router.post("/", response_model=schemas.SubjectResponse)
def create_subject(
    *,
    db: Session = Depends(get_db),
    subject_in: schemas.SubjectCreate,
    current_user: UserResponse = Depends(get_scheduler_user)
) -> Any:
    """
    Create a new subject
    """
    # Check if subject with same code exists
    subject = db.query(models.Subject).filter(models.Subject.code == subject_in.code).first()
    if subject:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject with this code already exists"
        )
    
    subject = models.Subject(**subject_in.dict())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject

@router.get("/{subject_id}", response_model=schemas.SubjectResponse)
def get_subject(
    *,
    db: Session = Depends(get_db),
    subject_id: int = Path(..., gt=0)
) -> Any:
    """
    Get a specific subject by ID
    """
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    return subject

@router.put("/{subject_id}", response_model=schemas.SubjectResponse)
def update_subject(
    *,
    db: Session = Depends(get_db),
    subject_id: int = Path(..., gt=0),
    subject_in: schemas.SubjectUpdate,
    current_user: UserResponse = Depends(get_scheduler_user)
) -> Any:
    """
    Update a subject
    """
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Check for code uniqueness if code is being updated
    if subject_in.code and subject_in.code != subject.code:
        existing = db.query(models.Subject).filter(models.Subject.code == subject_in.code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subject with this code already exists"
            )
    
    update_data = subject_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(subject, field, value)
    
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject

@router.delete("/{subject_id}", response_model=schemas.SubjectResponse)
def delete_subject(
    *,
    db: Session = Depends(get_db),
    subject_id: int = Path(..., gt=0),
    current_user: UserResponse = Depends(get_scheduler_user)
) -> Any:
    """
    Delete a subject
    """
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Check if subject is being used in any periods
    periods = db.query(models.Period).filter(models.Period.subject_id == subject_id).first()
    if periods:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete subject as it's in use in timetables"
        )
    
    db.delete(subject)
    db.commit()
    return subject
