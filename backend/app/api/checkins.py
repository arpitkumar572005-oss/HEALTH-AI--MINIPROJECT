"""
Daily Health Check-In API
Facilitates the daily symptom, mood, sleep, and activity check-in workflow.
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import User, DailyCheckIn, HealthMeasurement
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/checkins", tags=["Daily Health Check-in"])

class CheckInCreate(BaseModel):
    mood: str = Field(..., description="'great', 'good', 'okay', 'not_well', 'very_bad'")
    energy_level: int = Field(7, ge=1, le=10)
    stress_level: str = Field("medium", description="'low', 'medium', 'high'")
    sleep_hours: float = Field(7.3, ge=0, le=24)
    symptoms: List[str] = Field(default_factory=list)
    activity_steps: int = Field(6240, ge=0, le=100000)

class CheckInResponse(BaseModel):
    id: str
    mood: str
    energy_level: int
    stress_level: str
    sleep_hours: float
    symptoms: List[str]
    activity_steps: int
    summary: str
    checkin_date: str
    created_at: str

@router.get("/today", response_model=Optional[CheckInResponse])
def get_today_checkin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    record = (
        db.query(DailyCheckIn)
        .filter(DailyCheckIn.user_id == current_user.id, DailyCheckIn.checkin_date == today_str)
        .order_by(DailyCheckIn.created_at.desc())
        .first()
    )
    if not record:
        return None
    return {
        "id": record.id,
        "mood": record.mood,
        "energy_level": record.energy_level,
        "stress_level": record.stress_level,
        "sleep_hours": record.sleep_hours,
        "symptoms": record.symptoms or [],
        "activity_steps": record.activity_steps,
        "summary": record.summary,
        "checkin_date": record.checkin_date,
        "created_at": record.created_at.isoformat()
    }

@router.post("", response_model=CheckInResponse)
def submit_daily_checkin(
    data: CheckInCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Formulate patient-friendly educational summary
    mood_labels = {
        "great": "great overall vitality",
        "good": "good general wellbeing",
        "okay": "steady baseline wellbeing",
        "not_well": "mild discomfort / fatigue",
        "very_bad": "elevated fatigue or discomfort"
    }
    mood_desc = mood_labels.get(data.mood.lower(), "consistent wellbeing")
    symptom_str = f"with {len(data.symptoms)} reported symptoms ({', '.join(data.symptoms)})" if data.symptoms else "with no acute symptoms"
    
    hours_int = int(data.sleep_hours)
    mins = int(round((data.sleep_hours - hours_int) * 60))
    sleep_str = f"{hours_int}h {mins}m" if mins > 0 else f"{hours_int} hours"

    summary = (
        f"You reported {mood_desc} today. "
        f"Your recorded rest was {sleep_str}, daily activity totaled {data.activity_steps:,} steps, "
        f"and energy was rated {data.energy_level}/10 {symptom_str}."
    )
    
    checkin = DailyCheckIn(
        user_id=current_user.id,
        mood=data.mood.lower(),
        energy_level=data.energy_level,
        stress_level=data.stress_level.lower(),
        sleep_hours=data.sleep_hours,
        symptoms=data.symptoms,
        activity_steps=data.activity_steps,
        summary=summary,
        checkin_date=today_str,
        created_at=datetime.now(timezone.utc)
    )
    db.add(checkin)
    
    # Update health measurements with sleep and steps
    now = datetime.now(timezone.utc)
    db.add(HealthMeasurement(
        user_id=current_user.id,
        measurement_type="sleep",
        value=data.sleep_hours,
        unit="hours",
        notes="Daily health check-in",
        is_demo=current_user.is_demo,
        measured_at=now
    ))
    db.add(HealthMeasurement(
        user_id=current_user.id,
        measurement_type="steps",
        value=float(data.activity_steps),
        unit="steps",
        notes="Daily health check-in",
        is_demo=current_user.is_demo,
        measured_at=now
    ))

    db.commit()
    db.refresh(checkin)
    
    return {
        "id": checkin.id,
        "mood": checkin.mood,
        "energy_level": checkin.energy_level,
        "stress_level": checkin.stress_level,
        "sleep_hours": checkin.sleep_hours,
        "symptoms": checkin.symptoms or [],
        "activity_steps": checkin.activity_steps,
        "summary": checkin.summary,
        "checkin_date": checkin.checkin_date,
        "created_at": checkin.created_at.isoformat()
    }

@router.get("/history", response_model=List[CheckInResponse])
def get_checkin_history(
    limit: int = 14,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = (
        db.query(DailyCheckIn)
        .filter(DailyCheckIn.user_id == current_user.id)
        .order_by(DailyCheckIn.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "mood": r.mood,
            "energy_level": r.energy_level,
            "stress_level": r.stress_level,
            "sleep_hours": r.sleep_hours,
            "symptoms": r.symptoms or [],
            "activity_steps": r.activity_steps,
            "summary": r.summary,
            "checkin_date": r.checkin_date,
            "created_at": r.created_at.isoformat()
        }
        for r in records
    ]
