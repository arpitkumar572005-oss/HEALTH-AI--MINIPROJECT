"""
Profile and Health Data Schemas
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = Field(None, ge=18, le=120)
    gender: Optional[str] = None
    height_cm: Optional[float] = Field(None, ge=50, le=260)
    weight_kg: Optional[float] = Field(None, ge=20, le=350)
    smoking_status: Optional[str] = None
    alcohol_consumption: Optional[str] = None
    physical_activity_hours: Optional[float] = None
    family_history_diabetes: Optional[bool] = None
    family_history_hypertension: Optional[bool] = None
    family_history_cardiovascular: Optional[bool] = None
    existing_conditions: Optional[str] = None

class ProfileResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    email: str
    role: str
    age: Optional[int]
    gender: Optional[str]
    height_cm: Optional[float]
    weight_kg: Optional[float]
    bmi: Optional[float]
    smoking_status: str
    alcohol_consumption: str
    physical_activity_hours: float
    family_history_diabetes: bool
    family_history_hypertension: bool
    family_history_cardiovascular: bool
    existing_conditions: Optional[str]

class MeasurementCreate(BaseModel):
    measurement_type: str = Field(..., description="e.g. 'blood_glucose', 'systolic_bp', 'diastolic_bp', 'heart_rate', 'weight', 'bmi', 'cholesterol'")
    value: float
    unit: str
    notes: Optional[str] = None
    source: Optional[str] = "manual_input"

class MeasurementResponse(BaseModel):
    id: str
    measurement_type: str
    value: float
    unit: str
    notes: Optional[str]
    source: Optional[str] = "manual_input"
    is_demo: bool
    measured_at: str

class HealthTrendDataPoint(BaseModel):
    timestamp: str
    date_label: str
    value: float

class MetricTrendDetail(BaseModel):
    data_points: List[HealthTrendDataPoint] = []
    count: int = 0
    has_sufficient_data: bool = False
    status_message: Optional[str] = None
    latest: Optional[Dict[str, Any]] = None
    shift_delta: Optional[float] = None
    trend_direction: Optional[str] = None

class HealthTrendsResponse(BaseModel):
    timeframe: str
    metrics: Dict[str, List[HealthTrendDataPoint]]
    metric_details: Optional[Dict[str, MetricTrendDetail]] = None
    latest_values: Dict[str, Any] = {}
    screening_risk_trends: Optional[Dict[str, Any]] = None

class PatientHealthSummaryResponse(BaseModel):
    patient_id: str
    full_name: str
    profile: Optional[Dict[str, Any]] = None
    latest_screenings: Dict[str, Any] = {}
    screening_counts: Dict[str, int] = {}
    latest_measurements: Dict[str, Any] = {}
    recent_events_count: int = 0
    reports_count: int = 0

