"""
Phase 8 Automated Verification Test Suite
Medical Report Summarizer: Real Document Extraction, Understanding, Classification,
Type-Aware Comparison & ML Screening Eligibility.
"""

import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database.session import Base, get_db
from app.models.entities import User, PatientProfile, HealthDocument, Screening
from app.services.auth_service import create_access_token, hash_password
from app.services.ocr_extraction_service import (
    extract_text_from_file_bytes,
    detect_report_type,
    extract_impression,
    extract_structured_findings,
    evaluate_screening_eligibility
)

client = TestClient(app)

def get_auth_headers():
    test_email = f"phase8_user_{uuid.uuid4().hex[:8]}@healthai.local"
    reg = client.post("/api/auth/register", json={
        "email": test_email,
        "password": "Password123!",
        "full_name": "Phase 8 Test Patient"
    })
    assert reg.status_code == 201, reg.text
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_ocr_extraction_and_report_classification():
    """Test 1: OCR & text classification for ultrasound vs blood reports."""
    sample_usg_text = """
    KIDNEY ULTRASOUND REPORT (USG KUB)
    Patient Name: Alex Test | Age: 48 | Gender: Male
    FINDINGS:
    Right kidney measures 10.4 cm in length. Increased cortical echogenicity. Cortico-medullary differentiation maintained.
    Grade II hydronephrosis observed in right kidney with a 6 mm renal calculus in middle calyx.
    Left kidney measures 10.8 cm. Normal cortical echotexture. No hydronephrosis or stone seen.
    Urinary bladder: Well distended. Post-void residual urine volume: 30 mL.
    IMPRESSION:
    Grade II Right Hydronephrosis secondary to 6 mm right renal calculus. Left kidney sonographically normal.
    """
    
    doc_type, title, conf = detect_report_type("kidney_ultrasound.txt", sample_usg_text)
    assert doc_type == "ultrasound_report"
    assert "Kidney" in title
    assert conf > 0.7

    imp = extract_impression(sample_usg_text)
    assert imp is not None
    assert "Grade II Right Hydronephrosis" in imp

    findings = extract_structured_findings(doc_type, sample_usg_text, "kidney_ultrasound.txt")
    assert len(findings) >= 4
    
    # Check zero fake lab values
    param_names = [f["parameter"].lower() for f in findings]
    assert "fasting blood glucose" not in param_names
    assert "hba1c" not in param_names
    assert "total cholesterol" not in param_names

    # Verify eligibility check
    can_run, opps = evaluate_screening_eligibility(doc_type, findings)
    assert can_run is False
    assert len(opps) == 0

def test_ultrasound_report_upload_api():
    """Test 2: Upload ultrasound report via API and verify response contains ZERO fake blood lab values."""
    headers = get_auth_headers()
    usg_content = """
    ULTRASOUND SONOGRAPHY OF ABDOMEN & PELVIS
    Right Kidney: Measures 10.2 cm. Increased cortical echotexture.
    Pelvicalyceal System: Dilated with Grade I hydronephrosis.
    Left Kidney: Measures 10.5 cm. Normal echogenicity.
    IMPRESSION: Mild Right Hydronephrosis with increased cortical echogenicity.
    """
    
    files = {"file": ("kidney_scan.txt", usg_content.encode("utf-8"), "text/plain")}
    response = client.post("/api/reports/upload", headers=headers, files=files)
    assert response.status_code == 200, response.text
    
    data = response.json()
    assert data["document_type"] == "ultrasound_report"
    assert data["impression"] is not None
    assert "Hydronephrosis" in data["impression"]
    assert data["can_run_new_screening"] is False
    
    # Ensure zero fake glucose or cholesterol
    params = data["detected_parameters"]
    param_names = [p["parameter"].lower() for p in params]
    assert "fasting blood glucose" not in param_names
    assert "total cholesterol" not in param_names

