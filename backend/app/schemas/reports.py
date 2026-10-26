"""
Pydantic Schemas for Medical Report Summarizer & Intelligent Report Comparison
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ReportParameterItem(BaseModel):
    parameter: str
    value: Any
    unit: str
    reference: Optional[str] = None
    status: str = "normal" # 'normal', 'borderline', 'elevated', 'low', 'desirable', 'attention', 'critical'
    type: Optional[str] = "numerical" # 'numerical' or 'observation'
    explanation: Optional[str] = None
    source_text: Optional[str] = None

class ReportParameterComparisonItem(BaseModel):
    parameter: str
    previous_value: Optional[str] = None
    current_value: str
    change: Optional[str] = None
    percentage_change: Optional[str] = None
    trend: str # 'Increased', 'Decreased', 'Stable / Minimal Change', 'New baseline recorded'
    status: str
    has_previous: bool

class ReportScreeningOpportunity(BaseModel):
    disease: str # 'diabetes', 'cardiovascular', 'hypertension'
    title: str
    parameter: str
    value: float
    unit: str

class ReportAnalysisResponse(BaseModel):
    id: str
    filename: str
    document_type: str
    file_size_kb: float
    created_at: str
    detected_parameters: List[ReportParameterItem]
    summary: str
    impression: Optional[str] = None
    ai_explanation: Optional[str] = None
    processing_status: Optional[str] = "completed"
    extraction_confidence: Optional[float] = 1.0
    is_sample: Optional[bool] = False
    processing_metadata: Optional[Dict[str, Any]] = None
    questions_to_discuss: List[str]
    has_previous_report: bool
    previous_report_id: Optional[str] = None
    previous_report_date: Optional[str] = None
    previous_filename: Optional[str] = None
    parameter_comparisons: List[ReportParameterComparisonItem]
    change_explanation: str
    can_run_new_screening: bool
    screening_opportunities: List[ReportScreeningOpportunity]
    derived_screening_id: Optional[str] = None
    medical_disclaimer: str

class ReportHistoryItem(BaseModel):
    id: str
    filename: str
    document_type: str
    file_size_kb: float
    parameters_count: int
    created_at: str
    summary_snippet: str
    has_previous: bool
    impression: Optional[str] = None
    is_sample: Optional[bool] = False

class RunReportScreeningInput(BaseModel):
    disease_type: str = Field(..., description="'diabetes', 'cardiovascular', or 'hypertension'")
    # Any optional overrides
    age: Optional[int] = 46
    gender: Optional[str] = "male"
    bmi: Optional[float] = 24.5
