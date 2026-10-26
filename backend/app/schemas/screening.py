"""
Pydantic Schemas for Screening Inputs, Outputs, Explainability,
Historical Comparison, and Symptom-Based Early Risk Screening
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ScreeningBaseInput(BaseModel):
    age: int = Field(..., ge=18, le=120, description="Age in years")
    gender: str = Field(..., description="'female', 'male', or 'other'")
    height_cm: Optional[float] = Field(None, ge=50, le=260, description="Height in centimeters")
    weight_kg: Optional[float] = Field(None, ge=20, le=350, description="Weight in kilograms")
    bmi: Optional[float] = Field(None, ge=10.0, le=70.0, description="Calculated Body Mass Index")
    symptoms: List[str] = Field(default_factory=list, description="Selected symptom chips")
    notes: Optional[str] = None

class DiabetesScreeningInput(ScreeningBaseInput):
    fasting_glucose: float = Field(..., ge=40, le=500, description="Fasting blood glucose in mg/dL")
    systolic_bp: int = Field(..., ge=70, le=260, description="Systolic BP in mmHg")
    diastolic_bp: int = Field(..., ge=40, le=180, description="Diastolic BP in mmHg")
    family_history: bool = Field(False, description="Family history of diabetes")
    physical_activity_hours: float = Field(2.5, ge=0, le=40, description="Weekly exercise hours")

class CardioScreeningInput(ScreeningBaseInput):
    systolic_bp: int = Field(..., ge=70, le=260, description="Systolic BP in mmHg")
    cholesterol: float = Field(..., ge=90, le=550, description="Total serum cholesterol in mg/dL")
    fasting_glucose: Optional[float] = Field(95, ge=40, le=500, description="Fasting glucose in mg/dL")
    heart_rate: int = Field(..., ge=35, le=220, description="Resting heart rate in bpm")
    smoking_status: str = Field("never", description="'never', 'former', 'active'")
    chest_discomfort_level: int = Field(0, ge=0, le=3, description="0: None, 1: Mild, 2: Moderate, 3: Atypical/Exertional")
    physical_activity_hours: float = Field(2.5, ge=0, le=40, description="Weekly exercise hours")

class HypertensionScreeningInput(ScreeningBaseInput):
    systolic_bp: int = Field(..., ge=70, le=260, description="Systolic BP in mmHg")
    diastolic_bp: int = Field(..., ge=40, le=180, description="Diastolic BP in mmHg")
    heart_rate: int = Field(..., ge=35, le=220, description="Resting heart rate in bpm")
    family_history: bool = Field(False, description="Family history of hypertension")
    sodium_intake: str = Field("moderate", description="'low', 'moderate', 'high'")
    smoking_status: str = Field("never", description="'never', 'former', 'active'")
    physical_activity_hours: float = Field(2.5, ge=0, le=40, description="Weekly exercise hours")

class KidneyScreeningInput(ScreeningBaseInput):
    systolic_bp: int = Field(..., ge=70, le=260, description="Systolic BP in mmHg")
    serum_creatinine: float = Field(..., ge=0.2, le=15.0, description="Serum creatinine in mg/dL")
    blood_urea: float = Field(..., ge=5.0, le=250.0, description="Blood urea nitrogen in mg/dL")
    albumin: int = Field(0, ge=0, le=4, description="Urine albumin level (0: normal, 1-4: mild to severe proteinuria)")
    fasting_glucose: Optional[float] = Field(95.0, ge=40, le=500, description="Fasting glucose in mg/dL")
    hemoglobin: float = Field(..., ge=4.0, le=22.0, description="Hemoglobin level in g/dL")
    history_hypertension: bool = Field(False, description="Prior diagnosis of hypertension")
    history_diabetes: bool = Field(False, description="Prior diagnosis of diabetes")
    pedal_edema: bool = Field(False, description="Swelling or fluid retention in lower extremities")

class SymptomScreeningInput(BaseModel):
    symptoms: List[str] = Field(..., description="Selected current symptoms")
    duration: str = Field("days", description="'days', 'weeks', 'months'")
    severity: str = Field("mild", description="'mild', 'moderate', 'severe'")
    onset: str = Field("gradual", description="'gradual', 'sudden', 'intermittent'")
    description: Optional[str] = Field(None, description="Optional patient symptom notes")
    # Optional supported current biometrics
    current_glucose: Optional[float] = Field(None, ge=40, le=500)
    current_systolic_bp: Optional[int] = Field(None, ge=70, le=260)
    current_diastolic_bp: Optional[int] = Field(None, ge=40, le=180)
    current_heart_rate: Optional[int] = Field(None, ge=35, le=220)
    current_weight_kg: Optional[float] = Field(None, ge=20, le=350)
    age: Optional[int] = Field(46, ge=18, le=120)
    gender: Optional[str] = Field("male")

class FeatureContributionItem(BaseModel):
    feature: str
    label: str
    contribution: float # percentage influence (0.0 to 1.0)
    direction: str # 'increases_risk', 'decreases_risk', 'neutral'
    patient_value: Any
    unit: str
    baseline_value: Optional[float] = None
    explanation: str

class ParameterComparisonItem(BaseModel):
    parameter: str
    key: str
    previous_value: Optional[str] = None
    current_value: str
    change: Optional[str] = None
    pct_change: Optional[str] = None
    trend: str
    has_previous: bool
    status_note: Optional[str] = None

class HistoricalComparisonResponse(BaseModel):
    has_previous_data: bool
    previous_screening_id: Optional[str] = None
    previous_date: Optional[str] = None
    previous_risk_score: Optional[float] = None
    previous_risk_percentage: Optional[int] = None
    previous_risk_category: Optional[str] = None
    current_risk_percentage: int
    current_risk_category: str
    risk_change_points: Optional[int] = None
    risk_trend: str # 'Increased', 'Decreased', 'Stable', 'Initial baseline'
    explanation: str
    parameter_comparisons: List[ParameterComparisonItem] = Field(default_factory=list)

class ScreeningResultResponse(BaseModel):
    id: str
    screening_type: str
    screening_title: str
    model_version: str
    algorithm: str
    risk_score: float # e.g. 0.36
    risk_score_percentage: int # e.g. 36
    risk_category: str # 'lower', 'moderate', 'elevated'
    risk_heading: str
    risk_summary: str
    feature_contributions: List[FeatureContributionItem]
    general_guidance: List[str]
    emergency_warning: bool
    emergency_message: Optional[str] = None
    medical_disclaimer: str
    created_at: str
    historical_comparison: Optional[HistoricalComparisonResponse] = None
    symptom_progression: Optional[Dict[str, Any]] = None
    identified_patterns: Optional[List[Dict[str, Any]]] = None

class ScreeningHistoryItem(BaseModel):
    id: str
    screening_type: str
    screening_title: str
    model_version: str
    risk_score: float
    risk_score_percentage: int
    risk_category: str
    emergency_warning: bool
    created_at: str
    historical_comparison: Optional[Dict[str, Any]] = None
