from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.schemas import room as schemas
from app.api.endpoints.auth import get_scheduler_user
from app.schemas.user import UserResponse

router = APIRouter()

@router.get("/", response_model=List[schemas.RoomResponse])
def list_rooms(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    List all rooms
    """
    rooms = db.query(models.Room).offset(skip).limit(limit).all()
    return rooms

@router.post("/", response_model=schemas.RoomResponse)
def create_room(
    *,
    db: Session = Depends(get_db),
    room_in: schemas.RoomCreate,
    current_user: UserResponse = Depends(get_scheduler_user)
) -> Any:
    """
    Create a new room
    """
    # Check for duplicate name
    room = db.query(models.Room).filter(models.Room.name == room_in.name).first()
    if room:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room with this name already exists"
        )
    
    room = models.Room(**room_in.dict())
    db.add(room)
    db.commit()
    db.refresh(room)
    return room

@router.get("/{room_id}", response_model=schemas.RoomResponse)
def get_room(
    *,
    db: Session = Depends(get_db),
    room_id: int = Path(..., gt=0)
) -> Any:
    """
    Get a specific room by ID
    """
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    return room

@router.put("/{room_id}", response_model=schemas.RoomResponse)
def update_room(
    *,
    db: Session = Depends(get_db),
    room_id: int = Path(..., gt=0),
    room_in: schemas.RoomUpdate,
    current_user: UserResponse = Depends(get_scheduler_user)
) -> Any:
    """
    Update a room
    """
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Check for name uniqueness if name is being updated
    if room_in.name and room_in.name != room.name:
        existing = db.query(models.Room).filter(models.Room.name == room_in.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Room with this name already exists"
            )
    
    update_data = room_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(room, field, value)
    
    db.add(room)
    db.commit()
    db.refresh(room)
    return room

@router.delete("/{room_id}", response_model=schemas.RoomResponse)
def delete_room(
    *,
    db: Session = Depends(get_db),
    room_id: int = Path(..., gt=0),
    current_user: UserResponse = Depends(get_scheduler_user)
) -> Any:
    """
    Delete a room
    """
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Check if room is being used in any periods or fixed slots
    periods = db.query(models.Period).filter(models.Period.room_id == room_id).first()
    fixed_slots = db.query(models.FixedSlot).filter(models.FixedSlot.room_id == room_id).first()
    
    if periods or fixed_slots:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete room as it's in use in timetables or fixed slots"
        )
    
    db.delete(room)
    db.commit()
    return room
