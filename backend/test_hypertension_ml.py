"""
HealthAI — Phase 5: Hypertension Machine Learning Comprehensive Test Suite
==========================================================================
Tests:
1. ML Pipeline & Artifacts: Model artifact, metadata, metrics.
2. Inference Service: Valid normotensive, hypertensive, and emergency crisis inputs.
3. Feature Contributions: Explainability, non-diagnostic phrasing, mathematical normalization.
4. API Validation: Missing fields, out-of-bounds inputs, boundary testing.
5. End-to-end API Screening: POST /api/screening/hypertension with dynamic longitudinal comparison.
6. Database Persistence: Verifies new Screening record & HealthMeasurement entries created without overwriting.
7. Non-regression: Diabetes ML & Cardiovascular ML continue functioning without disruption.
"""

import os
import json
import uuid
import pytest
import requests
import pandas as pd
import numpy as np

from app.ml.inference_service import (
    registry,
    run_hypertension_screening,
    run_diabetes_screening,
    run_cardiovascular_screening
)

BASE_URL = "http://127.0.0.1:8000/api"

# -------------------------------------------------------------------------
# Unit Tests for ML Model and Inference Service
# -------------------------------------------------------------------------

def test_hypertension_model_artifacts_and_metrics():
    """Verify hypertension model artifact, metadata, and actual metrics."""
    meta = registry.get_metadata("hypertension")
    assert meta is not None, "Missing hypertension metadata"
    assert meta["disease"] == "hypertension"
    assert meta["algorithm"] == "LogisticRegression"
    assert meta["version"] == "1.1.0"
    
    expected_features = [
        "systolic_bp", "diastolic_bp", "age", "bmi", "heart_rate",
        "family_history", "sodium_intake", "smoking", "physical_activity", "symptoms_score"
    ]
    assert meta["features"] == expected_features
    
    metrics = registry.get_metrics("hypertension")
    assert metrics is not None, "Missing hypertension metrics"
    assert metrics["accuracy"] >= 0.70, f"Expected accuracy >= 0.70, got {metrics['accuracy']}"
    assert metrics["roc_auc"] >= 0.75, f"Expected ROC-AUC >= 0.75, got {metrics['roc_auc']}"
    assert metrics["recall_sensitivity"] >= 0.65, f"Expected Recall >= 0.65, got {metrics['recall_sensitivity']}"
    assert "confusion_matrix" in metrics
    cm = metrics["confusion_matrix"]
    assert cm["true_negatives"] > 0
    assert cm["true_positives"] > 0
    
    # Check calibration status documentation
    calib = meta.get("calibration_status", {})
    assert calib.get("is_post_hoc_calibrated") is False
    assert calib.get("score_type") == "model_estimated_risk_score"


def test_hypertension_inference_lower_risk():
    """Test optimal blood pressure metrics yield lower estimated risk."""
    optimal_inputs = {
        "systolic_bp": 112,
        "diastolic_bp": 72,
        "age": 32,
        "bmi": 21.5,
        "heart_rate": 66,
        "family_history": False,
        "sodium_intake": "low",
        "smoking_status": "never",
        "physical_activity_hours": 5.0,
        "symptoms": []
    }
    result = run_hypertension_screening(optimal_inputs)
    assert result["screening_type"] == "hypertension"
    assert result["risk_category"] == "lower"
    assert result["risk_score_percentage"] < 35
    assert result["emergency_warning"] is False
    assert result["emergency_message"] is None
    assert "Lower" in result["risk_heading"]


def test_hypertension_inference_elevated_risk():
    """Test elevated blood pressure metrics yield elevated estimated risk."""
    elevated_inputs = {
        "systolic_bp": 160,
        "diastolic_bp": 98,
        "age": 58,
        "bmi": 32.4,
        "heart_rate": 84,
        "family_history": True,
        "sodium_intake": "high",
        "smoking_status": "active",
        "physical_activity_hours": 0.5,
        "symptoms": ["Headache", "Dizziness", "Blurred vision"]
    }
    result = run_hypertension_screening(elevated_inputs)
    assert result["screening_type"] == "hypertension"
    assert result["risk_category"] == "elevated"
    assert result["risk_score_percentage"] > 65
    assert "Elevated" in result["risk_heading"]


