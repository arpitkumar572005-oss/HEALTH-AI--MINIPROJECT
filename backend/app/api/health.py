"""
Health Measurements and Trend Tracking API
Manages biometric data tracking with date range filtering (7d, 30d, 3m, 6m, 1y).
Powered by Centralized Patient History Service.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import User, HealthMeasurement
from app.schemas.health import (
    MeasurementCreate,
    MeasurementResponse,
    HealthTrendsResponse,
    PatientHealthSummaryResponse
)
from app.services.auth_service import get_current_user
from app.services.patient_history_service import (
    get_health_trends,
    get_health_measurements,
    get_patient_health_summary,
    get_dashboard_overview
)

router = APIRouter(prefix="/health", tags=["Health Data & Trends"])

@router.post("/measurements", response_model=MeasurementResponse)
def log_measurement(
    data: MeasurementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    meas = HealthMeasurement(
        user_id=current_user.id,
        measurement_type=data.measurement_type.lower(),
        value=data.value,
        unit=data.unit,
        notes=data.notes,
        source=data.source or "manual_input",
        is_demo=current_user.is_demo
    )
    db.add(meas)
    db.commit()
    db.refresh(meas)
    
    return {
        "id": meas.id,
        "measurement_type": meas.measurement_type,
        "value": meas.value,
        "unit": meas.unit,
        "notes": meas.notes,
        "source": getattr(meas, "source", "manual_input") or "manual_input",
        "is_demo": meas.is_demo,
        "measured_at": meas.measured_at.isoformat()
    }

@router.get("/measurements", response_model=List[MeasurementResponse])
def get_measurements(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_health_measurements(current_user.id, db, limit=limit)

@router.get("/trends", response_model=HealthTrendsResponse)
def get_trends(
    timeframe: str = Query("30d", description="One of: '7d', '30d', '3m', '6m', '1y'"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_health_trends(current_user.id, db, timeframe=timeframe)

@router.get("/summary", response_model=PatientHealthSummaryResponse)
def get_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_patient_health_summary(current_user.id, db)

@router.get("/dashboard-overview")
def get_dashboard_summary(
    timeframe: str = Query("30d"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_dashboard_overview(current_user.id, db, timeframe=timeframe)
