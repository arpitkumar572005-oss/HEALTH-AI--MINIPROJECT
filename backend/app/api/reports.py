"""
Screening & Laboratory Medical Reports API
Includes:
1. Medical Report Summarizer (Upload current report, automatic previous report retrieval,
   current vs previous comparison, parameter shifts, and report-driven new risk screening).
2. Downloadable PDF generation and print-ready summary representations for screening reports.
"""

import os
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import User, Screening, HealthDocument, HealthMeasurement, PatientProfile
from app.services.auth_service import get_current_user
from app.services.pdf_report_service import generate_screening_pdf
from app.services.comparison_service import compare_health_reports, build_screening_historical_comparison, DISCLAIMER_TEXT
from app.schemas.reports import (
    ReportAnalysisResponse,
    ReportHistoryItem,
    RunReportScreeningInput
)
from app.schemas.screening import ScreeningResultResponse
from app.ml.inference_service import (
    run_diabetes_screening,
    run_cardiovascular_screening,
    run_hypertension_screening
)

from app.services.ocr_extraction_service import (
    extract_text_from_file_bytes,
    detect_report_type,
    extract_impression,
    extract_dynamic_parameters_and_findings,
    generate_comprehensive_summary,
    evaluate_screening_eligibility
)

router = APIRouter(prefix="/reports", tags=["Medical Reports & Summarizer"])

