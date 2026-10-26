"""
End-to-End and Unit Tests for HealthAI Backend and ML Services
Tests auth, ML screening, explainability, health tracking, reports, and admin metrics.
"""

import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.main import app
from app.database.init_db import init_db

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    init_db()

client = TestClient(app)

def test_health_check():
    res = client.get("/api/health-check")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "HealthAI"

def test_demo_login():
    res = client.post("/api/auth/demo-login", json={"role": "patient"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "patient"
    assert data["user"]["is_demo"] is True

def test_user_registration_and_login():
    email = "test.patient@example.com"
    pwd = "SecurePassword123!"
    
    # Register
    reg_res = client.post("/api/auth/register", json={
        "full_name": "Test Patient",
        "email": email,
        "password": pwd,
        "age": 38,
        "gender": "female",
        "height_cm": 165,
        "weight_kg": 62
    })
    # Accept 201 or 400 if rerun
    if reg_res.status_code == 201:
        token = reg_res.json()["access_token"]
    else:
        login_res = client.post("/api/auth/login", json={"email": email, "password": pwd})
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get profile
    prof_res = client.get("/api/profile", headers=headers)
    assert prof_res.status_code == 200
    prof = prof_res.json()
    assert prof["email"] == email

def test_ml_diabetes_screening():
    # Login as demo patient
    login_res = client.post("/api/auth/demo-login", json={"role": "patient"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    screening_payload = {
        "age": 52,
        "gender": "male",
        "height_cm": 175,
        "weight_kg": 88,
        "fasting_glucose": 138,
        "systolic_bp": 135,
        "diastolic_bp": 88,
        "family_history": True,
        "physical_activity_hours": 1.5,
        "symptoms": ["Fatigue", "Frequent urination"]
    }
    
    res = client.post("/api/screening/diabetes", json=screening_payload, headers=headers)
    assert res.status_code == 200
    result = res.json()
    
    assert "id" in result
    assert result["screening_type"] == "diabetes"
    assert result["risk_category"] in ["lower", "moderate", "elevated"]
    assert 0.0 <= result["risk_score"] <= 1.0
    assert "medical_disclaimer" in result
    assert "not a medical diagnosis" in result["medical_disclaimer"].lower()
    
    # Verify explainable AI feature contributions exist
    assert len(result["feature_contributions"]) > 0
    top_feature = result["feature_contributions"][0]
    assert "feature" in top_feature
    assert "contribution" in top_feature
    assert "direction" in top_feature
    assert "explanation" in top_feature
    
    # Verify safety: no diagnostic claims
    assert "you have diabetes" not in result["risk_heading"].lower()
    assert "you have diabetes" not in result["risk_summary"].lower()

def test_ml_cardiovascular_screening():
    login_res = client.post("/api/auth/demo-login", json={"role": "patient"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "age": 58,
        "gender": "male",
        "height_cm": 180,
        "weight_kg": 85,
        "systolic_bp": 142,
        "cholesterol": 240,
        "heart_rate": 78,
        "smoking_status": "former",
        "chest_discomfort_level": 1,
        "physical_activity_hours": 2.0
    }
    res = client.post("/api/screening/cardiovascular", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["screening_type"] == "cardiovascular"
    assert data["risk_category"] in ["lower", "moderate", "elevated"]

def test_ml_hypertension_screening():
    login_res = client.post("/api/auth/demo-login", json={"role": "patient"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "age": 45,
        "gender": "female",
        "systolic_bp": 130,
        "diastolic_bp": 85,
        "heart_rate": 74,
        "family_history": True,
        "sodium_intake": "moderate",
        "smoking_status": "never",
        "physical_activity_hours": 3.0,
        "symptoms": ["Occasional mild headache"]
    }
    res = client.post("/api/screening/hypertension", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["screening_type"] == "hypertension"

def test_pdf_report_generation():
    login_res = client.post("/api/auth/demo-login", json={"role": "patient"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # First get history to find a screening ID
    hist_res = client.get("/api/screening/history", headers=headers)
    assert hist_res.status_code == 200
    items = hist_res.json()
    assert len(items) > 0
    screening_id = items[0]["id"]
    
    # Download PDF
    pdf_res = client.get(f"/api/reports/{screening_id}/pdf", headers=headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 500 # Valid non-empty PDF bytes

def test_health_trends():
    login_res = client.post("/api/auth/demo-login", json={"role": "patient"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    trends_res = client.get("/api/health/trends?timeframe=30d", headers=headers)
    assert trends_res.status_code == 200
    data = trends_res.json()
    assert "metrics" in data
    assert "blood_glucose" in data["metrics"]
    assert "systolic_bp" in data["metrics"]

def test_companion_endpoints():
    login_res = client.post("/api/auth/demo-login", json={"role": "patient"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Chat assistant
    chat_res = client.post("/api/assistant/chat", json={"message": "What is my current blood pressure?"}, headers=headers)
    assert chat_res.status_code == 200
    assert "reply" in chat_res.json()
    assert "mmHg" in chat_res.json()["reply"]

    # 2. Daily check-in
    checkin_res = client.post("/api/checkins", json={
        "mood": "energetic",
        "energy_level": 8,
        "stress_level": "low",
        "sleep_hours": 7.5,
        "physical_activity_mins": 45,
        "symptoms": ["none"]
    }, headers=headers)
    assert checkin_res.status_code == 200
    assert checkin_res.json()["mood"] == "energetic"

    # 3. Health goals
    goals_res = client.get("/api/goals", headers=headers)
    assert goals_res.status_code == 200
    assert len(goals_res.json()) >= 1

    # 4. Reminders
    reminders_res = client.get("/api/reminders", headers=headers)
    assert reminders_res.status_code == 200
    assert len(reminders_res.json()) >= 1

    # 5. Screening comparison
    compare_res = client.get("/api/screening/compare", headers=headers)
    assert compare_res.status_code == 200
    assert "score_diff_pct" in compare_res.json()

def test_current_vs_previous_screening_intelligent_comparison():
    """Verify that submitting current screening data automatically compares with previous records."""
    login_res = client.post("/api/auth/demo-login", json={"role": "patient"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Patient enters ONLY CURRENT data (e.g. glucose 135 mg/dL, systolic BP 138)
    current_screening_payload = {
        "age": 46,
        "gender": "male",
        "height_cm": 178,
        "weight_kg": 85.5,
        "bmi": 27.0,
        "fasting_glucose": 135.0,
        "systolic_bp": 138,
        "diastolic_bp": 88,
        "family_history": True,
        "physical_activity_hours": 1.5,
        "symptoms": ["Fatigue", "Excessive thirst"]
    }

    res = client.post("/api/screening/diabetes", json=current_screening_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()

    # 1. Verify new risk prediction
    assert "risk_score" in data
    assert "risk_category" in data

    # 2. Verify automatic historical comparison
    assert "historical_comparison" in data
    comp = data["historical_comparison"]
    assert comp is not None
    assert comp["has_previous_data"] is True
    assert comp["previous_risk_percentage"] is not None
    assert comp["risk_change_points"] is not None
    assert comp["risk_trend"] in ["Increased", "Decreased", "Stable"]
    assert "explanation" in comp

    # 3. Verify parameter comparisons (previous, current, change, trend)
    params = comp["parameter_comparisons"]
    assert len(params) >= 3
    glucose_comp = next((p for p in params if p["key"] == "fasting_glucose"), None)
    assert glucose_comp is not None
    assert glucose_comp["previous_value"] is not None # Automatically retrieved from previous record
    assert "135" in glucose_comp["current_value"]
    assert glucose_comp["change"] is not None
    assert glucose_comp["trend"] in ["Increased", "Decreased", "Stable"]

def test_symptom_based_early_risk_screening():
    """Verify symptom-based early risk screening within Health Screening module."""
    login_res = client.post("/api/auth/demo-login", json={"role": "patient"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    symptom_payload = {
        "symptoms": ["Excessive thirst", "Frequent urination", "Fatigue"],
        "duration": "weeks",
        "severity": "moderate",
        "onset": "gradual",
        "description": "Noticeable dry mouth and drinking much more water than usual.",
        "current_glucose": 130.0,
        "current_systolic_bp": 132
    }

    res = client.post("/api/screening/symptoms", json=symptom_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["screening_type"] == "symptom_risk"
    assert "Symptom" in data["screening_title"]
    assert "symptom_progression" in data
    assert data["symptom_progression"] is not None
    assert "new_symptoms" in data["symptom_progression"]
    assert "historical_comparison" in data

def test_medical_report_summarizer_and_comparison():
    """Verify report upload, automatic previous report retrieval, and report-to-screening pipeline."""
    login_res = client.post("/api/auth/demo-login", json={"role": "patient"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Upload current report
    upload_res = client.post(
        "/api/reports/upload",
        data={"filename_override": "current_lab_panel_oct.pdf", "raw_text": "Fasting Blood Glucose: 110 mg/dL. HbA1c: 5.9%. Total Cholesterol: 192 mg/dL. Hemoglobin: 13.6 g/dL."},
        headers=headers
    )
    assert upload_res.status_code == 200
    rep_data = upload_res.json()

    # 2. Verify automatic previous report comparison
    assert rep_data["has_previous_report"] is True
    assert len(rep_data["parameter_comparisons"]) >= 3
    assert "change_explanation" in rep_data
    assert rep_data["can_run_new_screening"] is True

    # 3. Verify report-derived NEW risk screening (does NOT modify old prediction)
    doc_id = rep_data["id"]
    screen_res = client.post(
        f"/api/reports/{doc_id}/run-screening",
        json={"disease_type": "diabetes"},
        headers=headers
    )
    assert screen_res.status_code == 200
    new_screen_data = screen_res.json()
    assert new_screen_data["screening_type"] == "diabetes"
    assert "historical_comparison" in new_screen_data
    assert new_screen_data["historical_comparison"]["has_previous_data"] is True

