"""
Profile Pydantic Schemas
"""

from typing import Optional
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
