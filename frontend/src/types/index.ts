export type Role = 'patient';
export type ScreeningType = 'diabetes' | 'cardiovascular' | 'kidney' | 'hypertension' | 'symptom_risk' | 'symptoms';
export type RiskCategory = 'lower' | 'moderate' | 'elevated';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_demo: boolean;
  created_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface PatientProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  bmi: number | null;
  smoking_status: string;
  alcohol_consumption: string;
  physical_activity_hours: number;
  family_history_diabetes: boolean;
  family_history_hypertension: boolean;
  family_history_cardiovascular: boolean;
  existing_conditions?: string | null;
}

export interface FeatureContribution {
  feature: string;
  label: string;
  contribution: number; // 0.0 - 1.0
  direction: 'increases_risk' | 'decreases_risk' | 'neutral';
  patient_value: any;
  unit: string;
  baseline_value?: number;
  explanation: string;
}

export interface ParameterComparison {
  parameter: string;
  key: string;
  previous_value?: string | null;
  current_value: string;
  change?: string | null;
  pct_change?: string | null;
  trend: string;
  has_previous: boolean;
  status_note?: string | null;
}

export interface HistoricalComparison {
  has_previous_data: boolean;
  previous_screening_id?: string | null;
  previous_date?: string | null;
  previous_risk_score?: number | null;
  previous_risk_percentage?: number | null;
  previous_risk_category?: string | null;
  current_risk_percentage: number;
  current_risk_category: string;
  risk_change_points?: number | null;
  risk_trend: string;
  explanation: string;
  parameter_comparisons: ParameterComparison[];
}

export interface SymptomProgression {
  new_symptoms?: string[];
  continuing_symptoms?: string[];
  resolved_symptoms?: string[];
  newly_reported?: string[];
  continuing?: string[];
  resolved?: string[];
  previous_count?: number;
  current_count?: number;
  progression_summary?: string;
  has_previous_history?: boolean;
}

export interface IdentifiedPattern {
  cluster?: string;
  name?: string;
  category?: string;
  symptoms?: string[];
  matched_symptoms?: string[];
  description: string;
  clinical_implication?: string;
}

export interface ScreeningResult {
  id: string;
  screening_type: ScreeningType;
  screening_title: string;
  title?: string;
  model_version: string;
  algorithm: string;
  risk_score: number;
  risk_score_percentage: number;
  risk_category: RiskCategory;
  risk_heading: string;
  risk_summary: string;
  summary?: string;
  feature_contributions: FeatureContribution[];
  factors?: Array<{ factor: string; description: string; impact: string }>;
  general_guidance: string[];
  recommendations?: string[];
  emergency_warning: boolean;
  emergency_message?: string | null;
  medical_disclaimer: string;
  input_data?: Record<string, any>;
  created_at: string;
  historical_comparison?: HistoricalComparison | null;
  symptom_progression?: SymptomProgression | null;
  identified_patterns?: IdentifiedPattern[] | null;
}

export interface ScreeningHistoryItem {
  id: string;
  screening_type: ScreeningType;
  screening_title: string;
  title?: string;
  summary?: string;
  risk_summary?: string;
  model_version: string;
  risk_score: number;
  risk_score_percentage: number;
  risk_category: RiskCategory;
  emergency_warning: boolean;
  created_at: string;
  historical_comparison?: HistoricalComparison | null;
}

export interface ScreeningComparisonItem {
  id?: string;
  date?: string;
  score_pct?: number;
  category?: string;
  screening_type?: string;
  screening_title?: string;
}

export interface FactorShift {
  metric: string;
  earlier_value: string;
  latest_value: string;
  change: string;
}

export interface ScreeningComparison {
  screening1: ScreeningComparisonItem & Record<string, any>;
  screening2: ScreeningComparisonItem & Record<string, any>;
  score_diff_pct: number;
  trajectory: string;
  commentary: string;
  factor_shifts: FactorShift[];
  disclaimer: string;
  risk_difference?: number;
  direction?: string;
  parameter_differences?: any[];
}

export interface HealthMeasurement {
  id: string;
  measurement_type: string;
  value: number;
  unit: string;
  notes?: string;
  is_demo: boolean;
  measured_at: string;
}

