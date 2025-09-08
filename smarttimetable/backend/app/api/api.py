from fastapi import APIRouter
from app.api.endpoints import auth, rooms, faculty, batches, subjects, fixed_slots, timetable

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(rooms.router, prefix="/rooms", tags=["rooms"])
api_router.include_router(faculty.router, prefix="/faculty", tags=["faculty"])
api_router.include_router(batches.router, prefix="/batches", tags=["batches"])
api_router.include_router(subjects.router, prefix="/subjects", tags=["subjects"])
api_router.include_router(fixed_slots.router, prefix="/fixed-slots", tags=["fixed-slots"])
api_router.include_router(timetable.router, prefix="/timetables", tags=["timetables"])
