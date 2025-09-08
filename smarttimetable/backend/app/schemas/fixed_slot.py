from typing import Optional
from pydantic import BaseModel, Field
from .room import RoomResponse
from .batch import BatchResponse

class FixedSlotBase(BaseModel):
    day: int = Field(..., description="Day of week (0 = Monday, 1 = Tuesday, etc.)")
    period: int = Field(..., description="Period number (1-8)")
    room_id: Optional[int] = Field(None, description="Room ID (optional)")
    batch_id: int = Field(..., description="Batch ID")

class FixedSlotCreate(FixedSlotBase):
    pass

class FixedSlotUpdate(BaseModel):
    day: Optional[int] = None
    period: Optional[int] = None
    room_id: Optional[int] = None
    batch_id: Optional[int] = None

class FixedSlotInDBBase(FixedSlotBase):
    id: int

    class Config:
        orm_mode = True

class FixedSlotResponse(FixedSlotInDBBase):
    room: Optional[RoomResponse] = None
    batch: BatchResponse
