"""
Tests for Phase 4: Cardiovascular Disease ML Pipeline & Health Screening Integration
"""

import pytest
import os
import json
import joblib
from fastapi.testclient import TestClient
from app.main import app
from app.ml.inference_service import registry, run_cardiovascular_screening, run_diabetes_screening

client = TestClient(app)

def get_auth_token():
    res = client.post("/api/auth/demo-login", json={"role": "patient"})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_cardiovascular_model_artifacts_exist():
    """Verify saved model, preprocessor pipeline, metadata, and evaluation metrics exist."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_dir = os.path.join(base_dir, "app", "ml", "saved_models", "cardiovascular")
    
    assert os.path.exists(os.path.join(model_dir, "model.joblib")), "model.joblib missing"
    assert os.path.exists(os.path.join(model_dir, "metadata.json")), "metadata.json missing"
    assert os.path.exists(os.path.join(model_dir, "metrics.json")), "metrics.json missing"
    
    # Check pipeline steps
    pipe = joblib.load(os.path.join(model_dir, "model.joblib"))
    assert "scaler" in pipe.named_steps, "StandardScaler step missing from pipeline"
    assert "classifier" in pipe.named_steps, "Classifier step missing from pipeline"
    
    # Check evaluation metrics are populated
    with open(os.path.join(model_dir, "metrics.json")) as f:
        metrics = json.load(f)
    assert "accuracy" in metrics
    assert "recall_sensitivity" in metrics
    assert "roc_auc" in metrics
    assert "confusion_matrix" in metrics
    assert metrics["accuracy"] > 0.5
    assert metrics["roc_auc"] > 0.7

def test_cardiovascular_model_registry_loaded():
    """Verify registry loaded the cardiovascular model in memory."""
    model = registry.get_model("cardiovascular")
    meta = registry.get_metadata("cardiovascular")
    assert model is not None, "Cardiovascular model not loaded in registry"
    assert meta.get("disease") == "cardiovascular"
    assert "features" in meta
    assert len(meta["features"]) == 10

def test_cardiovascular_inference_service_direct():
    """Test inference service output structure, calibrated probabilities, and explainability."""
    test_input = {
        "age": 45,
        "gender": "male",
        "height_cm": 175,
        "weight_kg": 77.5,
        "systolic_bp": 122,
        "cholesterol": 188.0,
        "fasting_glucose": 98.0,
        "heart_rate": 72,
        "smoking_status": "never",
        "chest_discomfort_level": 0,
        "physical_activity_hours": 3.5,
        "symptoms": []
    }
    result = run_cardiovascular_screening(test_input)
    assert result["screening_type"] == "cardiovascular"
    assert "risk_score" in result
    assert 0.0 <= result["risk_score"] <= 1.0
    assert result["risk_category"] in ["lower", "moderate", "elevated"]
    assert len(result["feature_contributions"]) == 10
    
    # Explainability check: no causative diagnostic assertions
    for fc in result["feature_contributions"]:
        assert "cause" not in fc["explanation"].lower()
        assert "has heart disease" not in fc["explanation"].lower()

def test_cardiovascular_api_prediction_endpoint():
    """Test full authenticated POST /api/screening/cardiovascular."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "age": 42,
        "gender": "female",
        "height_cm": 168,
        "weight_kg": 64.0,
        "systolic_bp": 116,
        "cholesterol": 175.0,
        "fasting_glucose": 90.0,
        "heart_rate": 68,
        "smoking_status": "never",
        "chest_discomfort_level": 0,
        "physical_activity_hours": 4.0,
        "symptoms": []
    }
    
    res = client.post("/api/screening/cardiovascular", json=payload, headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    
    assert data["screening_type"] == "cardiovascular"
    assert data["screening_title"] == "Cardiovascular Risk Screening"
    assert "risk_score_percentage" in data
    assert 0 <= data["risk_score_percentage"] <= 100
    assert data["risk_category"] in ["lower", "moderate", "elevated"]
    assert "feature_contributions" in data
    assert len(data["feature_contributions"]) == 10
    assert "medical_disclaimer" in data
    assert "id" in data

def test_cardiovascular_api_elevated_risk_input():
    """Verify elevated risk detection for high cholesterol, smoking, and exertional discomfort."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "age": 66,
        "gender": "male",
        "height_cm": 172,
        "weight_kg": 94.0,
        "systolic_bp": 158,
        "cholesterol": 275.0, # High total cholesterol
        "fasting_glucose": 130.0, # High fasting glucose
        "heart_rate": 88,
        "smoking_status": "active", # Active smoker
        "chest_discomfort_level": 2, # Moderate exertional discomfort
        "physical_activity_hours": 0.5,
        "symptoms": ["Shortness of breath", "Chest discomfort"]
    }
    
    res = client.post("/api/screening/cardiovascular", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["risk_category"] in ["moderate", "elevated"]
    assert data["risk_score_percentage"] > 50
    assert data["emergency_warning"] is True # Triggered by chest discomfort level 2
    
    # Verify top contributing factors
    top_feature_names = [fc["feature"] for fc in data["feature_contributions"][:3]]
    assert any(f in top_feature_names for f in ["cholesterol", "chest_discomfort", "smoking", "systolic_bp", "age"])

def test_cardiovascular_api_validation_rejection():
    """Verify input validation rejects out-of-bounds or missing data."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Missing required systolic_bp and cholesterol
    bad_payload_missing = {
        "age": 50,
        "gender": "male",
        "heart_rate": 72
    }
    res1 = client.post("/api/screening/cardiovascular", json=bad_payload_missing, headers=headers)
    assert res1.status_code == 422
    
    # Out of range cholesterol (< 90 mg/dL)
    bad_payload_range = {
        "age": 50,
        "gender": "male",
        "systolic_bp": 120,
        "cholesterol": 40.0,
        "heart_rate": 72
    }
    res2 = client.post("/api/screening/cardiovascular", json=bad_payload_range, headers=headers)
    assert res2.status_code == 422

def test_diabetes_phase3_regression_preservation():
    """MANDATORY REGRESSION TEST: Verify Phase 3 Diabetes screening still works independently."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    diabetes_payload = {
        "age": 45,
        "gender": "male",
        "height_cm": 175,
        "weight_kg": 77.5,
        "fasting_glucose": 98.0,
        "systolic_bp": 122,
        "diastolic_bp": 80,
        "family_history": True,
        "physical_activity_hours": 3.5,
        "symptoms": []
    }
    res = client.post("/api/screening/diabetes", json=diabetes_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["screening_type"] == "diabetes"
    assert data["screening_title"] == "Diabetes Risk Screening"
    assert 0 <= data["risk_score_percentage"] <= 100
    assert "feature_contributions" in data
