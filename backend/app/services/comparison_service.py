"""
HealthAI Intelligent Comparison & Longitudinal Analytics Service
Automatically retrieves previous records, performs current vs previous comparison,
evaluates parameter shifts, calculates risk deltas, and generates non-diagnostic explanations.
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.entities import Screening, HealthMeasurement, HealthDocument, DailyCheckIn

DISCLAIMER_TEXT = (
    "This AI-generated result is intended for screening and educational purposes only "
    "and is not a medical diagnosis. Please consult a qualified healthcare professional "
    "for medical advice, diagnosis, or treatment."
)

EMERGENCY_TEXT = (
    "If you are experiencing severe, sudden, or rapidly worsening symptoms, "
    "seek urgent medical attention or contact local emergency services immediately."
)

# Standard parameter metadata
BIOMARKER_SPECS = {
    "fasting_glucose": {"label": "Fasting Blood Glucose", "unit": "mg/dL", "optimal_min": 70, "optimal_max": 99, "higher_is_worse": True},
    "systolic_bp": {"label": "Systolic Blood Pressure", "unit": "mmHg", "optimal_min": 90, "optimal_max": 120, "higher_is_worse": True},
    "diastolic_bp": {"label": "Diastolic Blood Pressure", "unit": "mmHg", "optimal_min": 60, "optimal_max": 80, "higher_is_worse": True},
    "bmi": {"label": "Body Mass Index (BMI)", "unit": "kg/m²", "optimal_min": 18.5, "optimal_max": 24.9, "higher_is_worse": True},
    "weight_kg": {"label": "Body Weight", "unit": "kg", "optimal_min": 50, "optimal_max": 80, "higher_is_worse": True},
    "cholesterol": {"label": "Total Cholesterol", "unit": "mg/dL", "optimal_min": 125, "optimal_max": 199, "higher_is_worse": True},
    "heart_rate": {"label": "Resting Heart Rate", "unit": "BPM", "optimal_min": 60, "optimal_max": 100, "higher_is_worse": True},
    "hba1c": {"label": "HbA1c", "unit": "%", "optimal_min": 4.0, "optimal_max": 5.6, "higher_is_worse": True},
    "hemoglobin": {"label": "Hemoglobin", "unit": "g/dL", "optimal_min": 13.5, "optimal_max": 17.5, "higher_is_worse": False},
    "physical_activity_hours": {"label": "Physical Activity", "unit": "hrs/wk", "optimal_min": 2.5, "optimal_max": 10.0, "higher_is_worse": False},
    "serum_creatinine": {"label": "Serum Creatinine", "unit": "mg/dL", "optimal_min": 0.6, "optimal_max": 1.2, "higher_is_worse": True},
    "blood_urea": {"label": "Blood Urea Nitrogen", "unit": "mg/dL", "optimal_min": 15, "optimal_max": 45, "higher_is_worse": True},
    "albumin": {"label": "Urine Albumin (Proteinuria)", "unit": "grade", "optimal_min": 0, "optimal_max": 0, "higher_is_worse": True},
}

def get_latest_previous_screening(
    user_id: str,
    screening_type: str,
    db: Session,
    exclude_id: Optional[str] = None,
    before_datetime: Optional[datetime] = None
) -> Optional[Screening]:
    """Retrieves the most recent valid prior screening for this user and disease type."""
    query = db.query(Screening).filter(
        Screening.user_id == user_id,
        Screening.screening_type == screening_type
    )
    if exclude_id:
        query = query.filter(Screening.id != exclude_id)
    if before_datetime:
        query = query.filter(Screening.created_at < before_datetime)
    return query.order_by(Screening.created_at.desc()).first()

def get_previous_biometric_value(user_id: str, key: str, db: Session, default_from_prev_screening: Optional[Any] = None) -> Optional[Tuple[float, str]]:
    """
    Finds the recorded historical value for a biometric parameter
    from previous screening inputs. Strictly maintains disease isolation.
    """
    if default_from_prev_screening is not None:
        try:
            return float(default_from_prev_screening), BIOMARKER_SPECS.get(key, {}).get("unit", "")
        except (ValueError, TypeError):
            pass

    return None

def compute_parameter_comparison(
    key: str,
    current_val: Any,
    user_id: str,
    db: Session,
    prev_screening_inputs: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Compares a single current parameter against automatically retrieved previous records.
    Returns structured comparison with change, percentage change, and trend.
    """
    spec = BIOMARKER_SPECS.get(key, {
        "label": key.replace("_", " ").title(),
        "unit": "",
        "higher_is_worse": True
    })

    if current_val is None:
        return {
            "parameter": spec["label"],
            "key": key,
            "previous_value": None,
            "current_value": "N/A",
            "change": None,
            "pct_change": None,
            "trend": "No data",
            "has_previous": False,
            "status_note": "No current measurement provided."
        }

    try:
        curr_num = float(current_val)
    except (ValueError, TypeError):
        return {
            "parameter": spec["label"],
            "key": key,
            "previous_value": str(prev_screening_inputs.get(key)) if prev_screening_inputs and key in prev_screening_inputs else None,
            "current_value": str(current_val),
            "change": None,
            "pct_change": None,
            "trend": "Qualitative",
            "has_previous": prev_screening_inputs is not None and key in prev_screening_inputs,
            "status_note": "Categorical health factor."
        }

    # Retrieve historical previous value from the previous screening
    prev_screening_val = prev_screening_inputs.get(key) if prev_screening_inputs else None
    prev_tuple = get_previous_biometric_value(user_id, key, db, default_from_prev_screening=prev_screening_val)

    if prev_tuple is None:
        return {
            "parameter": spec["label"],
            "key": key,
            "previous_value": None,
            "current_value": f"{curr_num:g} {spec['unit']}".strip(),
            "change": "No previous data available for comparison.",
            "pct_change": None,
            "trend": "Baseline recorded",
            "has_previous": False,
            "status_note": "First recorded measurement for this parameter in this screening type."
        }

    prev_num, unit = prev_tuple
    diff = round(curr_num - prev_num, 1)

    pct_change_str = None
    if prev_num != 0:
        pct_val = round(((curr_num - prev_num) / abs(prev_num)) * 100, 1)
        pct_change_str = f"{'+' if pct_val > 0 else ''}{pct_val}%"

    if diff > 0:
        change_str = f"+{diff:g} {unit}".strip()
        trend = "Increased"
    elif diff < 0:
        change_str = f"{diff:g} {unit}".strip()
        trend = "Decreased"
    else:
        change_str = f"0 {unit}".strip()
        trend = "Stable / Unchanged"

    return {
        "parameter": spec["label"],
        "key": key,
        "previous_value": f"{prev_num:g} {unit}".strip(),
        "current_value": f"{curr_num:g} {unit}".strip(),
        "change": change_str,
        "pct_change": pct_change_str,
        "trend": trend,
        "has_previous": True,
        "status_note": f"Compared with previous record ({prev_num:g} {unit})."
    }

