"""
Health Reminders API
Manages scheduled alerts for blood pressure, medication, hydration, and appointments.
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import User, HealthReminder
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/reminders", tags=["Reminders"])

class ReminderCreate(BaseModel):
    reminder_type: str = Field(..., description="'medication', 'blood_pressure', 'blood_glucose', 'exercise', 'water', 'screening'")
    title: str
    time_str: str
    date_str: str = "Today"
    frequency: str = "daily"
    notes: Optional[str] = None

class ReminderResponse(BaseModel):
    id: str
    reminder_type: str
    title: str
    time_str: str
    date_str: str
    frequency: str
    is_completed: bool
    notes: Optional[str]

@router.get("", response_model=List[ReminderResponse])
def get_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(HealthReminder).filter(HealthReminder.user_id == current_user.id).order_by(HealthReminder.is_completed.asc(), HealthReminder.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "reminder_type": r.reminder_type,
            "title": r.title,
            "time_str": r.time_str,
            "date_str": r.date_str,
            "frequency": r.frequency,
            "is_completed": r.is_completed,
            "notes": r.notes
        }
        for r in items
    ]

@router.post("", response_model=ReminderResponse)
def create_reminder(
    data: ReminderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reminder = HealthReminder(
        user_id=current_user.id,
        reminder_type=data.reminder_type.lower(),
        title=data.title,
        time_str=data.time_str,
        date_str=data.date_str,
        frequency=data.frequency,
        is_completed=False,
        notes=data.notes
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return {
        "id": reminder.id,
        "reminder_type": reminder.reminder_type,
        "title": reminder.title,
        "time_str": reminder.time_str,
        "date_str": reminder.date_str,
        "frequency": reminder.frequency,
        "is_completed": reminder.is_completed,
        "notes": reminder.notes
    }

@router.patch("/{reminder_id}/toggle", response_model=ReminderResponse)
def toggle_reminder(
    reminder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reminder = db.query(HealthReminder).filter(HealthReminder.id == reminder_id, HealthReminder.user_id == current_user.id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    reminder.is_completed = not reminder.is_completed
    db.commit()
    db.refresh(reminder)
    return {
        "id": reminder.id,
        "reminder_type": reminder.reminder_type,
        "title": reminder.title,
        "time_str": reminder.time_str,
        "date_str": reminder.date_str,
        "frequency": reminder.frequency,
        "is_completed": reminder.is_completed,
        "notes": reminder.notes
    }

@router.delete("/{reminder_id}")
def delete_reminder(
    reminder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reminder = db.query(HealthReminder).filter(HealthReminder.id == reminder_id, HealthReminder.user_id == current_user.id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    db.delete(reminder)
    db.commit()
    return {"message": "Reminder removed successfully"}
