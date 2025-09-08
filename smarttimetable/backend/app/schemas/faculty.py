from typing import Optional, List
from pydantic import BaseModel, Field
from .subject import SubjectResponse

class FacultyBase(BaseModel):
    name: str
    max_day: int = Field(..., description="Maximum periods per day")
    max_week: int = Field(..., description="Maximum periods per week")
    leave_avg: float = Field(..., description="Average leave probability")

class FacultyCreate(FacultyBase):
    subject_ids: Optional[List[int]] = None

class FacultyUpdate(BaseModel):
    name: Optional[str] = None
    max_day: Optional[int] = None
    max_week: Optional[int] = None
    leave_avg: Optional[float] = None
    subject_ids: Optional[List[int]] = None

class FacultyInDBBase(FacultyBase):
    id: int
    
    class Config:
        orm_mode = True

class FacultyResponse(FacultyInDBBase):
    subjects: List[SubjectResponse] = []
