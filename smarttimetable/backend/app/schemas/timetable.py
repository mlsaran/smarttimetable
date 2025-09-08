from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from .room import RoomResponse
from .batch import BatchResponse
from .subject import SubjectResponse
from .faculty import FacultyResponse

class PeriodBase(BaseModel):
    day: int = Field(..., description="Day of week (0 = Monday, 1 = Tuesday, etc.)")
    period_no: int = Field(..., description="Period number (1-8)")
    room_id: int = Field(..., description="Room ID")
    batch_id: int = Field(..., description="Batch ID")
    subject_id: int = Field(..., description="Subject ID")
    faculty_id: int = Field(..., description="Faculty ID")

class PeriodCreate(PeriodBase):
    timetable_id: int = Field(..., description="Timetable ID")

class PeriodUpdate(BaseModel):
    day: Optional[int] = None
    period_no: Optional[int] = None
    room_id: Optional[int] = None
    batch_id: Optional[int] = None
    subject_id: Optional[int] = None
    faculty_id: Optional[int] = None

class PeriodInDBBase(PeriodBase):
    id: int
    timetable_id: int

    class Config:
        orm_mode = True

class PeriodResponse(PeriodInDBBase):
    room: RoomResponse
    batch: BatchResponse
    subject: SubjectResponse
    faculty: FacultyResponse

class TimetableBase(BaseModel):
    version: int = Field(..., description="Timetable version number")
    status: str = Field(..., description="Status: draft, pending, approved")
    
class TimetableCreate(TimetableBase):
    created_by: int = Field(..., description="Creator user ID")

class TimetableUpdate(BaseModel):
    version: Optional[int] = None
    status: Optional[str] = None
    approved_by: Optional[int] = None
    comment: Optional[str] = None
    public_url: Optional[str] = None

class TimetableInDBBase(TimetableBase):
    id: int
    created_by: int
    created_at: datetime
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    comment: Optional[str] = None
    public_url: Optional[str] = None

    class Config:
        orm_mode = True

class TimetableResponse(TimetableInDBBase):
    periods: List[PeriodResponse] = []

class TimetableApproval(BaseModel):
    approved: bool = Field(..., description="Whether to approve or reject")
    comment: Optional[str] = None

class ConstraintSuggestion(BaseModel):
    type: str
    message: str
    solution: str

class TimetableError(BaseModel):
    error: str
    suggestions: List[ConstraintSuggestion]