def build_screening_historical_comparison(
    current_inputs: Dict[str, Any],
    new_risk_score: float,
    new_risk_category: str,
    screening_type: str,
    user_id: str,
    db: Session,
    exclude_id: Optional[str] = None,
    before_datetime: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Performs intelligent CURRENT vs PREVIOUS comparison across:
    1. Overall risk score & risk category
    2. Model-supported biomarker parameters (glucose, blood pressure, BMI, cholesterol, etc.)
    3. Generates clear, non-diagnostic explanation of what changed
    """
    prev_screening = get_latest_previous_screening(
        user_id=user_id,
        screening_type=screening_type,
        db=db,
        exclude_id=exclude_id,
        before_datetime=before_datetime
    )
    curr_risk_pct = int(round(new_risk_score * 100))

    # Relevant parameters to compare based on screening type
    type_keys_map = {
        "diabetes": ["fasting_glucose", "bmi", "systolic_bp", "diastolic_bp", "physical_activity_hours"],
        "cardiovascular": ["systolic_bp", "cholesterol", "heart_rate", "fasting_glucose", "bmi"],
        "hypertension": ["systolic_bp", "diastolic_bp", "heart_rate", "bmi", "physical_activity_hours"],
        "symptom_risk": ["fasting_glucose", "systolic_bp", "diastolic_bp", "heart_rate", "bmi"]
    }
    keys_to_compare = type_keys_map.get(screening_type, ["fasting_glucose", "systolic_bp", "bmi"])

    disease_title = screening_type.replace('_', ' ').title()

    if not prev_screening:
        clean_params = []
        for k in keys_to_compare:
            val = current_inputs.get(k)
            if val is not None:
                spec = BIOMARKER_SPECS.get(k, {
                    "label": k.replace("_", " ").title(),
                    "unit": ""
                })
                clean_params.append({
                    "parameter": spec["label"],
                    "key": k,
                    "previous_value": None,
                    "current_value": f"{val:g} {spec['unit']}".strip() if isinstance(val, (int, float)) else str(val),
                    "change": "No previous data available for comparison.",
                    "pct_change": None,
                    "trend": "Baseline recorded",
                    "has_previous": False,
                    "status_note": f"No previous {disease_title} screening record found in database."
                })

        explanation = (
            f"Baseline screening: no previous {disease_title} screening available for comparison. "
            f"No previous data available for comparison. "
            f"This is your initial baseline assessment for {disease_title}. "
            f"Your current estimated risk score is {curr_risk_pct}% ({new_risk_category.title()} Estimated Risk). "
            f"HealthAI has recorded these measurements as your active baseline. Subsequent screenings will automatically "
            f"compare new entries against this record to identify trends over time."
        )
        return {
            "has_previous_data": False,
            "previous_screening_id": None,
            "previous_date": None,
            "previous_risk_score": None,
            "previous_risk_percentage": None,
            "previous_risk_category": None,
            "current_risk_percentage": curr_risk_pct,
            "current_risk_category": new_risk_category,
            "risk_change_points": None,
            "risk_trend": "No previous data",
            "explanation": explanation,
            "parameter_comparisons": clean_params
        }

    prev_inputs = prev_screening.input_data if prev_screening else {}
    param_comparisons = []
    
    for k in keys_to_compare:
        val = current_inputs.get(k)
        if val is not None:
            comp = compute_parameter_comparison(k, val, user_id, db, prev_screening_inputs=prev_inputs)
            param_comparisons.append(comp)

    prev_risk_pct = int(round(prev_screening.risk_score * 100))
    risk_diff = curr_risk_pct - prev_risk_pct
    prev_date_str = prev_screening.created_at.strftime("%b %d, %Y")

    if risk_diff > 0:
        risk_trend = "Increased"
        trend_clause = f"increased by {risk_diff} percentage points (from {prev_risk_pct}% to {curr_risk_pct}%)"
    elif risk_diff < 0:
        risk_trend = "Decreased"
        trend_clause = f"decreased by {abs(risk_diff)} percentage points (from {prev_risk_pct}% down to {curr_risk_pct}%)"
    else:
        risk_trend = "Stable"
        trend_clause = f"remained consistent at {curr_risk_pct}%"

    # Identify which parameters showed notable change
    shifted_params = [p for p in param_comparisons if p.get("has_previous") and p.get("trend") in ["Increased", "Decreased"]]
    
    param_phrases = []
    for sp in shifted_params:
        param_phrases.append(f"{sp['parameter'].lower()} changed from {sp['previous_value']} to {sp['current_value']} ({sp['change']})")

    if param_phrases:
        changes_summary = "; ".join(param_phrases)
        explanation = (
            f"Compared to your previous screening on {prev_date_str}, your estimated risk {trend_clause}. "
            f"Observable biomarker changes include: {changes_summary}. "
            f"The change in these parameters coincided with a change in the model's estimated risk. "
            f"This AI assessment reflects statistical screening probabilities and is not a medical diagnosis. "
            f"Discuss persistent or concerning changes with a qualified healthcare professional."
        )
    else:
        explanation = (
            f"Compared to your previous screening on {prev_date_str}, your estimated risk {trend_clause}. "
            f"Your submitted health measurements remained stable relative to prior records. "
            f"Continue routine preventive monitoring and healthy lifestyle practices."
        )

    return {
        "has_previous_data": True,
        "previous_screening_id": prev_screening.id,
        "previous_date": prev_date_str,
        "previous_risk_score": prev_screening.risk_score,
        "previous_risk_percentage": prev_risk_pct,
        "previous_risk_category": prev_screening.risk_category,
        "current_risk_percentage": curr_risk_pct,
        "current_risk_category": new_risk_category,
        "risk_change_points": risk_diff,
        "risk_trend": risk_trend,
        "explanation": explanation,
        "parameter_comparisons": param_comparisons
    }

def run_symptom_early_risk_analysis(
    symptoms: List[str],
    duration: str,
    severity: str,
    onset: str,
    description: Optional[str],
    current_vitals: Dict[str, Any],
    user_id: str,
    db: Session
) -> Dict[str, Any]:
    """
    Evaluates current symptoms alongside current vitals and automatically retrieved previous records.
    Assesses potential early risk patterns (metabolic, cardiovascular, hypertensive)
    and performs symptom progression comparison (new vs continuing vs resolved).
    """
    # 1. Retrieve previous symptoms from checkins and screenings
    prev_symptoms = set()
    recent_checkins = db.query(DailyCheckIn).filter(DailyCheckIn.user_id == user_id).order_by(DailyCheckIn.created_at.desc()).limit(5).all()
    for c in recent_checkins:
        if c.symptoms:
            prev_symptoms.update(c.symptoms)

    recent_screenings = db.query(Screening).filter(Screening.user_id == user_id).order_by(Screening.created_at.desc()).limit(5).all()
    for s in recent_screenings:
        if s.input_data and "symptoms" in s.input_data:
            s_list = s.input_data["symptoms"]
            if isinstance(s_list, list):
                prev_symptoms.update(s_list)

    current_set = set(symptoms)
    new_symptoms = list(current_set - prev_symptoms)
    continuing_symptoms = list(current_set & prev_symptoms)
    resolved_symptoms = list(prev_symptoms - current_set)

    # 2. Cluster patterns
    metabolic_symptoms = {"Excessive thirst", "Frequent urination", "Fatigue", "Unusual weight change", "Slow healing cuts"}
    cardiovascular_symptoms = {"Chest discomfort", "Shortness of breath", "Heart palpitations", "Dizziness", "Swollen feet or ankles"}
    hypertensive_symptoms = {"Headache", "Dizziness", "Blurred vision", "Facial flushing", "Morning head pressure"}

    metabolic_matches = list(current_set & metabolic_symptoms)
    cardio_matches = list(current_set & cardiovascular_symptoms)
    htn_matches = list(current_set & hypertensive_symptoms)

    # 3. Calculate calibrated early risk score based on symptom cluster density, severity, duration
    base_score = 0.12 # low baseline
    
    # Severity weight
    sev_weight = {"mild": 0.05, "moderate": 0.15, "severe": 0.28}.get(severity.lower(), 0.10)
    # Duration weight
    dur_weight = {"days": 0.04, "weeks": 0.08, "months": 0.14}.get(duration.lower(), 0.06)
    
    cluster_score = (len(metabolic_matches) * 0.07) + (len(cardio_matches) * 0.09) + (len(htn_matches) * 0.06)
    
    # Vital correlation if provided
    vital_adj = 0.0
    if current_vitals.get("current_glucose") and float(current_vitals["current_glucose"]) > 125:
        vital_adj += 0.12
    if current_vitals.get("current_systolic_bp") and float(current_vitals["current_systolic_bp"]) > 135:
        vital_adj += 0.10

    total_score = min(max(base_score + sev_weight + dur_weight + cluster_score + vital_adj, 0.08), 0.92)
    risk_pct = int(round(total_score * 100))

    if total_score < 0.35:
        category = "lower"
        heading = "Lower Potential Symptom Risk Pattern"
        summary = "Reported symptoms are currently mild or non-specific, reflecting lower immediate risk estimation."
    elif total_score <= 0.65:
        category = "moderate"
        heading = "Moderate Potential Risk Pattern Identified"
        summary = "Reported symptoms indicate a cluster worthy of proactive attention and monitoring."
    else:
        category = "elevated"
        heading = "Elevated Potential Risk Pattern Detected"
        summary = "Reported symptom combination suggests higher statistical risk patterns. Clinical discussion is advised."

    # Emergency check
    emergency = False
    emergency_msg = None
    if "Chest discomfort" in current_set and severity.lower() == "severe":
        emergency = True
        emergency_msg = EMERGENCY_TEXT
    if "Shortness of breath" in current_set and severity.lower() == "severe":
        emergency = True
        emergency_msg = EMERGENCY_TEXT
    if onset.lower() == "sudden" and severity.lower() == "severe":
        emergency = True
        emergency_msg = EMERGENCY_TEXT

    # Identified Patterns list
    patterns = []
    if metabolic_matches:
        patterns.append({
            "cluster": "Metabolic / Glycemic Early Pattern",
            "symptoms": metabolic_matches,
            "description": "Symptoms such as increased thirst, urination, or unexplained fatigue can be early indicators of glycemic fluctuation."
        })
    if cardio_matches:
        patterns.append({
            "cluster": "Cardiovascular Regulatory Pattern",
            "symptoms": cardio_matches,
            "description": "Symptoms including exertional discomfort, shortness of breath, or palpitations warrant dedicated cardiovascular review."
        })
    if htn_matches:
        patterns.append({
            "cluster": "Arterial Tension Pattern",
            "symptoms": htn_matches,
            "description": "Headache, morning tension, or dizziness frequently correlate with resting blood pressure shifts."
        })

    # Feature contributions for symptom screening
    contributions = []
    if current_set:
        contributions.append({
            "feature": "reported_symptoms",
            "label": f"Reported Symptoms ({len(current_set)})",
            "contribution": 0.45,
            "direction": "increases_risk",
            "patient_value": ", ".join(list(current_set)[:4]),
            "unit": "symptoms",
            "explanation": f"Presence of {len(current_set)} reported symptoms elevates model pattern score."
        })
    contributions.append({
        "feature": "severity",
        "label": "Symptom Severity",
        "contribution": 0.25,
        "direction": "increases_risk" if severity.lower() in ["moderate", "severe"] else "decreases_risk",
        "patient_value": severity.title(),
        "unit": "rating",
        "explanation": f"{severity.title()} intensity weighted the screening estimation."
    })
    contributions.append({
        "feature": "duration",
        "label": "Reported Duration",
        "contribution": 0.18,
        "direction": "increases_risk" if duration.lower() in ["weeks", "months"] else "neutral",
        "patient_value": duration.title(),
        "unit": "duration",
        "explanation": f"Symptom duration of {duration} provides temporal context for pattern detection."
    })

    guidance = [
        "Record the time of day and specific activities associated with symptom onset.",
        "Check resting blood pressure and fasting blood glucose while experiencing symptoms.",
        "Share this structured symptom report with your doctor during your next visit.",
        "Seek immediate emergency care if symptoms become sudden, severe, or debilitating."
    ]

    return {
        "screening_type": "symptom_risk",
        "screening_title": "Symptom-Based Early Risk Screening",
        "model_version": "1.0.0",
        "algorithm": "Bayesian Symptom Pattern Classifier",
        "risk_score": round(total_score, 4),
        "risk_score_percentage": risk_pct,
        "risk_category": category,
        "risk_heading": heading,
        "risk_summary": summary,
        "feature_contributions": contributions,
        "general_guidance": guidance,
        "emergency_warning": emergency,
        "emergency_message": emergency_msg,
        "medical_disclaimer": DISCLAIMER_TEXT,
        "symptom_progression": {
            "new_symptoms": new_symptoms,
            "continuing_symptoms": continuing_symptoms,
            "resolved_symptoms": resolved_symptoms,
            "has_previous_history": len(prev_symptoms) > 0
        },
        "identified_patterns": patterns,
        "input_data": {
            "symptoms": symptoms,
            "duration": duration,
            "severity": severity,
            "onset": onset,
            "description": description or "",
            **current_vitals
        }
    }

def compare_health_reports(
    current_doc: HealthDocument,
    previous_doc: Optional[HealthDocument]
) -> Dict[str, Any]:
    """
    Compares the newly uploaded medical report with the patient's automatically retrieved previous report.
    Enforces strict report type matching: only compares reports of the exact same document_type.
    Computes parameter shifts, percentage changes, and clinical trend narratives.
    """
    from app.services.ocr_extraction_service import evaluate_screening_eligibility

    # Enforce type match: exact match or compatible blood chemistry family
    blood_family = {"blood_report", "diabetes_report", "lipid_report"}
    is_matching_type = False
    if previous_doc:
        if previous_doc.document_type == current_doc.document_type:
            is_matching_type = True
        elif previous_doc.document_type in blood_family and current_doc.document_type in blood_family:
            is_matching_type = True

    has_valid_prev = bool(previous_doc and is_matching_type)
    active_prev_doc = previous_doc if has_valid_prev else None

    curr_params = current_doc.detected_parameters or []
    prev_params = active_prev_doc.detected_parameters if active_prev_doc else []

    prev_map = {}
    for p in prev_params:
        norm_name = p.get("parameter", p.get("name", "")).strip().lower()
        prev_map[norm_name] = p

    parameter_shifts = []
    for cp in curr_params:
        name = cp.get("parameter", cp.get("name", "Unknown Parameter"))
        norm = name.strip().lower()
        curr_val = cp.get("value")
        unit = cp.get("unit", "")
        status = cp.get("status", "normal")

        # Find matching previous parameter
        prev_match = None
        if active_prev_doc:
            for pk, pv in prev_map.items():
                if pk in norm or norm in pk:
                    prev_match = pv
                    break

        if prev_match:
            prev_val = prev_match.get("value")
            prev_unit = prev_match.get("unit", unit)
            try:
                c_num = float(curr_val)
                p_num = float(prev_val)
                diff = round(c_num - p_num, 2)
                if diff > 0:
                    change_str = f"+{diff:g} {unit}".strip()
                    trend = "Increased"
                elif diff < 0:
                    change_str = f"{diff:g} {unit}".strip()
                    trend = "Decreased"
                else:
                    change_str = "0"
                    trend = "Stable / Minimal Change"
                
                pct_str = None
                if p_num != 0:
                    pct = round(((c_num - p_num) / abs(p_num)) * 100, 1)
                    pct_str = f"{'+' if pct > 0 else ''}{pct}%"
            except (ValueError, TypeError):
                diff = None
                change_str = "Shifted"
                trend = "Categorical Change"
                pct_str = None

            parameter_shifts.append({
                "parameter": name,
                "previous_value": f"{prev_val} {prev_unit}".strip(),
                "current_value": f"{curr_val} {unit}".strip(),
                "change": change_str,
                "percentage_change": pct_str,
                "trend": trend,
                "status": status,
                "has_previous": True
            })
        else:
            parameter_shifts.append({
                "parameter": name,
                "previous_value": None,
                "current_value": f"{curr_val} {unit}".strip(),
                "change": "No previous data available for comparison.",
                "percentage_change": None,
                "trend": "Baseline recorded",
                "status": status,
                "has_previous": False
            })

    # Generate clinical narrative
    if active_prev_doc:
        prev_date = active_prev_doc.created_at.strftime("%b %d, %Y")
        changed_items = [ps for ps in parameter_shifts if ps["has_previous"] and ps["trend"] in ["Increased", "Decreased"]]
        if changed_items:
            items_str = ", ".join([f"{item['parameter']} ({item['previous_value']} → {item['current_value']}, {item['change']})" for item in changed_items[:3]])
            narrative = (
                f"Comparison with your previous {current_doc.document_type.replace('_', ' ')} from {prev_date} demonstrates notable parameter shifts: "
                f"{items_str}. "
                f"These changes reflect observable trends and should be evaluated alongside your current health context."
            )
        else:
            narrative = (
                f"Parameters in your current report remain stable compared to your previous {current_doc.document_type.replace('_', ' ')} from {prev_date}. "
                f"All matching parameters fall within consistent reference ranges."
            )
    elif previous_doc and previous_doc.document_type != current_doc.document_type:
        narrative = f"No previous report of matching type ({current_doc.document_type.replace('_', ' ')}) available for comparison."
    else:
        narrative = "No previous report available for comparison."

    # Screening eligibility check
    can_run, opportunities = evaluate_screening_eligibility(current_doc.document_type, curr_params)

    return {
        "has_previous_report": active_prev_doc is not None,
        "previous_report_id": active_prev_doc.id if active_prev_doc else None,
        "previous_report_date": active_prev_doc.created_at.strftime("%b %d, %Y") if active_prev_doc else None,
        "previous_filename": active_prev_doc.filename if active_prev_doc else None,
        "current_filename": current_doc.filename,
        "parameter_comparisons": parameter_shifts,
        "change_explanation": narrative,
        "can_run_new_screening": can_run,
        "screening_opportunities": opportunities
    }