def test_blood_report_upload_and_screening_eligibility():
    """Test 3: Upload blood report and verify real extracted lab analytes & screening eligibility."""
    headers = get_auth_headers()
    blood_text = """
    COMPREHENSIVE METABOLIC & LIPID PANEL
    Fasting Blood Glucose: 112 mg/dL (Reference 70 - 99 mg/dL)
    HbA1c: 6.1 % (Reference < 5.7 %)
    Total Cholesterol: 215 mg/dL (Reference < 200 mg/dL)
    HDL Cholesterol: 45 mg/dL (Reference >= 40 mg/dL)
    LDL Cholesterol: 135 mg/dL (Reference < 100 mg/dL)
    Triglycerides: 160 mg/dL (Reference < 150 mg/dL)
    Systolic BP: 132 mmHg
    Diastolic BP: 84 mmHg
    IMPRESSION: Mild fasting hyperglycemia and elevated total serum cholesterol.
    """
    
    files = {"file": ("lipid_glycemic_panel.txt", blood_text.encode("utf-8"), "text/plain")}
    response = client.post("/api/reports/upload", headers=headers, files=files)
    assert response.status_code == 200, response.text
    
    data = response.json()
    assert data["document_type"] in ["blood_report", "lipid_report", "diabetes_report"]
    assert data["can_run_new_screening"] is True
    assert len(data["screening_opportunities"]) >= 2
    
    # Verify values extracted match text
    params = {p["parameter"].lower(): p["value"] for p in data["detected_parameters"]}
    assert params.get("fasting blood glucose") == 112.0
    assert params.get("total cholesterol") == 215.0

