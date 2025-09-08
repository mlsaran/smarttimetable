from io import BytesIO
from typing import Dict, List
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER
from app.db import models
import base64

def generate_timetable_pdf(timetable: models.Timetable, db: Session) -> str:
    """
    Generate a PDF for a timetable and return as base64 string
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
    elements = []
    
    # Set up styles
    styles = getSampleStyleSheet()
    title_style = styles['Title']
    
    # Create a centered heading style
    center_style = ParagraphStyle(
        'Center',
        parent=styles['Normal'],
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        fontSize=12,
        spaceAfter=6
    )
    
    # Add title
    title = Paragraph(f"Timetable #{timetable.id} (Version {timetable.version})", title_style)
    elements.append(title)
    elements.append(Spacer(1, 12))
    
    # Add status and timestamp
    status_text = f"Status: {timetable.status.capitalize()} | Created: {timetable.created_at.strftime('%Y-%m-%d %H:%M')}"
    status = Paragraph(status_text, center_style)
    elements.append(status)
    elements.append(Spacer(1, 12))
    
    # Get all relevant data
    periods = (
        db.query(models.Period)
        .filter(models.Period.timetable_id == timetable.id)
        .order_by(models.Period.day, models.Period.period_no)
        .all()
    )
    
    rooms = {room.id: room for room in db.query(models.Room).all()}
    batches = {batch.id: batch for batch in db.query(models.Batch).all()}
    subjects = {subject.id: subject for subject in db.query(models.Subject).all()}
    faculty = {f.id: f for f in db.query(models.Faculty).all()}
    
    # Generate per batch timetables
    batch_periods = {}
    for period in periods:
        if period.batch_id not in batch_periods:
            batch_periods[period.batch_id] = []
        batch_periods[period.batch_id].append(period)
    
    # Create table for each batch
    for batch_id, batch_data in batch_periods.items():
        batch = batches[batch_id]
        
        # Add batch header
        batch_header = Paragraph(f"Batch: {batch.name} ({batch.programme})", center_style)
        elements.append(batch_header)
        elements.append(Spacer(1, 6))
        
        # Create the table data
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        
        # Header row with periods
        num_periods = 8  # Assuming 8 periods per day
        data = [['Day/Period'] + [f'Period {i}' for i in range(1, num_periods + 1)]]
        
        # Create a grid for this batch
        grid = {}
        for period in batch_data:
            if period.day not in grid:
                grid[period.day] = {}
            grid[period.day][period.period_no] = period
        
        # Fill in the grid
        for day_idx, day_name in enumerate(days):
            row = [day_name]
            for period_idx in range(1, num_periods + 1):
                if day_idx in grid and period_idx in grid[day_idx]:
                    period = grid[day_idx][period_idx]
                    subject_code = subjects[period.subject_id].code
                    faculty_name = faculty[period.faculty_id].name
                    room_name = rooms[period.room_id].name
                    cell_text = f"{subject_code}\n{faculty_name}\n({room_name})"
                    row.append(cell_text)
                else:
                    row.append('-')
            data.append(row)
        
        # Create the table
        table = Table(data, repeatRows=1, colWidths=[80] + [65] * num_periods)
        
        # Style the table
        table_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
        ])
        
        # Add alternating row colors
        for i in range(1, len(data)):
            if i % 2 == 0:
                table_style.add('BACKGROUND', (1, i), (-1, i), colors.whitesmoke)
        
        table.setStyle(table_style)
        elements.append(table)
        elements.append(Spacer(1, 20))
    
    # Build the PDF
    doc.build(elements)
    
    # Get the value from the buffer
    pdf_data = buffer.getvalue()
    buffer.close()
    
    # Encode as base64 for easy transport
    pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')
    return pdf_base64
