import csv
from io import StringIO
from sqlalchemy.orm import Session
import base64
from app.db import models

def generate_timetable_csv(timetable: models.Timetable, db: Session) -> str:
    """
    Generate a CSV for a timetable and return as base64 string
    """
    output = StringIO()
    writer = csv.writer(output)
    
    # Get all relevant data
    periods = (
        db.query(models.Period)
        .filter(models.Period.timetable_id == timetable.id)
        .order_by(models.Period.day, models.Period.period_no, models.Period.batch_id)
        .all()
    )
    
    rooms = {room.id: room for room in db.query(models.Room).all()}
    batches = {batch.id: batch for batch in db.query(models.Batch).all()}
    subjects = {subject.id: subject for subject in db.query(models.Subject).all()}
    faculty = {f.id: f for f in db.query(models.Faculty).all()}
    
    # Write header row
    writer.writerow([
        "Day", "Period", "Batch", "Subject", "Faculty", "Room", "Programme"
    ])
    
    # Map day number to day name
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    
    # Write data rows
    for period in periods:
        day_name = day_names[period.day] if 0 <= period.day < len(day_names) else f"Day {period.day}"
        batch = batches.get(period.batch_id, None)
        subject = subjects.get(period.subject_id, None)
        teacher = faculty.get(period.faculty_id, None)
        room = rooms.get(period.room_id, None)
        
        writer.writerow([
            day_name,
            f"Period {period.period_no}",
            batch.name if batch else "Unknown Batch",
            f"{subject.code} - {subject.name}" if subject else "Unknown Subject",
            teacher.name if teacher else "Unknown Faculty",
            room.name if room else "Unknown Room",
            batch.programme if batch else "-"
        ])
    
    # Get the CSV data
    csv_data = output.getvalue()
    output.close()
    
    # Encode as base64 for transport
    csv_base64 = base64.b64encode(csv_data.encode()).decode('utf-8')
    return csv_base64
