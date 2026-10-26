"""
Database Models for HealthAI — Personal AI Health Companion
Includes User (Patient-only), PatientProfile, HealthMeasurement, Screening,
DailyCheckIn, HealthGoal, HealthReminder, HealthDocument, ModelVersion, AuditLog
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON
)
from sqlalchemy.orm import relationship
from app.database.session import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(32), default="patient", nullable=False) # Always 'patient'
    is_active = Column(Boolean, default=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)
    
    # Relationships
    profile = relationship("PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    measurements = relationship("HealthMeasurement", back_populates="user", cascade="all, delete-orphan")
    screenings = relationship("Screening", back_populates="user", cascade="all, delete-orphan")
    checkins = relationship("DailyCheckIn", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("HealthGoal", back_populates="user", cascade="all, delete-orphan")
    reminders = relationship("HealthReminder", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("HealthDocument", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

class PatientProfile(Base):
    __tablename__ = "patient_profiles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    age = Column(Integer, nullable=True)
    gender = Column(String(16), nullable=True) # 'female', 'male', 'other'
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)
    
    # Medical background & Lifestyle
    smoking_status = Column(String(32), default="never") # 'never', 'former', 'active'
    alcohol_consumption = Column(String(32), default="none") # 'none', 'rare', 'moderate', 'frequent'
    physical_activity_hours = Column(Float, default=3.0)
    sleep_hours_typical = Column(Float, default=7.3)
    blood_type = Column(String(8), default="O+")
    family_history_diabetes = Column(Boolean, default=True)
    family_history_hypertension = Column(Boolean, default=False)
    family_history_cardiovascular = Column(Boolean, default=False)
    existing_conditions = Column(Text, nullable=True)
    known_allergies = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)
    
    user = relationship("User", back_populates="profile")

class HealthMeasurement(Base):
    __tablename__ = "health_measurements"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    measurement_type = Column(String(64), nullable=False, index=True) 
    # e.g., 'blood_glucose', 'systolic_bp', 'diastolic_bp', 'heart_rate', 'weight', 'cholesterol', 'hba1c', 'hdl', 'ldl', 'triglycerides', 'sleep', 'steps'
    value = Column(Float, nullable=False)
    unit = Column(String(32), nullable=False)
    notes = Column(String(255), nullable=True)
    source = Column(String(64), default="manual_input") # 'screening', 'medical_report', 'manual_input', 'checkin'
    is_demo = Column(Boolean, default=False)
    measured_at = Column(DateTime, default=get_utc_now, index=True)
    
    user = relationship("User", back_populates="measurements")

class Screening(Base):
    __tablename__ = "screenings"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    screening_type = Column(String(64), nullable=False, index=True) # 'diabetes', 'cardiovascular', 'hypertension'
    model_version = Column(String(32), nullable=False)
    algorithm_name = Column(String(64), nullable=False)
    
    risk_score = Column(Float, nullable=False) # 0.0 - 1.0 (e.g., 0.36)
    risk_category = Column(String(32), nullable=False) # 'lower', 'moderate', 'elevated'
    risk_summary = Column(String(255), nullable=False)
    
    input_data = Column(JSON, nullable=False)
    feature_contributions = Column(JSON, nullable=False)
    general_guidance = Column(JSON, nullable=False)
    historical_comparison = Column(JSON, nullable=True) # Current vs Previous intelligent comparison
    symptom_data = Column(JSON, nullable=True) # Duration, severity, onset, notes, symptom shifts
    
    emergency_warning = Column(Boolean, default=False)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now, index=True)
    
    user = relationship("User", back_populates="screenings")

class DailyCheckIn(Base):
    __tablename__ = "daily_checkins"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    mood = Column(String(32), nullable=False) # 'great', 'good', 'okay', 'not_well', 'very_bad'
    energy_level = Column(Integer, default=7) # 1 - 10
    stress_level = Column(String(32), default="medium") # 'low', 'medium', 'high'
    sleep_hours = Column(Float, default=7.3)
    symptoms = Column(JSON, default=list) # e.g. ['Headache'] or []
    activity_steps = Column(Integer, default=6240)
    summary = Column(Text, nullable=False)
    checkin_date = Column(String(16), nullable=False, index=True) # 'YYYY-MM-DD'
    created_at = Column(DateTime, default=get_utc_now, index=True)
    
    user = relationship("User", back_populates="checkins")

class HealthGoal(Base):
    __tablename__ = "health_goals"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    category = Column(String(32), nullable=False) # 'weight', 'steps', 'exercise', 'sleep', 'water', 'screening'
    title = Column(String(128), nullable=False)
    current_value = Column(Float, nullable=False)
    target_value = Column(Float, nullable=False)
    unit = Column(String(32), nullable=False)
    status = Column(String(32), default="active") # 'active', 'completed', 'paused'
    deadline = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)
    
    user = relationship("User", back_populates="goals")

class HealthReminder(Base):
    __tablename__ = "health_reminders"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    reminder_type = Column(String(64), nullable=False) # 'medication', 'blood_pressure', 'blood_glucose', 'exercise', 'water', 'screening'
    title = Column(String(128), nullable=False)
    time_str = Column(String(32), nullable=False) # e.g. '8:00 PM'
    date_str = Column(String(32), default="Today")
    frequency = Column(String(32), default="daily") # 'daily', 'weekly', 'as_needed'
    is_completed = Column(Boolean, default=False)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    
    user = relationship("User", back_populates="reminders")

class HealthDocument(Base):
    __tablename__ = "health_documents"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    filename = Column(String(255), nullable=False)
    document_type = Column(String(64), default="blood_report") # 'blood_report', 'ultrasound_report', 'xray_report', 'ct_report', 'mri_report', 'other_report', 'unknown_report'
    file_size_kb = Column(Float, default=124.0)
    extracted_text = Column(Text, nullable=True)
    impression = Column(Text, nullable=True)
    ai_explanation = Column(Text, nullable=True)
    processing_status = Column(String(32), default="completed") # 'completed', 'processing', 'failed'
    extraction_confidence = Column(Float, default=1.0)
    is_sample = Column(Boolean, default=False)
    processing_metadata = Column(JSON, nullable=True) # Developer debug info: page_count, ocr_performed, text_length, etc.
    detected_parameters = Column(JSON, default=list) # [{parameter, value, unit, reference, status, type, explanation}]
    summary = Column(Text, nullable=False)
    questions_to_discuss = Column(JSON, default=list)
    comparison_with_previous = Column(JSON, nullable=True) # Intelligent current vs previous report comparison
    derived_screening_id = Column(String(36), nullable=True) # Linked new screening executed from report
    created_at = Column(DateTime, default=get_utc_now, index=True)
    
    user = relationship("User", back_populates="documents")

class ModelVersion(Base):
    __tablename__ = "model_versions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    disease_type = Column(String(64), nullable=False, unique=True)
    version = Column(String(32), nullable=False)
    algorithm = Column(String(64), nullable=False)
    metrics = Column(JSON, nullable=False)
    features = Column(JSON, nullable=False)
    trained_at = Column(DateTime, default=get_utc_now)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(128), nullable=False)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=get_utc_now, index=True)
    
    user = relationship("User", back_populates="audit_logs")
