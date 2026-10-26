"""
Authentication API Endpoints
Registration, Login, and Demo Quick-Login.
"""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.config import settings
from app.database.session import get_db
from app.models.entities import User, PatientProfile, AuditLog
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    Token,
    UserResponse,
    DemoLoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
)
from app.services.auth_service import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

INDIAN_DEMO_IDENTITIES = {
    "himanshu": {
        "name": "Himanshu Sharma",
        "email": "himanshu.sharma@healthai.local",
        "age": 46,
        "gender": "male",
        "height_cm": 178.0,
        "weight_kg": 77.5,
        "bmi": 24.5
    },
    "arpit": {
        "name": "Arpit Kumar",
        "email": "arpit.kumar@healthai.local",
        "age": 34,
        "gender": "male",
        "height_cm": 174.0,
        "weight_kg": 72.0,
        "bmi": 23.8
    },
    "priya": {
        "name": "Priya Verma",
        "email": "priya.verma@healthai.local",
        "age": 41,
        "gender": "female",
        "height_cm": 162.0,
        "weight_kg": 64.0,
        "bmi": 24.4
    },
    "rahul": {
        "name": "Rahul Singh",
        "email": "rahul.singh@healthai.local",
        "age": 52,
        "gender": "male",
        "height_cm": 176.0,
        "weight_kg": 81.0,
        "bmi": 26.1
    },
    "ananya": {
        "name": "Ananya Gupta",
        "email": "ananya.gupta@healthai.local",
        "age": 29,
        "gender": "female",
        "height_cm": 165.0,
        "weight_kg": 58.0,
        "bmi": 21.3
    },
    "neha": {
        "name": "Neha Mishra",
        "email": "neha.mishra@healthai.local",
        "age": 38,
        "gender": "female",
        "height_cm": 160.0,
        "weight_kg": 62.0,
        "bmi": 24.2
    }
}

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(data: UserRegister, db: Session = Depends(get_db)):
    if not data.terms_consented:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must consent to the Privacy Policy and Terms and Conditions to create an account."
        )

    existing = db.query(User).filter(User.email == data.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
        
    user = User(
        email=data.email.lower(),
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role="patient",
        is_demo=False
    )
    db.add(user)
    db.flush() # get user.id
    
    # Calculate initial BMI if provided
    bmi = None
    if data.height_cm and data.weight_kg and data.height_cm > 0:
        h_m = data.height_cm / 100.0
        bmi = round(data.weight_kg / (h_m * h_m), 1)
        
    profile = PatientProfile(
        user_id=user.id,
        age=data.age,
        gender=data.gender,
        height_cm=data.height_cm,
        weight_kg=data.weight_kg,
        bmi=bmi
    )
    db.add(profile)
    
    # Audit log
    audit = AuditLog(
        user_id=user.id,
        action="user_registered",
        details={"email": user.email, "role": user.role}
    )
    db.add(audit)
    db.commit()
    db.refresh(user)
    
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_demo": user.is_demo
        }
    }

@router.post("/login", response_model=Token)
def login_user(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated."
        )
        
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_demo": user.is_demo
        }
    }

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate a password reset token for the specified account."""
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user:
        return {
            "message": "If an account exists with this email, password reset instructions have been generated.",
            "reset_token": None
        }
    
    reset_token = create_access_token(
        {"sub": user.id, "email": user.email, "type": "password_reset"},
        expires_delta=timedelta(minutes=15)
    )
    return {
        "message": "Password reset token generated successfully. Valid for 15 minutes.",
        "reset_token": reset_token
    }

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Apply a new password using a verified password reset token."""
    try:
        payload = jwt.decode(data.token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "password_reset":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token type.")
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token payload.")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The password reset link is invalid or has expired.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    user.hashed_password = hash_password(data.new_password)
    audit = AuditLog(
        user_id=user.id,
        action="password_reset_completed",
        details={"email": user.email}
    )
    db.add(audit)
    db.commit()
    return {"message": "Password updated successfully. You may now log in with your new password."}

@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change password for an authenticated user."""
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The current password you provided is incorrect."
        )

    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long."
        )

    current_user.hashed_password = hash_password(data.new_password)
    audit = AuditLog(
        user_id=current_user.id,
        action="password_changed",
        details={"email": current_user.email}
    )
    db.add(audit)
    db.commit()
    return {"message": "Your password has been changed successfully."}

@router.post("/demo-login", response_model=Token)
def demo_login(data: DemoLoginRequest, db: Session = Depends(get_db)):
    """
    Demo login endpoint providing authentic sample profiles for presentation and testing.
    Uses realistic Indian demonstration identities.
    """
    persona_key = (data.persona or "himanshu").lower()
    persona_info = INDIAN_DEMO_IDENTITIES.get(persona_key, INDIAN_DEMO_IDENTITIES["himanshu"])
    demo_email = persona_info["email"]
    
    user = db.query(User).filter(User.email == demo_email).first()
    
    if not user:
        user = User(
            email=demo_email,
            hashed_password=hash_password("DemoPassword123!"),
            full_name=persona_info["name"],
            role="patient",
            is_demo=True
        )
        db.add(user)
        db.flush()
        
        profile = PatientProfile(
            user_id=user.id,
            age=persona_info["age"],
            gender=persona_info["gender"],
            height_cm=persona_info["height_cm"],
            weight_kg=persona_info["weight_kg"],
            bmi=persona_info["bmi"],
            smoking_status="former",
            alcohol_consumption="rare",
            physical_activity_hours=3.5,
            family_history_diabetes=True,
            family_history_hypertension=False,
            family_history_cardiovascular=False,
            existing_conditions="None reported"
        )
        db.add(profile)
        db.commit()
        db.refresh(user)
    elif user.full_name != persona_info["name"]:
        user.full_name = persona_info["name"]
        db.commit()
        db.refresh(user)
        
    token = create_access_token({"sub": user.id, "email": user.email, "role": "patient"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": "patient",
            "is_demo": True
        }
    }
