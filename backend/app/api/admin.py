"""
Admin Dashboard API Endpoints
Aggregated metrics and system overview with role-based access control.
Never exposes sensitive individual patient records unnecessarily.
"""

from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.models.entities import User, Screening
from app.schemas.admin import (
    AdminOverviewResponse,
    ScreeningTypeCount,
    RiskCategoryCount,
    DailyScreeningCount,
    ModelUsageStats
)
from app.services.auth_service import require_admin
from app.ml.inference_service import registry

router = APIRouter(prefix="/admin", tags=["Admin Analytics"])

@router.get("/overview", response_model=AdminOverviewResponse)
def get_admin_overview(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_screenings = db.query(func.count(Screening.id)).scalar() or 0
    
    # Screenings today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    screenings_today = (
        db.query(func.count(Screening.id))
        .filter(Screening.created_at >= today_start)
        .scalar() or 0
    )
    
    # By disease type
    by_type_rows = (
        db.query(Screening.screening_type, func.count(Screening.id))
        .group_by(Screening.screening_type)
        .all()
    )
    screenings_by_type = [
        ScreeningTypeCount(screening_type=r[0], count=r[1])
        for r in by_type_rows
    ]
    
    # By risk category
    by_cat_rows = (
        db.query(Screening.risk_category, func.count(Screening.id))
        .group_by(Screening.risk_category)
        .all()
    )
    risk_distribution = [
        RiskCategoryCount(category=r[0], count=r[1])
        for r in by_cat_rows
    ]
    
    # Trend last 7 days
    seven_days_ago = today_start - timedelta(days=6)
    daily_records = (
        db.query(
            func.date(Screening.created_at).label("day"),
            func.count(Screening.id).label("count")
        )
        .filter(Screening.created_at >= seven_days_ago)
        .group_by(func.date(Screening.created_at))
        .all()
    )
    
    # Create 7-day continuum
    daily_map = {str(r[0]): r[1] for r in daily_records}
    screenings_trend_7d = []
    for i in range(7):
        day_dt = seven_days_ago + timedelta(days=i)
        day_str = day_dt.strftime("%Y-%m-%d")
        screenings_trend_7d.append(
            DailyScreeningCount(date=day_dt.strftime("%b %d"), count=daily_map.get(day_str, 0))
        )
        
    # Model usage & performance stats
    model_usage = []
    for disease in ["diabetes", "cardiovascular", "hypertension"]:
        meta = registry.get_metadata(disease)
        metrics = registry.get_metrics(disease)
        count = db.query(func.count(Screening.id)).filter(Screening.screening_type == disease).scalar() or 0
        
        model_usage.append(
            ModelUsageStats(
                disease_type=disease,
                version=meta.get("version", "v1.0.0"),
                algorithm=meta.get("algorithm", "Logistic Regression"),
                total_screenings=count,
                roc_auc=metrics.get("roc_auc", 0.80),
                recall=metrics.get("recall_sensitivity", 0.74),
                accuracy=metrics.get("accuracy", 0.73)
            )
        )
        
    return AdminOverviewResponse(
        total_users=total_users,
        total_screenings=total_screenings,
        screenings_today=screenings_today,
        active_models_count=len(registry.models),
        screenings_by_type=screenings_by_type,
        risk_distribution=risk_distribution,
        screenings_trend_7d=screenings_trend_7d,
        model_usage=model_usage
    )
