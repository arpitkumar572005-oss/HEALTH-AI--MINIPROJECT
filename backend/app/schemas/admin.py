"""
Admin Dashboard Schemas
Aggregated metrics preserving user privacy without exposing individual records.
"""

from typing import List, Dict, Any
from pydantic import BaseModel

class ScreeningTypeCount(BaseModel):
    screening_type: str
    count: int

class RiskCategoryCount(BaseModel):
    category: str
    count: int

class DailyScreeningCount(BaseModel):
    date: str
    count: int

class ModelUsageStats(BaseModel):
    disease_type: str
    version: str
    algorithm: str
    total_screenings: int
    roc_auc: float
    recall: float
    accuracy: float

class AdminOverviewResponse(BaseModel):
    total_users: int
    total_screenings: int
    screenings_today: int
    active_models_count: int
    screenings_by_type: List[ScreeningTypeCount]
    risk_distribution: List[RiskCategoryCount]
    screenings_trend_7d: List[DailyScreeningCount]
    model_usage: List[ModelUsageStats]
