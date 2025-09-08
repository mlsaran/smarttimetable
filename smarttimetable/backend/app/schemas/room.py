from typing import Optional, List, Any
from pydantic import BaseModel, Field

class RoomBase(BaseModel):
    name: str
    type: str
    capacity: int
    available_slots: Optional[List[Any]] = None

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    capacity: Optional[int] = None
    available_slots: Optional[List[Any]] = None

class RoomInDBBase(RoomBase):
    id: int

    class Config:
        orm_mode = True

class RoomResponse(RoomInDBBase):
    pass
