"""
Pydantic models for request and response validation.
"""

from app.schemas.user import UserBase, UserCreate, UserUpdate, UserResponse, Token, TokenPayload, UserLogin
from app.schemas.room import RoomBase, RoomCreate, RoomUpdate, RoomResponse
from app.schemas.faculty import FacultyBase, FacultyCreate, FacultyUpdate, FacultyResponse
from app.schemas.batch import BatchBase, BatchCreate, BatchUpdate, BatchResponse
from app.schemas.subject import SubjectBase, SubjectCreate, SubjectUpdate, SubjectResponse
from app.schemas.fixed_slot import FixedSlotBase, FixedSlotCreate, FixedSlotUpdate, FixedSlotResponse
from app.schemas.timetable import (
    TimetableBase, TimetableCreate, TimetableUpdate, TimetableResponse,
    PeriodBase, PeriodCreate, PeriodUpdate, PeriodResponse,
    TimetableApproval, ConstraintSuggestion, TimetableError
)

__all__ = [
    # User schemas
    "UserBase", "UserCreate", "UserUpdate", "UserResponse", "Token", "TokenPayload", "UserLogin",
    # Room schemas
    "RoomBase", "RoomCreate", "RoomUpdate", "RoomResponse",
    # Faculty schemas
    "FacultyBase", "FacultyCreate", "FacultyUpdate", "FacultyResponse",
    # Batch schemas
    "BatchBase", "BatchCreate", "BatchUpdate", "BatchResponse",
    # Subject schemas
    "SubjectBase", "SubjectCreate", "SubjectUpdate", "SubjectResponse",
    # Fixed slot schemas
    "FixedSlotBase", "FixedSlotCreate", "FixedSlotUpdate", "FixedSlotResponse",
    # Timetable schemas
    "TimetableBase", "TimetableCreate", "TimetableUpdate", "TimetableResponse",
    "PeriodBase", "PeriodCreate", "PeriodUpdate", "PeriodResponse",
    "TimetableApproval", "ConstraintSuggestion", "TimetableError"
]