def test_type_aware_report_comparison():
    """Test 4: Verify previous report comparison ONLY compares matching document_types."""
    test_email = f"type_comp_{uuid.uuid4().hex[:8]}@healthai.local"
    reg = client.post("/api/auth/register", json={
        "email": test_email,
        "password": "Password123!",
        "full_name": "Type Comp Patient"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Upload X-Ray Report 1 (Chest X-Ray)
    xray1 = "X-RAY CHEST PA VIEW: Lungs clear. Cardiac silhouette normal. IMPRESSION: Normal chest radiograph."
    res1 = client.post("/api/reports/upload", headers=headers, files={"file": ("chest_xray_01.txt", xray1.encode("utf-8"), "text/plain")})
    assert res1.status_code == 200
    assert res1.json()["document_type"] == "xray_report"
    # First X-Ray should have no previous X-Ray
    assert res1.json()["has_previous_report"] is False

    # 2. Upload Ultrasound Report (different type)
    usg1 = "ULTRASOUND KIDNEY: Right kidney 10.0 cm. Cortical echotexture normal. IMPRESSION: Normal USG KUB."
    res_u = client.post("/api/reports/upload", headers=headers, files={"file": ("usg_oct02.txt", usg1.encode("utf-8"), "text/plain")})
    assert res_u.status_code == 200
    assert res_u.json()["document_type"] == "ultrasound_report"

    # 3. Upload X-Ray Report 2 (matching chest_xray_01)
    xray2 = "X-RAY CHEST PA VIEW: Minimal linear opacity left base. IMPRESSION: Mild bibasilar atelectasis."
    res2 = client.post("/api/reports/upload", headers=headers, files={"file": ("chest_xray_02.txt", xray2.encode("utf-8"), "text/plain")})
    assert res2.status_code == 200
    
    data2 = res2.json()
    # Should compare against chest_xray_01, NOT usg_oct02 or blood reports!
    assert data2["document_type"] == "xray_report"
    assert data2["has_previous_report"] is True
    assert data2["previous_filename"] == "chest_xray_01.txt"

def test_reject_screening_for_non_blood_reports():
    """Test 5: Verify run-screening API rejects non-blood reports with HTTP 400 error."""
    headers = get_auth_headers()
    usg_content = "ULTRASOUND KUB: Right kidney 10.1 cm. IMPRESSION: Normal."
    res = client.post("/api/reports/upload", headers=headers, files={"file": ("usg_test.txt", usg_content.encode("utf-8"), "text/plain")})
    doc_id = res.json()["id"]

    # Attempt to run diabetes screening from ultrasound report
    run_res = client.post(
        f"/api/reports/{doc_id}/run-screening",
        headers=headers,
        json={"disease_type": "diabetes", "age": 48, "gender": "male", "bmi": 25.5}
    )
    assert run_res.status_code == 400
    assert "No supported disease-screening model can be reliably triggered" in run_res.json()["detail"]

def test_run_screening_from_valid_blood_report():
    """Test 6: Verify run-screening API works for valid blood reports and persists new screening record."""
    headers = get_auth_headers()
    blood_text = "Fasting Blood Glucose: 118 mg/dL. Total Cholesterol: 220 mg/dL. Systolic BP: 130 mmHg."
    res = client.post("/api/reports/upload", headers=headers, files={"file": ("lab_valid.txt", blood_text.encode("utf-8"), "text/plain")})
    doc_id = res.json()["id"]

    run_res = client.post(
        f"/api/reports/{doc_id}/run-screening",
        headers=headers,
        json={"disease_type": "diabetes", "age": 48, "gender": "male", "bmi": 25.5}
    )
    assert run_res.status_code == 200, run_res.text
    data = run_res.json()
    assert data["screening_type"] == "diabetes"
    assert "risk_score_percentage" in data
    assert "historical_comparison" in data

def test_cbc_report_extraction():
    """Test 7: CBC Report extraction across standard hematology analytes."""
    headers = get_auth_headers()
    cbc_text = """
    COMPLETE BLOOD COUNT (CBC) & HEMOGRAM
    Hemoglobin: 13.8 g/dL (Reference 12.0 - 15.5 g/dL)
    WBC Count: 6800 /µL (Reference 4500 - 11000 /µL)
    RBC Count: 4.6 M/µL (Reference 4.0 - 5.2 M/µL)
    Platelet Count: 240000 /µL (Reference 150000 - 450000 /µL)
    Hematocrit: 41.5 % (Reference 37.0 - 48.0 %)
    MCV: 89.2 fL (Reference 80.0 - 100.0 fL)
    IMPRESSION: Normal Complete Blood Count. No cytopenia.
    """
    res = client.post("/api/reports/upload", headers=headers, files={"file": ("cbc_panel.txt", cbc_text.encode("utf-8"), "text/plain")})
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["document_type"] == "cbc_report"
    assert "Normal Complete Blood Count" in data["impression"]
    params = {p["parameter"].lower(): p["value"] for p in data["detected_parameters"]}
    assert params.get("hemoglobin") == 13.8
    assert params.get("wbc count") == 6800.0
    assert params.get("platelet count") == 240000.0

def test_thyroid_report_extraction():
    """Test 8: Thyroid panel extraction (TSH, Free T3, Free T4)."""
    headers = get_auth_headers()
    thyroid_text = """
    THYROID FUNCTION PROFILE (SERUM)
    TSH: 2.85 uIU/mL (Reference 0.45 - 4.50 uIU/mL)
    Free T3: 3.10 pg/mL (Reference 2.0 - 4.4 pg/mL)
    Free T4: 1.25 ng/dL (Reference 0.82 - 1.77 ng/dL)
    IMPRESSION: Euthyroid physiological status.
    """
    res = client.post("/api/reports/upload", headers=headers, files={"file": ("thyroid_report.txt", thyroid_text.encode("utf-8"), "text/plain")})
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["document_type"] == "thyroid_report"
    assert "Euthyroid" in data["impression"]
    params = {p["parameter"].lower(): p["value"] for p in data["detected_parameters"]}
    assert params.get("tsh") == 2.85
    assert params.get("free t3") == 3.10
    assert params.get("free t4") == 1.25

def test_lft_report_extraction():
    """Test 9: Liver Function Test (LFT) extraction (ALT, AST, Bilirubin, ALP, Albumin)."""
    headers = get_auth_headers()
    lft_text = """
    LIVER FUNCTION TEST (LFT) PANEL
    ALT (SGPT): 28 U/L (Reference 7 - 56 U/L)
    AST (SGOT): 24 U/L (Reference 10 - 40 U/L)
    Total Bilirubin: 0.8 mg/dL (Reference 0.2 - 1.2 mg/dL)
    Direct Bilirubin: 0.2 mg/dL (Reference < 0.3 mg/dL)
    Alkaline Phosphatase (ALP): 82 U/L (Reference 44 - 147 U/L)
    Serum Albumin: 4.3 g/dL (Reference 3.5 - 5.0 g/dL)
    IMPRESSION: Hepatic enzymes and synthetic function within normal limits.
    """
    res = client.post("/api/reports/upload", headers=headers, files={"file": ("lft_panel.txt", lft_text.encode("utf-8"), "text/plain")})
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["document_type"] == "lft_report"
    assert "Hepatic enzymes" in data["impression"]
    params = {p["parameter"].lower(): p["value"] for p in data["detected_parameters"]}
    assert params.get("alt (sgpt)") == 28.0
    assert params.get("total bilirubin") == 0.8
    assert params.get("serum albumin") == 4.3

def test_kft_report_extraction():
    """Test 10: Kidney Function Test (KFT/RFT) extraction (Creatinine, BUN, Urea, eGFR)."""
    headers = get_auth_headers()
    kft_text = """
    RENAL FUNCTION TEST (KFT / RFT)
    Serum Creatinine: 0.95 mg/dL (Reference 0.7 - 1.3 mg/dL)
    Blood Urea Nitrogen (BUN): 14 mg/dL (Reference 7 - 20 mg/dL)
    Blood Urea: 28 mg/dL (Reference 15 - 45 mg/dL)
    Uric Acid: 5.2 mg/dL (Reference 3.5 - 7.2 mg/dL)
    eGFR: 98 mL/min/1.73m² (Reference > 60)
    IMPRESSION: Normal renal function with preserved glomerular filtration.
    """
    res = client.post("/api/reports/upload", headers=headers, files={"file": ("renal_function.txt", kft_text.encode("utf-8"), "text/plain")})
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["document_type"] == "kft_report"
    assert "Normal renal function" in data["impression"]
    params = {p["parameter"].lower(): p["value"] for p in data["detected_parameters"]}
    assert params.get("serum creatinine") == 0.95
    assert params.get("blood urea nitrogen (bun)") == 14.0

def test_urine_analysis_extraction():
    """Test 11: Urine Routine & Microscopy report extraction."""
    headers = get_auth_headers()
    urine_text = """
    URINE ANALYSIS & MICROSCOPY REPORT
    Specific Gravity: 1.018 (Reference 1.005 - 1.030)
    pH: 6.0 (Reference 4.5 - 8.0)
    Protein: Nil
    Glucose: Nil
    Ketones: Negative
    Pus Cells: 1 - 2 /HPF
    Epithelial Cells: Occasional
    IMPRESSION: Routine urine examination unremarkable.
    """
    res = client.post("/api/reports/upload", headers=headers, files={"file": ("urinalysis.txt", urine_text.encode("utf-8"), "text/plain")})
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["document_type"] == "urine_report"
    assert "unremarkable" in data["impression"]
    # Check that it extracted urine parameters
    assert len(data["detected_parameters"]) >= 3
    # Check zero fake glucose / cholesterol
    param_names = [p["parameter"].lower() for p in data["detected_parameters"]]
    assert "fasting blood glucose" not in param_names
    assert "total cholesterol" not in param_names

def test_ecg_report_extraction():
    """Test 12: Electrocardiogram (ECG) Report extraction."""
    headers = get_auth_headers()
    ecg_text = """
    12-LEAD RESTING ELECTROCARDIOGRAM (ECG)
    Ventricular Rate: 72 bpm
    PR Interval: 158 ms
    QRS Duration: 86 ms
    Cardiac Rhythm: Normal Sinus Rhythm
    IMPRESSION: Normal resting 12-lead electrocardiogram. Normal sinus rhythm at 72 bpm without ischemic abnormality.
    """
    res = client.post("/api/reports/upload", headers=headers, files={"file": ("ecg_trace.txt", ecg_text.encode("utf-8"), "text/plain")})
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["document_type"] == "ecg_report"
    assert "Normal resting 12-lead electrocardiogram" in data["impression"]
    params = {p["parameter"].lower(): p["value"] for p in data["detected_parameters"]}
    assert params.get("heart rate (ventricular)") == 72
    assert params.get("pr interval") == 158
    assert params.get("qrs duration") == 86

def test_chest_xray_extraction():
    """Test 13: Chest X-Ray radiograph report extraction."""
    headers = get_auth_headers()
    xray_text = """
    CHEST RADIOGRAPH (X-RAY CHEST PA VIEW)
    Lungs: Both lung fields clear of focal consolidation or pneumothorax.
    Cardiac Silhouette: Normal cardiac size and contour.
    Pleural Spaces: Costophrenic angles sharp. No effusion.
    IMPRESSION: Normal chest radiograph. No active cardiopulmonary disease.
    """
    res = client.post("/api/reports/upload", headers=headers, files={"file": ("chest_xray_test.txt", xray_text.encode("utf-8"), "text/plain")})
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["document_type"] == "xray_report"
    assert "Normal chest radiograph" in data["impression"]
    assert len(data["detected_parameters"]) >= 2
    # Verify zero fake blood panel values
    param_names = [p["parameter"].lower() for p in data["detected_parameters"]]
    assert "fasting blood glucose" not in param_names
    assert "total cholesterol" not in param_names

def test_poor_quality_or_unreadable_file_handling():
    """Test 14: Verify poor quality or unextracted file returns warning, zero fake values, and does not crash."""
    headers = get_auth_headers()
    empty_content = b""
    res = client.post("/api/reports/upload", headers=headers, files={"file": ("corrupted_scan.png", empty_content, "image/png")})
    assert res.status_code == 200, res.text
    data = res.json()
    # Zero fake parameters!
    assert len(data["detected_parameters"]) == 0
    assert data["can_run_new_screening"] is False
    # Warning message in summary or metadata
    assert "Some text could not be reliably extracted" in data["summary"] or data["processing_metadata"]["status"] in ["warning", "failed"]
