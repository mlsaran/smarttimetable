from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.schemas import faculty as schemas
from app.api.endpoints.auth import get_scheduler_user
from app.schemas.user import UserResponse

router = APIRouter()

@router.get("/", response_model=List[schemas.FacultyResponse])
def list_faculty(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    List all faculty members
    """
    faculty = db.query(models.Faculty).offset(skip).limit(limit).all()
    return faculty

@router.post("/", response_model=schemas.FacultyResponse)
def create_faculty(
    *,
    db: Session = Depends(get_db),
    faculty_in: schemas.FacultyCreate,
    current_user: UserResponse = Depends(get_scheduler_user)
) -> Any:
    """
    Create a new faculty member
    """
    # Check if faculty with same name exists
    faculty = db.query(models.Faculty).filter(models.Faculty.name == faculty_in.name).first()
    if faculty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Faculty member with this name already exists"
        )
    
    # Create new faculty object
    faculty = models.Faculty(
        name=faculty_in.name,
        max_day=faculty_in.max_day,
        max_week=faculty_in.max_week,
        leave_avg=faculty_in.leave_avg
    )
    db.add(faculty)
    db.commit()
    
    # If subjects are provided, associate them
    if faculty_in.subject_ids:
        for subject_id in faculty_in.subject_ids:
            subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
            if subject:
                faculty.subjects.append(subject)
        db.commit()
    
    db.refresh(faculty)
    return faculty

@router.get("/{faculty_id}", response_model=schemas.FacultyResponse)
def get_faculty(
    *,
    db: Session = Depends(get_db),
    faculty_id: int = Path(..., gt=0)
) -> Any:
    """
    Get a specific faculty member by ID
    """
    faculty = db.query(models.Faculty).filter(models.Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Faculty not found"
        )
    return faculty

@router.put("/{faculty_id}", response_model=schemas.FacultyResponse)
def update_faculty(
    *,
    db: Session = Depends(get_db),
    faculty_id: int = Path(..., gt=0),
    faculty_in: schemas.FacultyUpdate,
    current_user: UserResponse = Depends(get_scheduler_user)
) -> Any:
    """
    Update a faculty member
    """
    faculty = db.query(models.Faculty).filter(models.Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Faculty not found"
        )
    
    # Check for name uniqueness if name is being updated
    if faculty_in.name and faculty_in.name != faculty.name:
        existing = db.query(models.Faculty).filter(models.Faculty.name == faculty_in.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Faculty with this name already exists"
            )
    
    # Update basic fields
    update_data = faculty_in.dict(exclude={"subject_ids"}, exclude_unset=True)
    for field, value in update_data.items():
        setattr(faculty, field, value)
    
    # Update subject relationships if provided
    if faculty_in.subject_ids is not None:
        # Clear existing relationships
        faculty.subjects = []
        # Add new relationships
        for subject_id in faculty_in.subject_ids:
            subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
            if subject:
                faculty.subjects.append(subject)
    
    db.add(faculty)
    db.commit()
    db.refresh(faculty)
    return faculty

@router.delete("/{faculty_id}", response_model=schemas.FacultyResponse)
def delete_faculty(
    *,
    db: Session = Depends(get_db),
    faculty_id: int = Path(..., gt=0),
    current_user: UserResponse = Depends(get_scheduler_user)
) -> Any:
    """
    Delete a faculty member
    """
    faculty = db.query(models.Faculty).filter(models.Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Faculty not found"
        )
    
    # Check if faculty is being used in any periods
    periods = db.query(models.Period).filter(models.Period.faculty_id == faculty_id).first()
    if periods:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete faculty as they're assigned in timetables"
        )
    
    db.delete(faculty)
    db.commit()
    return faculty
