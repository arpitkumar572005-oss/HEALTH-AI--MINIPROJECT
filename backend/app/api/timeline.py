"""
Health Timeline API
Aggregates all longitudinal patient events into a single unified chronological feed:
screenings, measurements, daily check-ins, and lab documents.
Powered by Centralized Patient History Service.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import User
from app.services.auth_service import get_current_user
from app.services.patient_history_service import get_health_timeline as fetch_timeline

router = APIRouter(prefix="/timeline", tags=["Health Timeline"])

@router.get("")
def get_health_timeline(
    event_type: Optional[str] = Query(None, description="'all', 'screening', 'measurement', 'checkin', 'document'"),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    return fetch_timeline(current_user.id, db, event_type=event_type, limit=limit)