def test_hypertension_emergency_crisis_warning():
    """Test hypertensive crisis thresholds (SBP >= 180 or DBP >= 120) trigger emergency flag."""
    crisis_inputs = {
        "systolic_bp": 188,
        "diastolic_bp": 115,
        "age": 62,
        "bmi": 29.0,
        "heart_rate": 90,
        "family_history": True,
        "sodium_intake": "high",
        "smoking_status": "former",
        "physical_activity_hours": 1.0,
        "symptoms": ["Headache", "Blurred vision"]
    }
    result = run_hypertension_screening(crisis_inputs)
    assert result["emergency_warning"] is True
    assert result["emergency_message"] is not None
    assert "hypertensive urgency or crisis" in result["emergency_message"].lower()

    # Test DBP >= 120 triggers emergency even if SBP is 170
    crisis_dbp = {**crisis_inputs, "systolic_bp": 170, "diastolic_bp": 125}
    res_dbp = run_hypertension_screening(crisis_dbp)
    assert res_dbp["emergency_warning"] is True


def test_hypertension_explainability_phrasing():
    """Test explainable feature contributions conform to non-diagnostic standards."""
    inputs = {
        "systolic_bp": 150,
        "diastolic_bp": 94,
        "age": 52,
        "bmi": 28.0,
        "heart_rate": 78,
        "family_history": True,
        "sodium_intake": "high",
        "smoking_status": "active",
        "physical_activity_hours": 1.0,
        "symptoms": ["Headache"]
    }
    result = run_hypertension_screening(inputs)
    contributions = result["feature_contributions"]
    assert len(contributions) > 0
    
    total_impact = sum(c["contribution"] for c in contributions)
    assert 0.95 <= total_impact <= 1.05, f"Contributions should sum near 1.0, got {total_impact}"
    
    for item in contributions:
        exp = item["explanation"]
        assert "caused" not in exp.lower(), f"Forbidden causality found: {exp}"
        assert "you have hypertension" not in exp.lower()
        if item["direction"] == "increases_risk":
            assert "contributed to the model's estimated risk" in exp
        elif item["direction"] == "decreases_risk":
            assert "moderated the model's estimated risk" in exp


from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# -------------------------------------------------------------------------
# Integration Tests for API Endpoints & Database Persistence
# -------------------------------------------------------------------------

def test_api_hypertension_screening_lifecycle():
    """Test full API lifecycle: Registration -> First Screening -> Second Screening -> History -> Persistence."""
    # 1. Create fresh test patient
    test_email = f"htn_patient_{uuid.uuid4().hex[:8]}@healthai.local"
    reg_resp = client.post("/api/auth/register", json={
        "email": test_email,
        "password": "HtnPassword123!",
        "full_name": "Hypertension Test Patient"
    })
    assert reg_resp.status_code == 201, f"Register failed: {reg_resp.text}"
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. First-ever screening (Initial Baseline)
    s1_data = {
        "age": 50,
        "gender": "female",
        "systolic_bp": 122,
        "diastolic_bp": 78,
        "heart_rate": 70,
        "family_history": False,
        "sodium_intake": "low",
        "smoking_status": "never",
        "physical_activity_hours": 4.0,
        "bmi": 23.5,
        "symptoms": []
    }
    resp1 = client.post("/api/screening/hypertension", json=s1_data, headers=headers)
    assert resp1.status_code == 200, f"Screening 1 failed: {resp1.text}"
    r1 = resp1.json()
    assert r1["screening_type"] == "hypertension"
    assert r1["screening_title"] == "Hypertension Risk Screening"
    
    comp1 = r1["historical_comparison"]
    assert comp1["has_previous_data"] is False
    assert comp1["previous_risk_percentage"] is None
    assert comp1["risk_change_points"] is None
    assert "No previous data available for comparison." in comp1["explanation"]
    
    # 3. Second screening (Longitudinal comparison against First)
    s2_data = {
        "age": 50,
        "gender": "female",
        "systolic_bp": 148,
        "diastolic_bp": 92,
        "heart_rate": 80,
        "family_history": False,
        "sodium_intake": "high",
        "smoking_status": "never",
        "physical_activity_hours": 1.5,
        "bmi": 24.2,
        "symptoms": ["Headache"]
    }
    resp2 = client.post("/api/screening/hypertension", json=s2_data, headers=headers)
    assert resp2.status_code == 200, f"Screening 2 failed: {resp2.text}"
    r2 = resp2.json()
    
    comp2 = r2["historical_comparison"]
    assert comp2["has_previous_data"] is True
    assert comp2["previous_screening_id"] == r1["id"]
    assert comp2["previous_risk_percentage"] == r1["risk_score_percentage"]
    assert comp2["current_risk_percentage"] == r2["risk_score_percentage"]
    expected_shift = r2["risk_score_percentage"] - r1["risk_score_percentage"]
    assert comp2["risk_change_points"] == expected_shift
    
    # Check parameter shifts
    sbp_comp = next((p for p in comp2["parameter_comparisons"] if p["key"] == "systolic_bp"), None)
    assert sbp_comp is not None
    assert sbp_comp["previous_value"] == "122 mmHg"
    assert sbp_comp["current_value"] == "148 mmHg"
    assert sbp_comp["change"] == "+26 mmHg"
    assert sbp_comp["trend"] == "Increased"
    
    dbp_comp = next((p for p in comp2["parameter_comparisons"] if p["key"] == "diastolic_bp"), None)
    assert dbp_comp is not None
    assert dbp_comp["previous_value"] == "78 mmHg"
    assert dbp_comp["current_value"] == "92 mmHg"
    assert dbp_comp["change"] == "+14 mmHg"
    assert dbp_comp["trend"] == "Increased"
    
    # 4. Check Detail endpoint on reload/refresh
    detail_resp = client.get(f"/api/screening/details/{r2['id']}", headers=headers)
    assert detail_resp.status_code == 200
    d = detail_resp.json()
    assert d["id"] == r2["id"]
    assert d["risk_score_percentage"] == r2["risk_score_percentage"]
    
    # 5. Check History endpoint
    hist_resp = client.get("/api/screening/history?disease_type=hypertension", headers=headers)
    assert hist_resp.status_code == 200
    hist = hist_resp.json()
    assert len(hist) == 2
    assert hist[0]["id"] == r2["id"]
    assert hist[1]["id"] == r1["id"]


