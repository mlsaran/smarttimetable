from typing import Optional
from pydantic import BaseModel, Field

class SubjectBase(BaseModel):
    code: str = Field(..., description="Subject code (e.g., CS101)")
    name: str = Field(..., description="Subject name")
    hours_week: int = Field(..., description="Required hours per week")
    type: str = Field(..., description="Type: lecture or lab")
    semester: int = Field(..., description="Semester number")

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    hours_week: Optional[int] = None
    type: Optional[str] = None
    semester: Optional[int] = None

class SubjectInDBBase(SubjectBase):
    id: int

    class Config:
        orm_mode = True

class SubjectResponse(SubjectInDBBase):
    pass
