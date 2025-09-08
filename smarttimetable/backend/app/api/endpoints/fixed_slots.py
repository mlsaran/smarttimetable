from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.schemas import fixed_slot as schemas
from app.api.endpoints.auth import get_scheduler_user
from app.schemas.user import UserResponse

router = APIRouter()

@router.get("/", response_model=List[schemas.FixedSlotResponse])
def list_fixed_slots(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    List all fixed slots
    """
    fixed_slots = db.query(models.FixedSlot).offset(skip).limit(limit).all()
    return fixed_slots

@router.post("/", response_model=schemas.FixedSlotResponse)
def create_fixed_slot(
    *,
    db: Session = Depends(get_db),
    fixed_slot_in: schemas.FixedSlotCreate,
    current_user: UserResponse = Depends(get_scheduler_user)
) -> Any:
    """
    Create a new fixed slot
    """
    # Validate day and period
    if fixed_slot_in.day < 0 or fixed_slot_in.day > 5:  # 0-5 (Mon-Sat)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Day must be between 0 (Monday) and 5 (Saturday)"
        )
    
    if fixed_slot_in.period < 1 or fixed_slot_in.period > 8:  # Assuming 8 periods
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Period must be between 1 and 8"
        )
    
    # Validate batch exists
    batch = db.query(models.Batch).filter(models.Batch.id == fixed_slot_in.batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found"
        )
    
    # Validate room exists if provided
    if fixed_slot_in.room_id:
        room = db.query(models.Room).filter(models.Room.id == fixed_slot_in.room_id).first()
        if not room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room not found"
            )
    
    # Check for overlapping fixed slots for the same batch
    existing_slot = db.query(models.FixedSlot).filter(
        models.FixedSlot.batch_id == fixed_slot_in.batch_id,
        models.FixedSlot.day == fixed_slot_in.day,
        models.FixedSlot.period == fixed_slot_in.period
    ).first()
    
    if existing_slot:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A fixed slot already exists for this batch at the specified day and period"
        )
    
    # Check for overlapping fixed slots for the same room if provided
    if fixed_slot_in.room_id:
        existing_room_slot = db.query(models.FixedSlot).filter(
            models.FixedSlot.room_id == fixed_slot_in.room_id,
            models.FixedSlot.day == fixed_slot_in.day,
            models.FixedSlot.period == fixed_slot_in.period
        ).first()
        
        if existing_room_slot:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A fixed slot already exists for this room at the specified day and period"
            )
    
    fixed_slot = models.FixedSlot(**fixed_slot_in.dict())
    db.add(fixed_slot)
    db.commit()
    db.refresh(fixed_slot)
    return fixed_slot

@router.get("/{fixed_slot_id}", response_model=schemas.FixedSlotResponse)
def get_fixed_slot(
    *,
    db: Session = Depends(get_db),
    fixed_slot_id: int = Path(..., gt=0)
) -> Any:
    """
    Get a specific fixed slot by ID
    """
    fixed_slot = db.query(models.FixedSlot).filter(models.FixedSlot.id == fixed_slot_id).first()
    if not fixed_slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fixed slot not found"
        )
    return fixed_slot

@router.put("/{fixed_slot_id}", response_model=schemas.FixedSlotResponse)
def update_fixed_slot(
    *,
    db: Session = Depends(get_db),
    fixed_slot_id: int = Path(..., gt=0),
    fixed_slot_in: schemas.FixedSlotUpdate,
    current_user: UserResponse = Depends(get_scheduler_user)
) -> Any:
    """
    Update a fixed slot
    """
    fixed_slot = db.query(models.FixedSlot).filter(models.FixedSlot.id == fixed_slot_id).first()
    if not fixed_slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fixed slot not found"
        )
    
    # Get current values for validation
    day = fixed_slot_in.day if fixed_slot_in.day is not None else fixed_slot.day
    period = fixed_slot_in.period if fixed_slot_in.period is not None else fixed_slot.period
    batch_id = fixed_slot_in.batch_id if fixed_slot_in.batch_id is not None else fixed_slot.batch_id
    room_id = fixed_slot_in.room_id if fixed_slot_in.room_id is not None else fixed_slot.room_id
    
    # Validate day and period
    if day < 0 or day > 5:  # 0-5 (Mon-Sat)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Day must be between 0 (Monday) and 5 (Saturday)"
        )
    
    if period < 1 or period > 8:  # Assuming 8 periods
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Period must be between 1 and 8"
        )
    
    # Validate batch exists if changing
    if fixed_slot_in.batch_id is not None:
        batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
        if not batch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Batch not found"
            )
    
    # Validate room exists if provided
    if fixed_slot_in.room_id is not None:
        if room_id:  # Only check if not None
            room = db.query(models.Room).filter(models.Room.id == room_id).first()
            if not room:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Room not found"
                )
    
    # Check for overlapping fixed slots for the same batch if changing day/period/batch
    if fixed_slot_in.day is not None or fixed_slot_in.period is not None or fixed_slot_in.batch_id is not None:
        existing_slot = db.query(models.FixedSlot).filter(
            models.FixedSlot.id != fixed_slot_id,
            models.FixedSlot.batch_id == batch_id,
            models.FixedSlot.day == day,
            models.FixedSlot.period == period
        ).first()
        
        if existing_slot:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A fixed slot already exists for this batch at the specified day and period"
            )
    
    # Check for overlapping fixed slots for the same room if changing day/period/room
    if room_id and (fixed_slot_in.day is not None or fixed_slot_in.period is not None or fixed_slot_in.room_id is not None):
        existing_room_slot = db.query(models.FixedSlot).filter(
            models.FixedSlot.id != fixed_slot_id,
            models.FixedSlot.room_id == room_id,
            models.FixedSlot.day == day,
            models.FixedSlot.period == period
        ).first()
        
        if existing_room_slot:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A fixed slot already exists for this room at the specified day and period"
            )
    
    update_data = fixed_slot_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(fixed_slot, field, value)
    
    db.add(fixed_slot)
    db.commit()
    db.refresh(fixed_slot)
    return fixed_slot

@router.delete("/{fixed_slot_id}", response_model=schemas.FixedSlotResponse)
def delete_fixed_slot(
    *,
    db: Session = Depends(get_db),
    fixed_slot_id: int = Path(..., gt=0),
    current_user: UserResponse = Depends(get_scheduler_user)
) -> Any:
    """
    Delete a fixed slot
    """
    fixed_slot = db.query(models.FixedSlot).filter(models.FixedSlot.id == fixed_slot_id).first()
    if not fixed_slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fixed slot not found"
        )
    
    db.delete(fixed_slot)
    db.commit()
    return fixed_slot
