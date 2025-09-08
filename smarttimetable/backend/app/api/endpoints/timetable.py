from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.schemas import timetable as schemas
from app.services.scheduler import TimetableScheduler
from app.services.pdf_generator import generate_timetable_pdf
from app.services.csv_generator import generate_timetable_csv
from app.api.endpoints.auth import get_current_active_user, get_scheduler_user, get_approver_user
from app.schemas.user import UserResponse
import uuid
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/generate/", response_model=List[schemas.TimetableResponse])
def generate_timetable(
    *,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_scheduler_user),
    num_variants: int = Query(3, gt=0, le=5, description="Number of variants to generate")
) -> Any:
    """
    Generate timetable variants
    """
    try:
        scheduler = TimetableScheduler(db)
        variants = scheduler.generate_timetable_variants(num_variants)
        
        # Check if we got an error response
        if isinstance(variants, dict) and "error" in variants:
            return variants
        
        # Create timetable entries for each variant
        timetable_responses = []
        for i, variant in enumerate(variants):
            # Create timetable record
            timetable = models.Timetable(
                version=i+1,
                status="draft",
                created_by=current_user.id
            )
            db.add(timetable)
            db.flush()  # Get ID without committing transaction
            
            # Create periods for this timetable
            for period_data in variant["periods"]:
                period = models.Period(
                    timetable_id=timetable.id,
                    day=period_data["day"],
                    period_no=period_data["period_no"],
                    room_id=period_data["room_id"],
                    batch_id=period_data["batch_id"],
                    subject_id=period_data["subject_id"],
                    faculty_id=period_data["faculty_id"]
                )
                db.add(period)
            
            db.commit()
            db.refresh(timetable)
            
            # Format response
            timetable_with_periods = schemas.TimetableResponse.from_orm(timetable)
            timetable_responses.append(timetable_with_periods)
        
        return timetable_responses
    
    except Exception as e:
        logger.exception("Error generating timetable")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating timetable: {str(e)}"
        )

@router.get("/", response_model=List[schemas.TimetableResponse])
def list_timetables(
    *,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user),
    status: Optional[str] = Query(None, description="Filter by status")
) -> Any:
    """
    List timetables with optional status filter
    """
    query = db.query(models.Timetable)
    
    # Filter by status if provided
    if status:
        query = query.filter(models.Timetable.status == status)
    
    # If not a scheduler or approver, only show published timetables
    if current_user.role not in ["scheduler", "approver"]:
        query = query.filter(models.Timetable.status == "approved")
    
    timetables = query.order_by(models.Timetable.created_at.desc()).all()
    return timetables

@router.get("/{timetable_id}/", response_model=schemas.TimetableResponse)
def get_timetable(
    *,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user),
    timetable_id: int = Path(..., gt=0)
) -> Any:
    """
    Get a specific timetable
    """
    timetable = db.query(models.Timetable).filter(models.Timetable.id == timetable_id).first()
    if not timetable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timetable not found"
        )
    
    # If not a scheduler or approver, only allow access to published timetables
    if current_user.role not in ["scheduler", "approver"] and timetable.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this timetable"
        )
    
    return timetable

@router.post("/{timetable_id}/send-for-approval/", response_model=schemas.TimetableResponse)
def send_for_approval(
    *,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_scheduler_user),
    timetable_id: int = Path(..., gt=0)
) -> Any:
    """
    Send a timetable for approval
    """
    timetable = db.query(models.Timetable).filter(models.Timetable.id == timetable_id).first()
    if not timetable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timetable not found"
        )
    
    if timetable.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Timetable is already in {timetable.status} status"
        )
    
    timetable.status = "pending"
    db.add(timetable)
    db.commit()
    db.refresh(timetable)
    
    return timetable

@router.post("/{timetable_id}/approve/", response_model=schemas.TimetableResponse)
def approve_timetable(
    *,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_approver_user),
    timetable_id: int = Path(..., gt=0),
    approval_data: schemas.TimetableApproval
) -> Any:
    """
    Approve or reject a timetable
    """
    timetable = db.query(models.Timetable).filter(models.Timetable.id == timetable_id).first()
    if not timetable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timetable not found"
        )
    
    if timetable.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Timetable is in {timetable.status} status, not pending"
        )
    
    timetable.status = "approved" if approval_data.approved else "draft"
    timetable.comment = approval_data.comment
    timetable.approved_by = current_user.id
    
    # Generate a public URL if approved
    if approval_data.approved:
        timetable.public_url = f"timetable/{uuid.uuid4()}"
    
    db.add(timetable)
    db.commit()
    db.refresh(timetable)
    
    return timetable

@router.get("/{timetable_id}/pdf/")
def export_timetable_pdf(
    *,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user),
    timetable_id: int = Path(..., gt=0)
) -> Any:
    """
    Export timetable as PDF
    """
    timetable = db.query(models.Timetable).filter(models.Timetable.id == timetable_id).first()
    if not timetable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timetable not found"
        )
    
    # If not a scheduler or approver, only allow access to published timetables
    if current_user.role not in ["scheduler", "approver"] and timetable.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this timetable"
        )
    
    pdf_data = generate_timetable_pdf(timetable, db)
    
    return {
        "filename": f"timetable_{timetable.id}.pdf",
        "content_type": "application/pdf",
        "content": pdf_data
    }

@router.get("/{timetable_id}/csv/")
def export_timetable_csv(
    *,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user),
    timetable_id: int = Path(..., gt=0)
) -> Any:
    """
    Export timetable as CSV
    """
    timetable = db.query(models.Timetable).filter(models.Timetable.id == timetable_id).first()
    if not timetable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timetable not found"
        )
    
    # If not a scheduler or approver, only allow access to published timetables
    if current_user.role not in ["scheduler", "approver"] and timetable.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this timetable"
        )
    
    csv_data = generate_timetable_csv(timetable, db)
    
    return {
        "filename": f"timetable_{timetable.id}.csv",
        "content_type": "text/csv",
        "content": csv_data
    }

@router.get("/public/{public_url}/")
def get_public_timetable(
    *,
    db: Session = Depends(get_db),
    public_url: str = Path(..., min_length=10)
) -> Any:
    """
    Get a timetable by its public URL (no auth required)
    """
    timetable = db.query(models.Timetable).filter(models.Timetable.public_url == f"timetable/{public_url}").first()
    if not timetable or timetable.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Published timetable not found"
        )
    
    return timetable