export interface HealthTrendPoint {
  timestamp: string;
  date_label: string;
  value: number;
}

export interface HealthTrends {
  timeframe: string;
  metrics: {
    blood_glucose: HealthTrendPoint[];
    systolic_bp: HealthTrendPoint[];
    diastolic_bp: HealthTrendPoint[];
    heart_rate: HealthTrendPoint[];
    weight: HealthTrendPoint[];
    cholesterol: HealthTrendPoint[];
  };
  latest_values: Record<string, { value: number; unit: string; date: string }>;
}

export interface DailyCheckIn {
  id: string;
  user_id: string;
  mood: string;
  energy_level: number;
  stress_level: string;
  sleep_hours: number;
  symptoms?: string[];
  physical_activity_mins: number;
  notes?: string;
  check_in_date: string;
  created_at: string;
}

export interface HealthGoal {
  id: string;
  user_id: string;
  title: string;
  category: 'weight' | 'steps' | 'sleep' | 'water' | 'exercise' | 'custom';
  target_value: number;
  current_value: number;
  unit: string;
  deadline?: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  progress_percentage?: number;
}

export interface HealthReminder {
  id: string;
  user_id: string;
  title: string;
  reminder_type: string;
  category?: string;
  next_due?: string;
  time_of_day: string;
  frequency: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  event_type: 'screening' | 'measurement' | 'checkin' | 'document';
  title: string;
  description: string;
  timestamp: string;
  badge_color?: 'blue' | 'green' | 'amber' | 'purple';
  metadata?: Record<string, any>;
}

export interface HealthInsight {
  id: string;
  category: string;
  title: string;
  level: string;
  summary: string;
  recommendation: string;
  description?: string;
  impact_level?: string;
  action_recommended?: string;
  metric_label?: string;
  metric_value?: string;
  metric_change?: string;
}

export interface WeeklySummary {
  score: number;
  headline: string;
  summary: string;
  highlights: string[];
  focus_areas: string[];
  week_label?: string;
  overall_status?: string;
  risk_trend_summary?: string;
  adherence_rate?: number;
}

export interface ReportParameter {
  parameter: string;
  value: any;
  unit: string;
  reference?: string | null;
  reference_range?: string | null;
  status: string;
  type?: 'numerical' | 'observation' | string;
  explanation?: string | null;
  source_text?: string | null;
}

export interface ReportParameterComparison {
  parameter: string;
  previous_value?: string | null;
  current_value: string;
  change?: string | null;
  percentage_change?: string | null;
  trend: string;
  status: string;
  has_previous: boolean;
  unit?: string;
}

export interface ReportScreeningOpportunity {
  disease: string;
  title: string;
  parameter: string;
  value: number;
  unit: string;
}

export interface ReportAnalysis {
  id: string;
  filename: string;
  document_type: string;
  file_size_kb: number;
  created_at: string;
  detected_parameters: ReportParameter[];
  summary: string;
  impression?: string | null;
  ai_explanation?: string | null;
  processing_status?: string;
  extraction_confidence?: number;
  is_sample?: boolean;
  processing_metadata?: Record<string, any>;
  questions_to_discuss: string[];
  has_previous_report: boolean;
  previous_report_id?: string | null;
  previous_report_date?: string | null;
  previous_filename?: string | null;
  parameter_comparisons: ReportParameterComparison[];
  change_explanation: string;
  can_run_new_screening: boolean;
  screening_opportunities: ReportScreeningOpportunity[];
  derived_screening_id?: string | null;
  medical_disclaimer: string;
}

export type LabReportAnalysis = ReportAnalysis;

export interface ReportHistoryItem {
  id: string;
  filename: string;
  document_type: string;
  file_size_kb: number;
  parameters_count: number;
  created_at: string;
  summary_snippet: string;
  has_previous: boolean;
  impression?: string | null;
  is_sample?: boolean;
}

export interface SymptomScreeningFormData {
  symptoms: string[];
  duration: string;
  severity: string;
  onset: string;
  description?: string;
  current_glucose?: number;
  current_systolic_bp?: number;
  current_diastolic_bp?: number;
  current_heart_rate?: number;
  current_weight_kg?: number;
  age?: number;
  gender?: string;
}
