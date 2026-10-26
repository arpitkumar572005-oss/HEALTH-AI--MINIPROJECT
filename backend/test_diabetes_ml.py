"""
Tests for Phase 3: Diabetes ML Pipeline & Health Screening Integration
"""

import pytest
import os
import json
import joblib
from fastapi.testclient import TestClient
from app.main import app
from app.ml.inference_service import registry, run_diabetes_screening

client = TestClient(app)

def get_auth_token():
    res = client.post("/api/auth/demo-login", json={"role": "patient"})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_diabetes_model_artifacts_exist():
    """Verify saved model, preprocessor pipeline, metadata, and evaluation metrics exist."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_dir = os.path.join(base_dir, "app", "ml", "saved_models", "diabetes")
    
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

def test_diabetes_model_registry_loaded():
    """Verify registry loaded the diabetes model in memory."""
    model = registry.get_model("diabetes")
    meta = registry.get_metadata("diabetes")
    assert model is not None, "Diabetes model not loaded in registry"
    assert meta.get("disease") == "diabetes"
    assert "features" in meta
    assert len(meta["features"]) == 9

def test_diabetes_inference_service_direct():
    """Test inference service output structure and explainability."""
    test_input = {
        "age": 48,
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
    result = run_diabetes_screening(test_input)
    assert result["screening_type"] == "diabetes"
    assert "risk_score" in result
    assert 0.0 <= result["risk_score"] <= 1.0
    assert result["risk_category"] in ["lower", "moderate", "elevated"]
    assert len(result["feature_contributions"]) > 0
    
    # Explainability check: no causative diagnostic assertions
    for fc in result["feature_contributions"]:
        assert "cause" not in fc["explanation"].lower()
        assert "has diabetes" not in fc["explanation"].lower()

def test_diabetes_api_prediction_endpoint():
    """Test full authenticated POST /api/screening/diabetes."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "age": 52,
        "gender": "female",
        "height_cm": 165,
        "weight_kg": 68.0,
        "fasting_glucose": 92.0,
        "systolic_bp": 118,
        "diastolic_bp": 76,
        "family_history": False,
        "physical_activity_hours": 4.0,
        "symptoms": []
    }
    
    res = client.post("/api/screening/diabetes", json=payload, headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    
    assert data["screening_type"] == "diabetes"
    assert data["screening_title"] == "Diabetes Risk Screening"
    assert "risk_score_percentage" in data
    assert 0 <= data["risk_score_percentage"] <= 100
    assert data["risk_category"] in ["lower", "moderate", "elevated"]
    assert "feature_contributions" in data
    assert len(data["feature_contributions"]) > 0
    assert "medical_disclaimer" in data
    assert "id" in data

def test_diabetes_api_elevated_risk_input():
    """Verify elevated risk detection for high fasting glucose and high BMI."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "age": 60,
        "gender": "male",
        "height_cm": 170,
        "weight_kg": 95.0, # High BMI ~32.9
        "fasting_glucose": 145.0, # Elevated fasting glucose
        "systolic_bp": 145,
        "diastolic_bp": 92,
        "family_history": True,
        "physical_activity_hours": 0.5,
        "symptoms": ["Frequent urination", "Excessive thirst"]
    }
    
    res = client.post("/api/screening/diabetes", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["risk_category"] in ["moderate", "elevated"]
    assert data["risk_score_percentage"] > 40
    
    # Verify fasting glucose is ranked as a top contributing risk factor
    top_feature = data["feature_contributions"][0]
    assert top_feature["feature"] in ["fasting_glucose", "bmi", "age"]

def test_diabetes_api_validation_rejection():
    """Verify input validation rejects out-of-bounds or missing data."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Missing required fasting_glucose
    bad_payload_missing = {
        "age": 45,
        "gender": "male",
        "systolic_bp": 120,
        "diastolic_bp": 80
    }
    res1 = client.post("/api/screening/diabetes", json=bad_payload_missing, headers=headers)
    assert res1.status_code == 422
    
    # Out of range fasting_glucose (< 40 mg/dL)
    bad_payload_range = {
        "age": 45,
        "gender": "male",
        "fasting_glucose": 20,
        "systolic_bp": 120,
        "diastolic_bp": 80
    }
    res2 = client.post("/api/screening/diabetes", json=bad_payload_range, headers=headers)
    assert res2.status_code == 422

    # Out of range age (< 18)
    bad_payload_age = {
        "age": 10,
        "gender": "male",
        "fasting_glucose": 95,
        "systolic_bp": 120,
        "diastolic_bp": 80
    }
    res3 = client.post("/api/screening/diabetes", json=bad_payload_age, headers=headers)
    assert res3.status_code == 422
