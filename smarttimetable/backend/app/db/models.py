from datetime import datetime
from typing import List
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Table, Enum, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

# Association tables for many-to-many relationships
faculty_subjects = Table('faculty_subjects', Base.metadata,
    Column('faculty_id', Integer, ForeignKey('faculty.id')),
    Column('subject_id', Integer, ForeignKey('subject.id'))
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    role = Column(String)  # 'scheduler', 'approver', 'readonly'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Room(Base):
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    type = Column(String)  # 'lecture' or 'lab'
    capacity = Column(Integer)
    available_slots = Column(JSON)  # JSON array of available slots
    
    # Relationship
    periods = relationship("Period", back_populates="room")

class Faculty(Base):
    __tablename__ = "faculty"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    max_day = Column(Integer)  # Max periods per day
    max_week = Column(Integer)  # Max periods per week
    leave_avg = Column(Float)   # Average leave probability
    
    # Relationships
    subjects = relationship("Subject", secondary=faculty_subjects, back_populates="faculty")
    periods = relationship("Period", back_populates="faculty")

class Batch(Base):
    __tablename__ = "batches"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    size = Column(Integer)
    programme = Column(String)
    
    # Relationships
    periods = relationship("Period", back_populates="batch")
    fixed_slots = relationship("FixedSlot", back_populates="batch")

class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String)
    hours_week = Column(Integer)
    type = Column(String)  # 'lecture' or 'lab'
    semester = Column(Integer)
    
    # Relationships
    faculty = relationship("Faculty", secondary=faculty_subjects, back_populates="subjects")
    periods = relationship("Period", back_populates="subject")

class FixedSlot(Base):
    __tablename__ = "fixed_slots"
    
    id = Column(Integer, primary_key=True, index=True)
    day = Column(Integer)  # 0 = Monday, 1 = Tuesday, etc.
    period = Column(Integer)  # Period number (1-8)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    batch_id = Column(Integer, ForeignKey("batches.id"))
    
    # Relationships
    batch = relationship("Batch", back_populates="fixed_slots")
    room = relationship("Room")

class Timetable(Base):
    __tablename__ = "timetables"
    
    id = Column(Integer, primary_key=True, index=True)
    version = Column(Integer)
    status = Column(String)  # 'draft', 'pending', 'approved'
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    comment = Column(String, nullable=True)
    public_url = Column(String, nullable=True)
    
    # Relationships
    periods = relationship("Period", back_populates="timetable", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])
    approver = relationship("User", foreign_keys=[approved_by])

class Period(Base):
    __tablename__ = "periods"
    
    id = Column(Integer, primary_key=True, index=True)
    timetable_id = Column(Integer, ForeignKey("timetables.id"))
    day = Column(Integer)  # 0 = Monday, 1 = Tuesday, etc.
    period_no = Column(Integer)  # Period number (1-8)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    batch_id = Column(Integer, ForeignKey("batches.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    faculty_id = Column(Integer, ForeignKey("faculty.id"))
    
    # Relationships
    timetable = relationship("Timetable", back_populates="periods")
    room = relationship("Room", back_populates="periods")
    batch = relationship("Batch", back_populates="periods")
    subject = relationship("Subject", back_populates="periods")
    faculty = relationship("Faculty", back_populates="periods")
