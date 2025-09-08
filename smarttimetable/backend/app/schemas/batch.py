from typing import Optional
from pydantic import BaseModel, Field

class BatchBase(BaseModel):
    name: str
    size: int = Field(..., description="Number of students in the batch")
    programme: str = Field(..., description="Programme name (e.g., B.Tech CSE)")

class BatchCreate(BatchBase):
    pass

class BatchUpdate(BaseModel):
    name: Optional[str] = None
    size: Optional[int] = None
    programme: Optional[str] = None

class BatchInDBBase(BatchBase):
    id: int

    class Config:
        orm_mode = True

class BatchResponse(BatchInDBBase):
    pass