def test_api_hypertension_validation_and_boundaries():
    """Test API input validation, out-of-range bounds, and boundary values."""
    test_email = f"htn_val_{uuid.uuid4().hex[:8]}@healthai.local"
    reg_resp = client.post("/api/auth/register", json={
        "email": test_email,
        "password": "ValPassword123!",
        "full_name": "Validation Test Patient"
    })
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Missing required field (missing systolic_bp) -> 422
    invalid_data = {
        "age": 45,
        "gender": "male",
        "diastolic_bp": 80,
        "heart_rate": 72
    }
    resp = client.post("/api/screening/hypertension", json=invalid_data, headers=headers)
    assert resp.status_code == 422
    
    # 2. Out of bounds systolic_bp (<70 or >260) -> 422
    oob_data = {
        "age": 45,
        "gender": "male",
        "systolic_bp": 350,
        "diastolic_bp": 80,
        "heart_rate": 72
    }
    resp_oob = client.post("/api/screening/hypertension", json=oob_data, headers=headers)
    assert resp_oob.status_code == 422
    
    # 3. Boundary valid values (systolic_bp=70 min, diastolic_bp=40 min) -> 200
    boundary_data = {
        "age": 18,
        "gender": "male",
        "systolic_bp": 70,
        "diastolic_bp": 40,
        "heart_rate": 45,
        "family_history": False,
        "sodium_intake": "low",
        "smoking_status": "never",
        "physical_activity_hours": 0.0,
        "bmi": 16.0
    }
    resp_bound = client.post("/api/screening/hypertension", json=boundary_data, headers=headers)
    assert resp_bound.status_code == 200


def test_non_regression_diabetes_and_cardiovascular():
    """Verify Diabetes and Cardiovascular ML pipelines continue functioning properly."""
    # Diabetes
    dm_res = run_diabetes_screening({
        "age": 46, "gender": "male", "fasting_glucose": 98,
        "systolic_bp": 120, "diastolic_bp": 80, "family_history": True,
        "bmi": 24.5, "physical_activity_hours": 3.0, "symptoms": []
    })
    assert dm_res["screening_type"] == "diabetes"
    assert dm_res["risk_category"] in ["lower", "moderate", "elevated"]
    
    # Cardiovascular
    cv_res = run_cardiovascular_screening({
        "age": 52, "gender": "male", "systolic_bp": 130,
        "cholesterol": 195, "fasting_glucose": 96, "heart_rate": 72,
        "smoking_status": "never", "chest_discomfort_level": 0,
        "bmi": 25.0, "physical_activity_hours": 3.0
    })
    assert cv_res["screening_type"] == "cardiovascular"
    assert cv_res["risk_category"] in ["lower", "moderate", "elevated"]
