from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.schemas import batch as schemas
from app.api.endpoints.auth import get_scheduler_user
from app.schemas.user import UserResponse

router = APIRouter()

@router.get("/", response_model=List[schemas.BatchResponse])
def list_batches(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    List all batches
    """
    batches = db.query(models.Batch).offset(skip).limit(limit).all()
    return batches

@router.post("/", response_model=schemas.BatchResponse)
def create_batch(
    *,
    db: Session = Depends(get_db),
    batch_in: schemas.BatchCreate,
    current_user: UserResponse = Depends(get_scheduler_user)
) -> Any:
    """
    Create a new batch
    """
    # Check if batch with same name exists
    batch = db.query(models.Batch).filter(models.Batch.name == batch_in.name).first()
    if batch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch with this name already exists"
        )
    
    batch = models.Batch(**batch_in.dict())
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch

@router.get("/{batch_id}", response_model=schemas.BatchResponse)
def get_batch(
    *,
    db: Session = Depends(get_db),
    batch_id: int = Path(..., gt=0)
) -> Any:
    """
    Get a specific batch by ID
    """
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found"
        )
    return batch

@router.put("/{batch_id}", response_model=schemas.BatchResponse)
def update_batch(
    *,
    db: Session = Depends(get_db),
    batch_id: int = Path(..., gt=0),
    batch_in: schemas.BatchUpdate,
    current_user: UserResponse = Depends(get_scheduler_user)
) -> Any:
    """
    Update a batch
    """
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found"
        )
    
    # Check for name uniqueness if name is being updated
    if batch_in.name and batch_in.name != batch.name:
        existing = db.query(models.Batch).filter(models.Batch.name == batch_in.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Batch with this name already exists"
            )
    
    update_data = batch_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(batch, field, value)
    
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch

@router.delete("/{batch_id}", response_model=schemas.BatchResponse)
def delete_batch(
    *,
    db: Session = Depends(get_db),
    batch_id: int = Path(..., gt=0),
    current_user: UserResponse = Depends(get_scheduler_user)
) -> Any:
    """
    Delete a batch
    """
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found"
        )
    
    # Check if batch is being used in any periods or fixed slots
    periods = db.query(models.Period).filter(models.Period.batch_id == batch_id).first()
    fixed_slots = db.query(models.FixedSlot).filter(models.FixedSlot.batch_id == batch_id).first()
    
    if periods or fixed_slots:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete batch as it's in use in timetables or fixed slots"
        )
    
    db.delete(batch)
    db.commit()
    return batch
