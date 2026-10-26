"""
Users and Health Profile API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import User, PatientProfile, Screening, HealthMeasurement, AuditLog
from app.schemas.auth import UserResponse
from app.schemas.profile import ProfileUpdate, ProfileResponse
from app.services.auth_service import get_current_user

router = APIRouter(prefix="", tags=["Users & Profile"])

@router.get("/users/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "is_demo": current_user.is_demo,
        "created_at": current_user.created_at.isoformat()
    }

@router.get("/profile", response_model=ProfileResponse)
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        profile = PatientProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
    return {
        "id": profile.id,
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "age": profile.age,
        "gender": profile.gender,
        "height_cm": profile.height_cm,
        "weight_kg": profile.weight_kg,
        "bmi": profile.bmi,
        "smoking_status": profile.smoking_status or "never",
        "alcohol_consumption": profile.alcohol_consumption or "none",
        "physical_activity_hours": profile.physical_activity_hours or 0.0,
        "family_history_diabetes": profile.family_history_diabetes or False,
        "family_history_hypertension": profile.family_history_hypertension or False,
        "family_history_cardiovascular": profile.family_history_cardiovascular or False,
        "existing_conditions": profile.existing_conditions
    }

@router.put("/profile", response_model=ProfileResponse)
def update_user_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        profile = PatientProfile(user_id=current_user.id)
        db.add(profile)
        
    if data.full_name:
        current_user.full_name = data.full_name
        
    for field, val in data.model_dump(exclude_unset=True).items():
        if field == "full_name":
            continue
        setattr(profile, field, val)
        
    # Recalculate BMI if height and weight present
    if profile.height_cm and profile.weight_kg and profile.height_cm > 0:
        h_m = profile.height_cm / 100.0
        profile.bmi = round(profile.weight_kg / (h_m * h_m), 1)
        
    db.commit()
    db.refresh(profile)
    db.refresh(current_user)
    
    return {
        "id": profile.id,
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "age": profile.age,
        "gender": profile.gender,
        "height_cm": profile.height_cm,
        "weight_kg": profile.weight_kg,
        "bmi": profile.bmi,
        "smoking_status": profile.smoking_status or "never",
        "alcohol_consumption": profile.alcohol_consumption or "none",
        "physical_activity_hours": profile.physical_activity_hours or 0.0,
        "family_history_diabetes": profile.family_history_diabetes or False,
        "family_history_hypertension": profile.family_history_hypertension or False,
        "family_history_cardiovascular": profile.family_history_cardiovascular or False,
        "existing_conditions": profile.existing_conditions
    }

@router.delete("/users/me/health-data")
def delete_all_health_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete all health screenings and measurements belonging to the current user."""
    s_count = db.query(Screening).filter(Screening.user_id == current_user.id).delete()
    m_count = db.query(HealthMeasurement).filter(HealthMeasurement.user_id == current_user.id).delete()
    
    audit = AuditLog(
        user_id=current_user.id,
        action="user_cleared_all_health_data",
        details={"screenings_removed": s_count, "measurements_removed": m_count}
    )
    db.add(audit)
    db.commit()
    return {
        "message": "All health assessments and biometric measurements have been deleted.",
        "screenings_removed": s_count,
        "measurements_removed": m_count
    }

@router.delete("/users/me")
def delete_user_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permanently delete user account and all cascading data."""
    user_id = current_user.id
    email = current_user.email
    db.delete(current_user)
    db.commit()
    return {"message": f"Account for {email} and all associated data have been permanently deleted.", "user_id": user_id}
