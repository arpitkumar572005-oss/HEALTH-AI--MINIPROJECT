"""
Screening API Endpoints
Execute AI disease risk screenings, symptom-based early risk screenings,
automatically retrieve previous patient data, compute current vs previous comparisons,
and query longitudinal screening history.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import User, Screening, HealthMeasurement, AuditLog
from app.schemas.screening import (
    DiabetesScreeningInput,
    CardioScreeningInput,
    HypertensionScreeningInput,
    KidneyScreeningInput,
    SymptomScreeningInput,
    ScreeningResultResponse,
    ScreeningHistoryItem,
)
from app.services.auth_service import get_current_user
from app.ml.inference_service import (
    run_diabetes_screening,
    run_cardiovascular_screening,
    run_hypertension_screening,
    run_kidney_screening,
    registry
)
from app.services.comparison_service import (
    build_screening_historical_comparison,
    run_symptom_early_risk_analysis
)
from app.services.patient_history_service import get_screening_history as fetch_screening_history

import logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/screening", tags=["Health Risk Screening"])

TITLE_MAP = {
    "diabetes": "Diabetes Risk Screening",
    "cardiovascular": "Cardiovascular Risk Screening",
    "hypertension": "Hypertension Risk Screening",
    "kidney": "Chronic Kidney Disease Risk Screening",
    "symptom_risk": "Symptom-Based Early Risk Screening",
    "symptoms": "Symptom-Based Early Risk Screening"
}

def persist_screening_result(
    result_dict: dict,
    user_id: str,
    is_demo: bool,
    db: Session,
    symptom_data: Optional[dict] = None
) -> Screening:
    screening = Screening(
        user_id=user_id,
        screening_type=result_dict["screening_type"],
        model_version=result_dict["model_version"],
        algorithm_name=result_dict["algorithm"],
        risk_score=result_dict["risk_score"],
        risk_category=result_dict["risk_category"],
        risk_summary=result_dict["risk_summary"],
        input_data=result_dict["input_data"],
        feature_contributions=result_dict["feature_contributions"],
        general_guidance=result_dict["general_guidance"],
        historical_comparison=result_dict.get("historical_comparison"),
        symptom_data=symptom_data,
        emergency_warning=result_dict["emergency_warning"],
        is_demo=is_demo
    )
    db.add(screening)
    
    # Also save primary health measurements into user's health records
    input_data = result_dict["input_data"]
    if "fasting_glucose" in input_data and input_data["fasting_glucose"]:
        db.add(HealthMeasurement(
            user_id=user_id,
            measurement_type="blood_glucose",
            value=float(input_data["fasting_glucose"]),
            unit="mg/dL",
            notes=f"Logged from {result_dict['screening_title']}",
            source="screening",
            is_demo=is_demo
        ))
    if "systolic_bp" in input_data and input_data["systolic_bp"]:
        db.add(HealthMeasurement(
            user_id=user_id,
            measurement_type="systolic_bp",
            value=float(input_data["systolic_bp"]),
            unit="mmHg",
            notes=f"Logged from {result_dict['screening_title']}",
            source="screening",
            is_demo=is_demo
        ))
    if "diastolic_bp" in input_data and input_data["diastolic_bp"]:
        db.add(HealthMeasurement(
            user_id=user_id,
            measurement_type="diastolic_bp",
            value=float(input_data["diastolic_bp"]),
            unit="mmHg",
            notes=f"Logged from {result_dict['screening_title']}",
            source="screening",
            is_demo=is_demo
        ))
    if "cholesterol" in input_data and input_data["cholesterol"]:
        db.add(HealthMeasurement(
            user_id=user_id,
            measurement_type="cholesterol",
            value=float(input_data["cholesterol"]),
            unit="mg/dL",
            notes=f"Logged from {result_dict['screening_title']}",
            source="screening",
            is_demo=is_demo
        ))
    if "heart_rate" in input_data and input_data["heart_rate"]:
        db.add(HealthMeasurement(
            user_id=user_id,
            measurement_type="heart_rate",
            value=float(input_data["heart_rate"]),
            unit="bpm",
            notes=f"Logged from {result_dict['screening_title']}",
            source="screening",
            is_demo=is_demo
        ))
    if "weight_kg" in input_data and input_data["weight_kg"]:
        db.add(HealthMeasurement(
            user_id=user_id,
            measurement_type="weight",
            value=float(input_data["weight_kg"]),
            unit="kg",
            notes=f"Logged from {result_dict['screening_title']}",
            source="screening",
            is_demo=is_demo
        ))
    if "bmi" in input_data and input_data["bmi"]:
        db.add(HealthMeasurement(
            user_id=user_id,
            measurement_type="bmi",
            value=float(input_data["bmi"]),
            unit="kg/m²",
            notes=f"Logged from {result_dict['screening_title']}",
            source="screening",
            is_demo=is_demo
        ))
    if "height_cm" in input_data and input_data["height_cm"]:
        db.add(HealthMeasurement(
            user_id=user_id,
            measurement_type="height",
            value=float(input_data["height_cm"]),
            unit="cm",
            notes=f"Logged from {result_dict['screening_title']}",
            source="screening",
            is_demo=is_demo
        ))
    if "serum_creatinine" in input_data and input_data["serum_creatinine"]:
        db.add(HealthMeasurement(
            user_id=user_id,
            measurement_type="serum_creatinine",
            value=float(input_data["serum_creatinine"]),
            unit="mg/dL",
            notes=f"Logged from {result_dict['screening_title']}",
            source="screening",
            is_demo=is_demo
        ))
    if "blood_urea" in input_data and input_data["blood_urea"]:
        db.add(HealthMeasurement(
            user_id=user_id,
            measurement_type="blood_urea",
            value=float(input_data["blood_urea"]),
            unit="mg/dL",
            notes=f"Logged from {result_dict['screening_title']}",
            source="screening",
            is_demo=is_demo
        ))
    if "hemoglobin" in input_data and input_data["hemoglobin"]:
        db.add(HealthMeasurement(
            user_id=user_id,
            measurement_type="hemoglobin",
            value=float(input_data["hemoglobin"]),
            unit="g/dL",
            notes=f"Logged from {result_dict['screening_title']}",
            source="screening",
            is_demo=is_demo
        ))
        
    db.commit()
    db.refresh(screening)
    return screening

@router.post("/diabetes", response_model=ScreeningResultResponse)
def screen_diabetes(
    data: DiabetesScreeningInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # 1. Run ML inference on current data
        inputs = data.model_dump()
        result = run_diabetes_screening(inputs)

        # 2. Automatically retrieve previous data and compute current vs previous comparison
        comparison = build_screening_historical_comparison(
            current_inputs=inputs,
            new_risk_score=result["risk_score"],
            new_risk_category=result["risk_category"],
            screening_type="diabetes",
            user_id=current_user.id,
            db=db
        )
        result["historical_comparison"] = comparison

        # 3. Persist new record as newest entry in patient history
        record = persist_screening_result(result, current_user.id, current_user.is_demo, db)
        result["id"] = record.id
        result["created_at"] = record.created_at.isoformat()
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing diabetes screening: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred while calculating your AI diabetes risk screening. Please verify your inputs and try again."
        )

@router.post("/cardiovascular", response_model=ScreeningResultResponse)
def screen_cardiovascular(
    data: CardioScreeningInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # 1. Run ML inference on current data
        inputs = data.model_dump()
        result = run_cardiovascular_screening(inputs)

        # 2. Automatically retrieve previous data and compute current vs previous comparison
        comparison = build_screening_historical_comparison(
            current_inputs=inputs,
            new_risk_score=result["risk_score"],
            new_risk_category=result["risk_category"],
            screening_type="cardiovascular",
            user_id=current_user.id,
            db=db
        )
        result["historical_comparison"] = comparison

        # 3. Persist new record as newest entry in patient history
        record = persist_screening_result(result, current_user.id, current_user.is_demo, db)
        result["id"] = record.id
        result["created_at"] = record.created_at.isoformat()
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing cardiovascular screening: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred while calculating your AI cardiovascular risk screening. Please verify your inputs and try again."
        )

@router.post("/hypertension", response_model=ScreeningResultResponse)
def screen_hypertension(
    data: HypertensionScreeningInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # 1. Run ML inference on current data
        inputs = data.model_dump()
        result = run_hypertension_screening(inputs)

        # 2. Automatically retrieve previous data and compute current vs previous comparison
        comparison = build_screening_historical_comparison(
            current_inputs=inputs,
            new_risk_score=result["risk_score"],
            new_risk_category=result["risk_category"],
            screening_type="hypertension",
            user_id=current_user.id,
            db=db
        )
        result["historical_comparison"] = comparison

        # 3. Persist new record as newest entry in patient history
        record = persist_screening_result(result, current_user.id, current_user.is_demo, db)
        result["id"] = record.id
        result["created_at"] = record.created_at.isoformat()
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing hypertension screening: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred while calculating your AI hypertension risk screening. Please verify your inputs and try again."
        )

@router.post("/kidney", response_model=ScreeningResultResponse)
def screen_kidney(
    data: KidneyScreeningInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # 1. Run ML inference on current data
        inputs = data.model_dump()
        result = run_kidney_screening(inputs)

        # 2. Automatically retrieve previous data and compute current vs previous comparison
        comparison = build_screening_historical_comparison(
            current_inputs=inputs,
            new_risk_score=result["risk_score"],
            new_risk_category=result["risk_category"],
            screening_type="kidney",
            user_id=current_user.id,
            db=db
        )
        result["historical_comparison"] = comparison

        # 3. Persist new record as newest entry in patient history
        record = persist_screening_result(result, current_user.id, current_user.is_demo, db)
        result["id"] = record.id
        result["created_at"] = record.created_at.isoformat()
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing kidney screening: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred while calculating your AI chronic kidney disease risk screening. Please verify your inputs and try again."
        )

@router.post("/symptoms", response_model=ScreeningResultResponse)
def screen_symptoms(
    data: SymptomScreeningInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Symptom-Based Early Risk Screening.
    Patient enters ONLY current symptoms, duration, severity, and optional vitals.
    HealthAI automatically retrieves previous symptoms, previous measurements, and previous screenings.
    """
    current_vitals = {}
    if data.current_glucose:
        current_vitals["fasting_glucose"] = data.current_glucose
    if data.current_systolic_bp:
        current_vitals["systolic_bp"] = data.current_systolic_bp
    if data.current_diastolic_bp:
        current_vitals["diastolic_bp"] = data.current_diastolic_bp
    if data.current_heart_rate:
        current_vitals["heart_rate"] = data.current_heart_rate
    if data.current_weight_kg:
        current_vitals["weight_kg"] = data.current_weight_kg

    result = run_symptom_early_risk_analysis(
        symptoms=data.symptoms,
        duration=data.duration,
        severity=data.severity,
        onset=data.onset,
        description=data.description,
        current_vitals=current_vitals,
        user_id=current_user.id,
        db=db
    )

    # Historical risk and biomarker comparison
    comparison = build_screening_historical_comparison(
        current_inputs={"symptoms": data.symptoms, **current_vitals},
        new_risk_score=result["risk_score"],
        new_risk_category=result["risk_category"],
        screening_type="symptom_risk",
        user_id=current_user.id,
        db=db
    )
    result["historical_comparison"] = comparison

    # Persist screening record
    record = persist_screening_result(
        result,
        current_user.id,
        current_user.is_demo,
        db,
        symptom_data=result.get("symptom_progression")
    )
    result["id"] = record.id
    result["created_at"] = record.created_at.isoformat()
    return result