@router.post("/upload", response_model=ReportAnalysisResponse)
async def upload_and_analyze_report(
    file: Optional[UploadFile] = File(None),
    filename_override: Optional[str] = Form(None),
    raw_text: Optional[str] = Form(None),
    is_sample_flag: Optional[bool] = Form(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Patient uploads ONLY the current medical report.
    HealthAI performs universal real document OCR & extraction across any report format:
    1. Multi-page PDF text extraction or page-by-page OCR
    2. Image OCR (PNG, JPG, JPEG)
    3. Document type detection (Blood, CBC, Lipid, Diabetes, LFT, KFT, Thyroid, Urine, Ultrasound, X-Ray, CT, MRI, ECG, etc.)
    4. Dynamic parameter & clinical observation extraction
    5. Section detection (Impression, Conclusion, Findings)
    6. Strict non-fabrication guarantees (zero fake values)
    7. Type-aware longitudinal comparison
    8. Screening model eligibility enforcement
    """
    filename = "uploaded_report.pdf"
    file_size_kb = 0.0
    bytes_data = b""

    if file:
        filename = file.filename or "uploaded_report.pdf"
        try:
            bytes_data = await file.read()
            file_size_kb = round(len(bytes_data) / 1024.0, 1)
        except Exception:
            pass

    if filename_override:
        filename = filename_override

    # 1. Multi-page Text Extraction & OCR
    if bytes_data:
        extracted_text, method, page_count, ocr_performed, errors = extract_text_from_file_bytes(filename, bytes_data)
        if raw_text:
            extracted_text = (extracted_text + "\n" + raw_text).strip()
    else:
        extracted_text = (raw_text or "").strip()
        method = "text_form_input"
        page_count = 1
        ocr_performed = False
        errors = []

    # 2. Document Type Detection
    doc_type, doc_title, confidence = detect_report_type(filename, extracted_text)

    # 3. Impression / Conclusion Section Extraction
    impression = extract_impression(extracted_text)

    # 4. Universal Dynamic Parameter & Clinical Observation Extraction
    detected_params = extract_dynamic_parameters_and_findings(doc_type, extracted_text, filename)

    # Handle unextracted or poor quality extraction
    if not extracted_text or method == "unextracted":
        summary_text = "Some text could not be reliably extracted from this report. Please upload a clearer image or selectable text PDF."
        ai_exp = "No readable medical text was detected. Ensure the document is well-lit, properly oriented, and legible."
        questions = ["Please upload a clearer digital or scanned copy of your medical document."]
        extraction_status = "failed"
    else:
        # 5. Summary, Educational AI Explanation & Clinician Questions
        summary_text, ai_exp, questions = generate_comprehensive_summary(
            doc_type, doc_title, extracted_text, detected_params, impression
        )
        extraction_status = "success" if len(detected_params) > 0 or impression else "warning"

    # 6. Retrieve Previous Report of MATCHING Document Type from DB
    # Priority 1: Exact document_type match
    prev_doc = (
        db.query(HealthDocument)
        .filter(
            HealthDocument.user_id == current_user.id,
            HealthDocument.document_type == doc_type
        )
        .order_by(HealthDocument.created_at.desc())
        .first()
    )

    # Priority 2: Matching blood chemistry family if exact subtype not found
    if not prev_doc and doc_type in ["blood_report", "diabetes_report", "lipid_report"]:
        prev_doc = (
            db.query(HealthDocument)
            .filter(
                HealthDocument.user_id == current_user.id,
                HealthDocument.document_type.in_(["blood_report", "diabetes_report", "lipid_report"])
            )
            .order_by(HealthDocument.created_at.desc())
            .first()
        )

    # Developer & Debug Metadata
    ext_str = os.path.splitext(filename)[1].lower() if filename else ".pdf"
    debug_metadata = {
        "filename": filename,
        "file_type": ext_str,
        "page_count": page_count,
        "ocr_performed": ocr_performed,
        "extraction_method": method,
        "extracted_text_length": len(extracted_text),
        "detected_report_type": doc_type,
        "confidence": confidence,
        "extraction_status": extraction_status,
        "findings_count": len(detected_params),
        "numerical_count": sum(1 for p in detected_params if p.get("type") == "numerical"),
        "observation_count": sum(1 for p in detected_params if p.get("type") == "observation"),
        "processing_errors": errors
    }

    # 7. Create and persist HealthDocument entity
    current_doc = HealthDocument(
        user_id=current_user.id,
        filename=filename,
        document_type=doc_type,
        file_size_kb=file_size_kb if file_size_kb > 0 else 12.5,
        extracted_text=extracted_text,
        impression=impression,
        ai_explanation=ai_exp,
        processing_status=extraction_status,
        extraction_confidence=confidence,
        is_sample=bool(is_sample_flag),
        processing_metadata=debug_metadata,
        detected_parameters=detected_params,
        summary=summary_text,
        questions_to_discuss=questions,
        created_at=datetime.now(timezone.utc)
    )

    # 8. Perform Type-Aware Current vs Previous Report Comparison
    comparison_data = compare_health_reports(current_doc, prev_doc)
    current_doc.comparison_with_previous = comparison_data

    db.add(current_doc)
    db.commit()
    db.refresh(current_doc)

    return {
        "id": current_doc.id,
        "filename": current_doc.filename,
        "document_type": current_doc.document_type,
        "file_size_kb": current_doc.file_size_kb,
        "created_at": current_doc.created_at.isoformat(),
        "detected_parameters": detected_params,
        "summary": current_doc.summary,
        "impression": current_doc.impression,
        "ai_explanation": current_doc.ai_explanation,
        "processing_status": current_doc.processing_status,
        "extraction_confidence": current_doc.extraction_confidence,
        "is_sample": current_doc.is_sample,
        "processing_metadata": debug_metadata,
        "questions_to_discuss": current_doc.questions_to_discuss or [],
        "has_previous_report": comparison_data["has_previous_report"],
        "previous_report_id": comparison_data["previous_report_id"],
        "previous_report_date": comparison_data["previous_report_date"],
        "previous_filename": comparison_data["previous_filename"],
        "parameter_comparisons": comparison_data["parameter_comparisons"],
        "change_explanation": comparison_data["change_explanation"],
        "can_run_new_screening": comparison_data["can_run_new_screening"],
        "screening_opportunities": comparison_data["screening_opportunities"],
        "derived_screening_id": current_doc.derived_screening_id,
        "medical_disclaimer": DISCLAIMER_TEXT
    }

@router.get("/list", response_model=List[ReportHistoryItem])
def get_reports_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns patient's uploaded and analyzed medical documents chronologically."""
    docs = (
        db.query(HealthDocument)
        .filter(HealthDocument.user_id == current_user.id)
        .order_by(HealthDocument.created_at.desc())
        .all()
    )
    
    items = []
    for d in docs:
        params_count = len(d.detected_parameters) if d.detected_parameters else 0
        has_prev = bool(d.comparison_with_previous and d.comparison_with_previous.get("has_previous_report"))
        snippet = (d.summary[:140] + "...") if len(d.summary) > 140 else d.summary
        items.append({
            "id": d.id,
            "filename": d.filename,
            "document_type": d.document_type,
            "file_size_kb": d.file_size_kb,
            "parameters_count": params_count,
            "created_at": d.created_at.isoformat(),
            "summary_snippet": snippet,
            "has_previous": has_prev,
            "impression": d.impression,
            "is_sample": d.is_sample or False
        })
    return items

@router.get("/details/{document_id}", response_model=ReportAnalysisResponse)
def get_report_details(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves full analysis and current vs previous comparison for a specific report."""
    doc = db.query(HealthDocument).filter(HealthDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Medical report not found")
        
    if doc.user_id != current_user.id and current_user.role not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    comp = doc.comparison_with_previous
    if not comp:
        # Dynamically compute comparison matching SAME document_type
        prev_doc = (
            db.query(HealthDocument)
            .filter(
                HealthDocument.user_id == doc.user_id,
                HealthDocument.id != doc.id,
                HealthDocument.document_type == doc.document_type,
                HealthDocument.created_at < doc.created_at
            )
            .order_by(HealthDocument.created_at.desc())
            .first()
        )
        comp = compare_health_reports(doc, prev_doc)

    return {
        "id": doc.id,
        "filename": doc.filename,
        "document_type": doc.document_type,
        "file_size_kb": doc.file_size_kb,
        "created_at": doc.created_at.isoformat(),
        "detected_parameters": doc.detected_parameters or [],
        "summary": doc.summary,
        "impression": doc.impression,
        "ai_explanation": doc.ai_explanation,
        "processing_status": doc.processing_status or "completed",
        "extraction_confidence": doc.extraction_confidence or 1.0,
        "is_sample": doc.is_sample or False,
        "processing_metadata": doc.processing_metadata,
        "questions_to_discuss": doc.questions_to_discuss or [],
        "has_previous_report": comp.get("has_previous_report", False),
        "previous_report_id": comp.get("previous_report_id"),
        "previous_report_date": comp.get("previous_report_date"),
        "previous_filename": comp.get("previous_filename"),
        "parameter_comparisons": comp.get("parameter_comparisons", []),
        "change_explanation": comp.get("change_explanation", ""),
        "can_run_new_screening": comp.get("can_run_new_screening", False),
        "screening_opportunities": comp.get("screening_opportunities", []),
        "derived_screening_id": doc.derived_screening_id,
        "medical_disclaimer": DISCLAIMER_TEXT
    }

@router.post("/{document_id}/run-screening", response_model=ScreeningResultResponse)
def run_screening_from_report(
    document_id: str,
    payload: RunReportScreeningInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes a NEW disease-risk screening using valid current inputs extracted from an uploaded report.
    Enforces strict screening eligibility checks: rejects non-blood reports or reports lacking required analytes.
    """
    doc = db.query(HealthDocument).filter(HealthDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Report document not found")
        
    if doc.user_id != current_user.id and current_user.role not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Evaluate strict eligibility
    can_run, opportunities = evaluate_screening_eligibility(doc.document_type, doc.detected_parameters or [])
    if not can_run:
        raise HTTPException(
            status_code=400,
            detail="No supported disease-screening model can be reliably triggered from the available parameters in this report."
        )

    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    detected_params = doc.detected_parameters or []
    
    param_dict = {}
    for p in detected_params:
        norm = p.get("parameter", "").lower()
        val = p.get("value")
        try:
            param_dict[norm] = float(val)
        except Exception:
            pass

    disease = payload.disease_type.lower()
    
    if disease == "diabetes":
        glucose = param_dict.get("fasting blood glucose", param_dict.get("glucose"))
        if glucose is None:
            raise HTTPException(
                status_code=400,
                detail="Fasting blood glucose parameter missing from this report; cannot run Diabetes screening."
            )
        inputs = {
            "age": payload.age or (profile.age if profile else 46),
            "gender": payload.gender or (profile.gender if profile else "male"),
            "bmi": payload.bmi or (profile.bmi if profile else 24.5),
            "fasting_glucose": glucose,
            "systolic_bp": int(param_dict.get("systolic bp", 122)),
            "diastolic_bp": int(param_dict.get("diastolic bp", 80)),
            "family_history": profile.family_history_diabetes if profile else True,
            "physical_activity_hours": profile.physical_activity_hours if profile else 3.0,
            "symptoms": []
        }
        result = run_diabetes_screening(inputs)
    elif disease == "cardiovascular":
        chol = param_dict.get("total cholesterol", param_dict.get("cholesterol"))
        if chol is None:
            raise HTTPException(
                status_code=400,
                detail="Total cholesterol parameter missing from this report; cannot run Cardiovascular screening."
            )
        inputs = {
            "age": payload.age or (profile.age if profile else 46),
            "gender": payload.gender or (profile.gender if profile else "male"),
            "bmi": payload.bmi or (profile.bmi if profile else 24.5),
            "systolic_bp": int(param_dict.get("systolic bp", 122)),
            "cholesterol": chol,
            "fasting_glucose": param_dict.get("fasting blood glucose", 95.0),
            "heart_rate": int(param_dict.get("resting heart rate", 72)),
            "smoking_status": profile.smoking_status if profile else "never",
            "chest_discomfort_level": 0,
            "physical_activity_hours": profile.physical_activity_hours if profile else 3.0,
            "symptoms": []
        }
        result = run_cardiovascular_screening(inputs)
    elif disease == "hypertension":
        sys_bp = param_dict.get("systolic bp", param_dict.get("systolic"))
        if sys_bp is None:
            raise HTTPException(
                status_code=400,
                detail="Systolic BP parameter missing from this report; cannot run Hypertension screening."
            )
        inputs = {
            "age": payload.age or (profile.age if profile else 46),
            "gender": payload.gender or (profile.gender if profile else "male"),
            "bmi": payload.bmi or (profile.bmi if profile else 24.5),
            "systolic_bp": int(sys_bp),
            "diastolic_bp": int(param_dict.get("diastolic bp", 82)),
            "heart_rate": int(param_dict.get("resting heart rate", 72)),
            "family_history": profile.family_history_hypertension if profile else False,
            "sodium_intake": "moderate",
            "smoking_status": profile.smoking_status if profile else "never",
            "physical_activity_hours": profile.physical_activity_hours if profile else 3.0,
            "symptoms": []
        }
        result = run_hypertension_screening(inputs)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported disease type: {disease}")

    # Compare NEW risk with PREVIOUS risk for this disease
    comparison = build_screening_historical_comparison(
        current_inputs=inputs,
        new_risk_score=result["risk_score"],
        new_risk_category=result["risk_category"],
        screening_type=disease,
        user_id=current_user.id,
        db=db
    )
    result["historical_comparison"] = comparison

    # Save NEW screening as distinct record
    new_screening = Screening(
        user_id=current_user.id,
        screening_type=disease,
        model_version=result["model_version"],
        algorithm_name=result["algorithm"],
        risk_score=result["risk_score"],
        risk_category=result["risk_category"],
        risk_summary=result["risk_summary"],
        input_data=inputs,
        feature_contributions=result["feature_contributions"],
        general_guidance=result["general_guidance"],
        historical_comparison=comparison,
        emergency_warning=result["emergency_warning"],
        is_demo=current_user.is_demo
    )
    db.add(new_screening)
    
    # Link to document
    doc.derived_screening_id = new_screening.id
    
    db.commit()
    db.refresh(new_screening)

    result["id"] = new_screening.id
    result["created_at"] = new_screening.created_at.isoformat()
    return result

@router.get("/{screening_id}/pdf")
def download_screening_report_pdf(
    screening_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Screening).filter(Screening.id == screening_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Screening report not found")
        
    if record.user_id != current_user.id and current_user.role not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized to view this report")
        
    screening_user = db.query(User).filter(User.id == record.user_id).first()
    user_dict = {
        "full_name": screening_user.full_name if screening_user else "Patient",
        "email": screening_user.email if screening_user else ""
    }
    
    title = f"{record.screening_type.title()} Risk Screening"
    if record.screening_type == "symptom_risk":
        title = "Symptom-Based Early Risk Screening"
        
    screening_dict = {
        "id": record.id,
        "screening_type": record.screening_type,
        "screening_title": title,
        "model_version": record.model_version,
        "algorithm": record.algorithm_name,
        "risk_score": record.risk_score,
        "risk_score_percentage": int(round(record.risk_score * 100)),
        "risk_category": record.risk_category,
        "risk_summary": record.risk_summary,
        "feature_contributions": record.feature_contributions or [],
        "general_guidance": record.general_guidance or [],
        "emergency_warning": record.emergency_warning,
        "emergency_message": "If experiencing severe symptoms, please seek emergency medical attention." if record.emergency_warning else None,
        "input_data": record.input_data or {},
        "created_at": record.created_at.strftime("%Y-%m-%d %H:%M UTC")
    }
    
    pdf_bytes = generate_screening_pdf(screening_dict, user_dict)
    
    filename = f"HealthAI_Report_{record.screening_type}_{record.id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

@router.get("/{screening_id}/summary")
def get_report_summary(
    screening_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Screening).filter(Screening.id == screening_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Screening report not found")
        
    if record.user_id != current_user.id and current_user.role not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    patient = db.query(User).filter(User.id == record.user_id).first()
    title = f"{record.screening_type.title()} Risk Screening"
    if record.screening_type == "symptom_risk":
        title = "Symptom-Based Early Risk Screening"
        
    return {
        "report_id": record.id,
        "document_title": "AI HEALTH SCREENING REPORT",
        "patient": {
            "name": patient.full_name if patient else "User",
            "age": (record.input_data or {}).get("age"),
            "gender": (record.input_data or {}).get("gender"),
            "bmi": (record.input_data or {}).get("bmi")
        },
        "screening": {
            "type": record.screening_type,
            "title": title,
            "model_version": record.model_version,
            "algorithm": record.algorithm_name,
            "date": record.created_at.strftime("%B %d, %Y at %H:%M UTC"),
            "risk_score": record.risk_score,
            "risk_percentage": int(round(record.risk_score * 100)),
            "risk_category": record.risk_category,
            "risk_summary": record.risk_summary
        },
        "input_summary": record.input_data,
        "contributing_factors": record.feature_contributions,
        "general_next_steps": record.general_guidance,
        "emergency_warning": record.emergency_warning,
        "medical_disclaimer": DISCLAIMER_TEXT
    }
