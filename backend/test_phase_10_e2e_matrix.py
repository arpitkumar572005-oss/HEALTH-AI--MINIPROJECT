"""
Phase 10 — HealthAI Full System Integration & End-to-End Verification Matrix
Tests Scenarios A through T as defined in Phase 10 specifications.
"""

import uuid
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone

from app.main import app
from app.database.session import SessionLocal
from app.models.entities import User, PatientProfile, Screening, HealthMeasurement, HealthDocument

client = TestClient(app)

def create_isolated_user(prefix: str = "user"):
    email = f"{prefix}_{uuid.uuid4().hex[:8]}@healthai.test"
    pwd = "SecurePassword123!"
    res = client.post("/api/auth/register", json={
        "full_name": f"Test {prefix.capitalize()}",
        "email": email,
        "password": pwd,
        "age": 45,
        "gender": "male",
        "height_cm": 175,
        "weight_kg": 75
    })
    assert res.status_code == 201, res.text
    token = res.json()["access_token"]
    user_id = res.json()["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}
    return user_id, headers


# ==============================================================================
# TEST A: First Diabetes Screening (Baseline)
# ==============================================================================
def test_a_first_diabetes_screening_baseline():
    user_id, headers = create_isolated_user("test_a")
    payload = {
        "age": 45,
        "gender": "male",
        "bmi": 24.5,
        "fasting_glucose": 95.0,
        "systolic_bp": 120,
        "diastolic_bp": 80,
        "family_history": False,
        "physical_activity_hours": 3.0,
        "symptoms": []
    }
    res = client.post("/api/screening/diabetes", json=payload, headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["screening_type"] == "diabetes"
    assert "risk_score" in data
    assert "risk_score_percentage" in data
    assert data["algorithm"] in ["LogisticRegression", "Random Forest"]
    # Verify baseline state (no previous data)
    assert data["historical_comparison"]["has_previous_data"] is False
    assert data["historical_comparison"]["risk_trend"] in ["Initial baseline", "No previous data"] or "baseline" in data["historical_comparison"]["explanation"].lower()
    
    # Verify record in DB
    db = SessionLocal()
    rec = db.query(Screening).filter(Screening.id == data["id"]).first()
    assert rec is not None
    assert rec.user_id == user_id
    db.close()


# ==============================================================================
# TEST B: Second Diabetes Screening (Genuine Comparison)
# ==============================================================================
def test_b_second_diabetes_screening_comparison():
    user_id, headers = create_isolated_user("test_b")
    # First screening
    p1 = {
        "age": 48,
        "gender": "male",
        "bmi": 25.0,
        "fasting_glucose": 115.0,
        "systolic_bp": 125,
        "diastolic_bp": 82,
        "family_history": True,
        "physical_activity_hours": 2.0,
        "symptoms": []
    }
    r1 = client.post("/api/screening/diabetes", json=p1, headers=headers)
    assert r1.status_code == 200
    d1 = r1.json()
    id1 = d1["id"]
    risk1 = d1["risk_score_percentage"]

    # Second screening with improved glucose
    p2 = {
        "age": 48,
        "gender": "male",
        "bmi": 24.5,
        "fasting_glucose": 92.0,
        "systolic_bp": 118,
        "diastolic_bp": 78,
        "family_history": True,
        "physical_activity_hours": 4.0,
        "symptoms": []
    }
    r2 = client.post("/api/screening/diabetes", json=p2, headers=headers)
    assert r2.status_code == 200
    d2 = r2.json()
    id2 = d2["id"]
    
    # Assert distinct records
    assert id1 != id2
    comp = d2["historical_comparison"]
    assert comp["has_previous_data"] is True
    assert comp["previous_screening_id"] == id1
    assert comp["previous_risk_percentage"] == risk1
    assert "risk_change_points" in comp
    assert len(comp["parameter_comparisons"]) > 0

    # Verify first record is unmodified in DB
    db = SessionLocal()
    rec1 = db.query(Screening).filter(Screening.id == id1).first()
    assert rec1.risk_score == d1["risk_score"]
    db.close()


# ==============================================================================
# TEST C: First Cardiovascular Screening
# ==============================================================================
def test_c_first_cardiovascular_screening():
    user_id, headers = create_isolated_user("test_c")
    payload = {
        "age": 50,
        "gender": "female",
        "bmi": 23.5,
        "systolic_bp": 122,
        "cholesterol": 185.0,
        "fasting_glucose": 90.0,
        "heart_rate": 68,
        "smoking_status": "never",
        "chest_discomfort_level": 0,
        "physical_activity_hours": 3.5,
        "symptoms": []
    }
    res = client.post("/api/screening/cardiovascular", json=payload, headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["screening_type"] == "cardiovascular"
    assert data["algorithm"] in ["LogisticRegression", "XGBoost"]
    assert data["historical_comparison"]["has_previous_data"] is False


# ==============================================================================
# TEST D: Second Cardiovascular Screening
# ==============================================================================
def test_d_second_cardiovascular_screening_comparison():
    user_id, headers = create_isolated_user("test_d")
    p1 = {
        "age": 52,
        "gender": "male",
        "bmi": 26.0,
        "systolic_bp": 135,
        "cholesterol": 230.0,
        "heart_rate": 75,
        "smoking_status": "former",
        "chest_discomfort_level": 1,
        "physical_activity_hours": 1.5,
        "symptoms": []
    }
    r1 = client.post("/api/screening/cardiovascular", json=p1, headers=headers)
    assert r1.status_code == 200
    id1 = r1.json()["id"]

    p2 = {
        "age": 52,
        "gender": "male",
        "bmi": 25.0,
        "systolic_bp": 124,
        "cholesterol": 195.0,
        "heart_rate": 70,
        "smoking_status": "former",
        "chest_discomfort_level": 0,
        "physical_activity_hours": 3.0,
        "symptoms": []
    }
    r2 = client.post("/api/screening/cardiovascular", json=p2, headers=headers)
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["historical_comparison"]["has_previous_data"] is True
    assert d2["historical_comparison"]["previous_screening_id"] == id1


# ==============================================================================
# TEST E: First Hypertension Screening
# ==============================================================================
def test_e_first_hypertension_screening():
    user_id, headers = create_isolated_user("test_e")
    payload = {
        "age": 42,
        "gender": "male",
        "bmi": 24.0,
        "systolic_bp": 118,
        "diastolic_bp": 78,
        "heart_rate": 72,
        "family_history": False,
        "sodium_intake": "low",
        "smoking_status": "never",
        "physical_activity_hours": 4.0,
        "symptoms": []
    }
    res = client.post("/api/screening/hypertension", json=payload, headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["screening_type"] == "hypertension"
    assert data["algorithm"] in ["LogisticRegression", "Random Forest"]
    assert data["historical_comparison"]["has_previous_data"] is False


# ==============================================================================
# TEST F: Second Hypertension Screening
# ==============================================================================
def test_f_second_hypertension_screening_comparison():
    user_id, headers = create_isolated_user("test_f")
    p1 = {
        "age": 44,
        "gender": "female",
        "bmi": 26.5,
        "systolic_bp": 138,
        "diastolic_bp": 88,
        "heart_rate": 76,
        "family_history": True,
        "sodium_intake": "high",
        "smoking_status": "never",
        "physical_activity_hours": 1.5,
        "symptoms": []
    }
    r1 = client.post("/api/screening/hypertension", json=p1, headers=headers)
    id1 = r1.json()["id"]

    p2 = {
        "age": 44,
        "gender": "female",
        "bmi": 25.5,
        "systolic_bp": 122,
        "diastolic_bp": 80,
        "heart_rate": 70,
        "family_history": True,
        "sodium_intake": "moderate",
        "smoking_status": "never",
        "physical_activity_hours": 3.5,
        "symptoms": []
    }
    r2 = client.post("/api/screening/hypertension", json=p2, headers=headers)
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["historical_comparison"]["has_previous_data"] is True
    assert d2["historical_comparison"]["previous_screening_id"] == id1


# ==============================================================================
# TEST G: Cross-Type Disease Isolation
# ==============================================================================
def test_g_cross_disease_history_isolation():
    user_id, headers = create_isolated_user("test_g")
    # 1. Run Diabetes Screening
    d_res = client.post("/api/screening/diabetes", json={
        "age": 46, "gender": "male", "bmi": 24.5, "fasting_glucose": 110,
        "systolic_bp": 125, "diastolic_bp": 82, "family_history": False, "physical_activity_hours": 2.5
    }, headers=headers)
    assert d_res.status_code == 200

    # 2. Run Cardiovascular Screening -> MUST NOT compare to Diabetes
    c_res = client.post("/api/screening/cardiovascular", json={
        "age": 46, "gender": "male", "bmi": 24.5, "systolic_bp": 125,
        "cholesterol": 195, "heart_rate": 72, "smoking_status": "never", "chest_discomfort_level": 0
    }, headers=headers)
    assert c_res.status_code == 200
    assert c_res.json()["historical_comparison"]["has_previous_data"] is False

    # 3. Run Hypertension Screening -> MUST NOT compare to Diabetes or Cardio
    h_res = client.post("/api/screening/hypertension", json={
        "age": 46, "gender": "male", "bmi": 24.5, "systolic_bp": 125,
        "diastolic_bp": 82, "heart_rate": 72, "family_history": False, "sodium_intake": "moderate"
    }, headers=headers)
    assert h_res.status_code == 200
    assert h_res.json()["historical_comparison"]["has_previous_data"] is False


# ==============================================================================
# TEST H: Dashboard Refresh & Data Persistence
# ==============================================================================
def test_h_dashboard_refresh_persistence():
    user_id, headers = create_isolated_user("test_h")
    # Log a measurement
    client.post("/api/health/measurements", json={
        "measurement_type": "blood_glucose",
        "value": 102.0,
        "unit": "mg/dL",
        "notes": "Morning check"
    }, headers=headers)

    # Perform screening
    client.post("/api/screening/diabetes", json={
        "age": 46, "gender": "male", "bmi": 24.5, "fasting_glucose": 102,
        "systolic_bp": 120, "diastolic_bp": 80, "family_history": False
    }, headers=headers)

    # Fetch overview twice (simulating dashboard refresh)
    r1 = client.get("/api/health/dashboard-overview", headers=headers)
    assert r1.status_code == 200
    d1 = r1.json()

    r2 = client.get("/api/health/dashboard-overview", headers=headers)
    assert r2.status_code == 200
    d2 = r2.json()

    assert d1["screenings_summary"]["diabetes"]["latest"]["risk_score_percentage"] == d2["screenings_summary"]["diabetes"]["latest"]["risk_score_percentage"]
    assert d1["latest_measurements"]["blood_glucose"]["value"] == 102.0


# ==============================================================================
# TEST I: Health Trends (Insufficient Data vs Valid Slope)
# ==============================================================================
def test_i_health_trends_validity():
    user_id, headers = create_isolated_user("test_i")
    # 1. Single measurement -> insufficient data
    client.post("/api/health/measurements", json={
        "measurement_type": "blood_glucose",
        "value": 110.0,
        "unit": "mg/dL"
    }, headers=headers)

    t1 = client.get("/api/health/trends?timeframe=30d", headers=headers).json()
    assert t1["metric_details"]["blood_glucose"]["has_sufficient_data"] is False
    assert "Not enough" in t1["metric_details"]["blood_glucose"]["status_message"]

    # 2. Add second measurement -> sufficient data with trend calculation
    client.post("/api/health/measurements", json={
        "measurement_type": "blood_glucose",
        "value": 98.0,
        "unit": "mg/dL"
    }, headers=headers)

    t2 = client.get("/api/health/trends?timeframe=30d", headers=headers).json()
    bg = t2["metric_details"]["blood_glucose"]
    assert bg["has_sufficient_data"] is True
    assert bg["trend_direction"] == "decreasing"
    assert bg["shift_delta"] == -12.0


# ==============================================================================
# TEST J: Timeline Chronology & Idempotency
# ==============================================================================
def test_j_timeline_events():
    user_id, headers = create_isolated_user("test_j")
    # Log checkin
    client.post("/api/checkins", json={
        "mood": "good", "energy_level": 4, "stress_level": "low", "sleep_hours": 7.5,
        "physical_activity_mins": 30
    }, headers=headers)

    # Log measurement
    client.post("/api/health/measurements", json={
        "measurement_type": "resting_heart_rate", "value": 68.0, "unit": "bpm"
    }, headers=headers)

    res = client.get("/api/timeline", headers=headers)
    assert res.status_code == 200
    events = res.json()
    assert len(events) >= 2
    # Verify events are chronological (descending)
    t0 = datetime.fromisoformat(events[0]["date"])
    t1 = datetime.fromisoformat(events[1]["date"])
    assert t0 >= t1


# ==============================================================================
# TEST K: Kidney Ultrasound Upload (Zero Fake Biomarkers)
# ==============================================================================
def test_k_kidney_ultrasound_zero_fabricated_biomarkers():
    user_id, headers = create_isolated_user("test_k")
    usg_report = """
    ULTRASOUND KIDNEY URETER BLADDER (USG KUB)
    Right Kidney: Measures 10.3 cm in length. Normal cortical echogenicity.
    Left Kidney: Measures 10.7 cm. Grade I hydronephrosis with 5 mm calculus in lower calyx.
    Urinary Bladder: Distended with 25 mL post-void residual urine.
    IMPRESSION: Left mild hydronephrosis secondary to 5 mm renal calculus. Right kidney normal.
    """
    res = client.post("/api/reports/upload", files={
        "file": ("usg_kidney.txt", usg_report.encode("utf-8"), "text/plain")
    }, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["document_type"] == "ultrasound_report"
    assert "hydronephrosis" in data["impression"].lower()
    assert data["can_run_new_screening"] is False

    # CRITICAL: Verify ZERO fabricated blood biomarkers
    param_names = [p["parameter"].lower() for p in data["detected_parameters"]]
    assert "fasting blood glucose" not in param_names
    assert "total cholesterol" not in param_names
    assert "hba1c" not in param_names


# ==============================================================================
# TEST L: Blood / Laboratory Report Upload
# ==============================================================================
def test_l_blood_report_real_analytes():
    user_id, headers = create_isolated_user("test_l")
    blood_report = """
    COMPREHENSIVE METABOLIC & LIPID PANEL
    Fasting Blood Glucose: 114 mg/dL (Reference 70 - 99 mg/dL)
    HbA1c: 6.2 % (Reference < 5.7 %)
    Total Cholesterol: 218 mg/dL (Reference < 200 mg/dL)
    HDL Cholesterol: 44 mg/dL
    Triglycerides: 165 mg/dL
    IMPRESSION: Mild fasting hyperglycemia and hypercholesterolemia.
    """
    res = client.post("/api/reports/upload", files={
        "file": ("metabolic_panel.txt", blood_report.encode("utf-8"), "text/plain")
    }, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["document_type"] in ["blood_report", "lipid_report", "diabetes_report"]
    params = {p["parameter"].lower(): p["value"] for p in data["detected_parameters"]}
    assert params.get("fasting blood glucose") == 114.0
    assert params.get("total cholesterol") == 218.0
    assert data["can_run_new_screening"] is True


# ==============================================================================
# TEST M: Unsupported or Unreadable Report (No Sample Fallback)
# ==============================================================================
def test_m_unsupported_unreadable_report():
    user_id, headers = create_isolated_user("test_m")
    empty_bytes = b""
    res = client.post("/api/reports/upload", files={
        "file": ("corrupt_file.pdf", empty_bytes, "application/pdf")
    }, headers=headers)
    assert res.status_code == 200
    data = res.json()
    # Ensure zero fake fallbacks
    assert len(data["detected_parameters"]) == 0
    assert data["can_run_new_screening"] is False
    assert "could not be reliably extracted" in data["summary"].lower() or data["processing_metadata"]["status"] in ["warning", "failed"]


# ==============================================================================
# TEST N: Report Comparison (Matching Modalities Only)
# ==============================================================================
def test_n_type_aware_report_comparison():
    user_id, headers = create_isolated_user("test_n")
    # Upload X-Ray 1
    r1 = client.post("/api/reports/upload", files={
        "file": ("xray_1.txt", b"CHEST X-RAY PA VIEW: Lungs clear. Cardiac silhouette normal. IMPRESSION: Normal chest radiograph.", "text/plain")
    }, headers=headers)
    assert r1.json()["has_previous_report"] is False

    # Upload Ultrasound -> Must NOT compare against X-Ray 1
    ru = client.post("/api/reports/upload", files={
        "file": ("usg_1.txt", b"ULTRASOUND KIDNEY: Right kidney 10.2 cm. IMPRESSION: Normal scan.", "text/plain")
    }, headers=headers)
    assert ru.json()["has_previous_report"] is False

    # Upload X-Ray 2 -> Must compare against X-Ray 1
    r2 = client.post("/api/reports/upload", files={
        "file": ("xray_2.txt", b"CHEST X-RAY PA VIEW: Minimal left basilar haze. IMPRESSION: Resolving infiltrates.", "text/plain")
    }, headers=headers)
    assert r2.json()["has_previous_report"] is True
    assert r2.json()["previous_filename"] == "xray_1.txt"


# ==============================================================================
# TEST O: AI Assistant (Answers Grounded in Patient Records)
# ==============================================================================
def test_o_assistant_grounded_in_patient_records():
    user_id, headers = create_isolated_user("test_o")
    # Log glucose 112 mg/dL
    client.post("/api/health/measurements", json={
        "measurement_type": "blood_glucose",
        "value": 112.0,
        "unit": "mg/dL"
    }, headers=headers)

    res = client.post("/api/assistant/chat", json={
        "message": "What was my recorded blood glucose reading?",
        "history": []
    }, headers=headers)
    assert res.status_code == 200
    data = res.json()
    reply = data["reply"]
    assert "112" in reply or "glucose" in reply.lower()


# ==============================================================================
# TEST P: AI Assistant (Missing Patient History)
# ==============================================================================
def test_p_assistant_missing_data_no_hallucination():
    user_id, headers = create_isolated_user("test_p")
    # Ask about unrecorded test (e.g., thyroid)
    res = client.post("/api/assistant/chat", json={
        "message": "What was my thyroid level?",
        "history": []
    }, headers=headers)
    assert res.status_code == 200
    reply = res.json()["reply"].lower()
    assert "don't have enough information" in reply or "not contain recorded data" in reply
    assert "thyroid" in reply


# ==============================================================================
# TEST Q: Invalid Screening Input Validation
# ==============================================================================
def test_q_invalid_screening_input_rejection():
    user_id, headers = create_isolated_user("test_q")
    # Negative glucose and impossible systolic BP
    bad_payload = {
        "age": 45,
        "gender": "male",
        "fasting_glucose": -50.0, # INVALID
        "systolic_bp": 450,       # INVALID
        "diastolic_bp": 300
    }
    res = client.post("/api/screening/diabetes", json=bad_payload, headers=headers)
    assert res.status_code in [400, 422]


# ==============================================================================
# TEST R: Backend / API Clean Failure Handling
# ==============================================================================
def test_r_clean_error_response():
    user_id, headers = create_isolated_user("test_r")
    # Request nonexistent screening
    res = client.get("/api/screening/details/nonexistent-uuid-9999", headers=headers)
    assert res.status_code == 404
    data = res.json()
    assert "detail" in data
    # Ensure no internal Python traceback leaked
    assert "Traceback" not in str(data)


# ==============================================================================
# TEST S: Patient Data Isolation (Security & RBAC)
# ==============================================================================
def test_s_patient_data_isolation():
    user_a_id, headers_a = create_isolated_user("patient_a")
    user_b_id, headers_b = create_isolated_user("patient_b")

    # Patient A creates a screening
    res_a = client.post("/api/screening/diabetes", json={
        "age": 50, "gender": "male", "bmi": 24.0, "fasting_glucose": 95,
        "systolic_bp": 120, "diastolic_bp": 80
    }, headers=headers_a)
    screen_a_id = res_a.json()["id"]

    # Patient B attempts to access Patient A's screening
    res_b = client.get(f"/api/screening/details/{screen_a_id}", headers=headers_b)
    # Must reject with 403 Forbidden or 404 Not Found
    assert res_b.status_code in [403, 404]


# ==============================================================================
# TEST T: Existing UI Navigation & Endpoint Health
# ==============================================================================
def test_t_navigation_endpoints():
    user_id, headers = create_isolated_user("test_t")
    endpoints = [
        "/api/health-check",
        "/api/users/me",
        "/api/profile",
        "/api/screening/models/metadata",
        "/api/screening/history",
        "/api/health/measurements",
        "/api/health/trends",
        "/api/health/dashboard-overview",
        "/api/reports/list",
        "/api/timeline",
        "/api/goals",
        "/api/reminders",
        "/api/insights",
        "/api/checkins/today"
    ]
    for ep in endpoints:
        r = client.get(ep, headers=headers)
        assert r.status_code == 200, f"Endpoint {ep} returned {r.status_code}: {r.text}"