@router.get("/history", response_model=List[ScreeningHistoryItem])
def get_screening_history(
    disease_type: Optional[str] = Query(None, description="'all', 'diabetes', 'cardiovascular', 'hypertension', or 'symptom_risk'"),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return fetch_screening_history(current_user.id, db, screening_type=disease_type, search=search)


@router.delete("/{screening_id}")
def delete_screening_record(
    screening_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Screening).filter(Screening.id == screening_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Screening record not found.")
    if record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this record.")
    
    db.delete(record)
    db.commit()
    return {"message": "Screening record deleted successfully.", "id": screening_id}

@router.get("/details/{screening_id}", response_model=ScreeningResultResponse)
def get_screening_detail(
    screening_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Screening).filter(Screening.id == screening_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Screening record not found")
        
    if record.user_id != current_user.id and current_user.role not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    title = TITLE_MAP.get(record.screening_type, f"{record.screening_type.title()} Screening")
    
    # If historical_comparison was not stored at write time (e.g. legacy seed), compute it dynamically
    hist_comp = record.historical_comparison
    if not hist_comp:
        hist_comp = build_screening_historical_comparison(
            current_inputs=record.input_data or {},
            new_risk_score=record.risk_score,
            new_risk_category=record.risk_category,
            screening_type=record.screening_type,
            user_id=record.user_id,
            db=db,
            exclude_id=record.id,
            before_datetime=record.created_at
        )

    return {
        "id": record.id,
        "screening_type": record.screening_type,
        "screening_title": title,
        "model_version": record.model_version,
        "algorithm": record.algorithm_name,
        "risk_score": record.risk_score,
        "risk_score_percentage": int(round(record.risk_score * 100)),
        "risk_category": record.risk_category,
        "risk_heading": f"{record.risk_category.title()} Risk Detected",
        "risk_summary": record.risk_summary,
        "feature_contributions": record.feature_contributions or [],
        "general_guidance": record.general_guidance or [],
        "emergency_warning": record.emergency_warning,
        "emergency_message": (
            "If you are experiencing severe, sudden, or rapidly worsening symptoms, "
            "seek urgent medical attention or contact local emergency services."
        ) if record.emergency_warning else None,
        "medical_disclaimer": (
            "This AI-generated result is intended for screening and educational purposes only "
            "and is not a medical diagnosis. Please consult a qualified healthcare professional "
            "for medical advice, diagnosis, or treatment."
        ),
        "created_at": record.created_at.isoformat(),
        "historical_comparison": hist_comp,
        "symptom_progression": record.symptom_data
    }

@router.get("/compare")
def compare_screenings(
    id1: Optional[str] = Query(None, description="Earlier screening ID"),
    id2: Optional[str] = Query(None, description="Later screening ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Compare two screening results to show progress, risk delta, and biomarker changes.
    """
    s1 = None
    s2 = None
    if id1 and id2:
        s1 = db.query(Screening).filter(Screening.id == id1, Screening.user_id == current_user.id).first()
        s2 = db.query(Screening).filter(Screening.id == id2, Screening.user_id == current_user.id).first()
    else:
        recent = db.query(Screening).filter(Screening.user_id == current_user.id).order_by(Screening.created_at.desc()).limit(2).all()
        if len(recent) >= 2:
            s2 = recent[0]  # Latest
            s1 = recent[1]  # Earlier
        elif len(recent) == 1:
            s2 = recent[0]
            s1 = recent[0]

    if not s1 or not s2:
        raise HTTPException(status_code=404, detail="Screening records for comparison not found.")

    score1_pct = int(round(s1.risk_score * 100))
    score2_pct = int(round(s2.risk_score * 100))
    diff_pct = score2_pct - score1_pct

    in1 = s1.input_data or {}
    in2 = s2.input_data or {}

    shifts = []
    keys_to_compare = [
        ("fasting_glucose", "Fasting Glucose", "mg/dL"),
        ("systolic_bp", "Systolic BP", "mmHg"),
        ("diastolic_bp", "Diastolic BP", "mmHg"),
        ("cholesterol", "Total Cholesterol", "mg/dL"),
        ("weight_kg", "Weight", "kg"),
        ("bmi", "BMI", "kg/m²"),
        ("physical_activity_hours", "Physical Activity", "hrs/wk"),
    ]

    for key, label, unit in keys_to_compare:
        v1 = in1.get(key)
        v2 = in2.get(key)
        if v1 is not None or v2 is not None:
            change_str = "Unchanged"
            try:
                num1 = float(v1) if v1 is not None else None
                num2 = float(v2) if v2 is not None else None
                if num1 is not None and num2 is not None:
                    delta = round(num2 - num1, 1)
                    if delta > 0:
                        change_str = f"+{delta} {unit}"
                    elif delta < 0:
                        change_str = f"{delta} {unit}"
            except Exception:
                pass
            shifts.append({
                "metric": label,
                "earlier_value": f"{v1} {unit}" if v1 is not None else "N/A",
                "latest_value": f"{v2} {unit}" if v2 is not None else "N/A",
                "change": change_str
            })

    if diff_pct < 0:
        trajectory = "improved"
        commentary = (
            f"Your risk estimation improved by {abs(diff_pct)} percentage points, moving from "
            f"{score1_pct}% down to {score2_pct}%. "
            f"Key contributing factors include lower blood glucose and improved lifestyle metrics."
        )
    elif diff_pct > 0:
        trajectory = "increased"
        commentary = (
            f"Your risk estimation elevated by {diff_pct} percentage points, moving from "
            f"{score1_pct}% to {score2_pct}%. "
            f"Consider discussing these changes with your healthcare provider."
        )
    else:
        trajectory = "stable"
        commentary = f"Your risk estimation has remained stable at {score2_pct}% between screenings."

    return {
        "screening1": {
            "id": s1.id,
            "type": s1.screening_type,
            "title": TITLE_MAP.get(s1.screening_type, s1.screening_type.title()),
            "score": s1.risk_score,
            "score_pct": score1_pct,
            "category": s1.risk_category,
            "date": s1.created_at.strftime("%b %d, %Y")
        },
        "screening2": {
            "id": s2.id,
            "type": s2.screening_type,
            "title": TITLE_MAP.get(s2.screening_type, s2.screening_type.title()),
            "score": s2.risk_score,
            "score_pct": score2_pct,
            "category": s2.risk_category,
            "date": s2.created_at.strftime("%b %d, %Y")
        },
        "score_diff_pct": diff_pct,
        "trajectory": trajectory,
        "commentary": commentary,
        "factor_shifts": shifts,
        "disclaimer": "This comparison is generated for informational and awareness purposes only and does not constitute a clinical diagnosis."
    }

@router.get("/models/metadata")
def get_models_metadata():
    """Returns active models, metadata, and transparent evaluation metrics."""
    res = {}
    for disease in ["diabetes", "cardiovascular", "kidney", "hypertension"]:
        meta = registry.get_metadata(disease)
        metrics = registry.get_metrics(disease)
        res[disease] = {
            "metadata": meta,
            "metrics": metrics
        }
    return res
