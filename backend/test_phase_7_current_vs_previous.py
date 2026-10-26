"""
Phase 7 Automated Verification Test Suite
=========================================
Tests the Automatic Current vs Previous Health Screening Workflow:
1. First Diabetes Screening: Baseline detection, zero fabricated data.
2. Second Diabetes Screening: Automatic retrieval, percentage points diff, parameter shift deltas.
3. Disease Isolation (Cardiovascular vs Diabetes): First Cardio screening does NOT link to Diabetes.
4. Second Cardiovascular Screening: Compares exclusively to previous Cardio screening.
5. First Hypertension Screening: Baseline detection.
6. Second Hypertension Screening: Compares exclusively to previous Hypertension screening.
7. First Symptom Screening: Baseline symptom analysis.
8. Second Symptom Screening: Evaluates new, continuing, and resolved symptoms.
9. Immutability: Previous screening records and database IDs remain strictly unchanged.
10. Non-Diagnostic Safe Terminology: Explanations use 'coincided with', 'percentage points', no 'cured'.
11. Screening History Chronology: Descending order (newest first).
12. Health Trends Integration: Measurements from both screenings tracked, trend trajectory computed.
13. Dashboard Overview Dynamic Update: Reflects latest screening and current vitals.
"""

import uuid
import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database.session import Base, get_db
from app.main import app
from app.models.entities import User, PatientProfile, Screening, HealthMeasurement
from app.services.auth_service import create_access_token
from app.services.patient_history_service import (
    get_screening_history,
    get_health_trends,
    get_dashboard_overview
)

from sqlalchemy.pool import StaticPool
from app.services.auth_service import create_access_token, get_current_user

# Test in-memory SQLite DB with StaticPool so all connections share the same memory DB
TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def test_setup():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()

    # Create isolated test user
    uid = str(uuid.uuid4())
    user = User(
        id=uid,
        email=f"patient_{uid[:8]}@healthai.local",
        hashed_password="hashed_pw_test",
        full_name="Marcus Vance",
        role="patient",
        is_demo=False
    )
    session.add(user)

    profile = PatientProfile(
        id=str(uuid.uuid4()),
        user_id=user.id,
        age=54,
        gender="male",
        height_cm=178.0,
        weight_kg=84.0,
        bmi=26.5,
        smoking_status="never",
        alcohol_consumption="none",
        physical_activity_hours=3.0,
        family_history_diabetes=True,
        family_history_hypertension=False,
        family_history_cardiovascular=True
    )
    session.add(profile)
    session.commit()

    token = create_access_token({"sub": user.id})
    headers = {"Authorization": f"Bearer {token}"}

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: user
    client = TestClient(app)

    yield {
        "user": user,
        "session": session,
        "SessionLocal": TestingSessionLocal,
        "client": client,
        "headers": headers
    }

    session.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


# ==============================================================================
# TEST 1: First Diabetes Screening (Baseline)
# ==============================================================================
def test_first_diabetes_screening_baseline(test_setup):
    client = test_setup["client"]
    headers = test_setup["headers"]

    first_input = {
        "age": 54,
        "gender": "male",
        "height_cm": 178,
        "weight_kg": 84,
        "fasting_glucose": 138,
        "systolic_bp": 132,
        "diastolic_bp": 84,
        "physical_activity_hours": 2.0,
        "family_history": True,
        "smoking_status": "never",
        "alcohol_consumption": "none"
    }

    res = client.post("/api/screening/diabetes", json=first_input, headers=headers)
    assert res.status_code == 200, f"Screening failed: {res.text}"
    data = res.json()

    assert data["screening_type"] == "diabetes"
    comp = data["historical_comparison"]
    assert comp is not None
    assert comp["has_previous_data"] is False
    assert comp["previous_screening_id"] is None
    assert comp["previous_date"] is None
    assert comp["previous_risk_percentage"] is None
    assert comp["risk_change_points"] is None
    assert "Baseline screening — no previous Diabetes screening available for comparison." in comp["explanation"]
    assert "No previous data available for comparison." in comp["explanation"]

    # Parameter comparisons must all reflect baseline without fabricated previous values
    for p in comp["parameter_comparisons"]:
        assert p["has_previous"] is False
        assert p["previous_value"] is None
        assert p["change"] == "No previous data available for comparison."


# ==============================================================================
# TEST 2: Second Diabetes Screening (Automatic Comparison)
# ==============================================================================
def test_second_diabetes_screening_automatic_comparison(test_setup):
    client = test_setup["client"]
    headers = test_setup["headers"]

    first_input = {
        "age": 54,
        "gender": "male",
        "height_cm": 178,
        "weight_kg": 88,
        "fasting_glucose": 145,
        "systolic_bp": 136,
        "diastolic_bp": 86,
        "physical_activity_hours": 1.5,
        "family_history": True,
        "smoking_status": "never"
    }
    res1 = client.post("/api/screening/diabetes", json=first_input, headers=headers)
    assert res1.status_code == 200
    rec1 = res1.json()

    # Second screening: improved glucose and physical activity
    second_input = {
        "age": 54,
        "gender": "male",
        "height_cm": 178,
        "weight_kg": 82,
        "fasting_glucose": 105,
        "systolic_bp": 122,
        "diastolic_bp": 80,
        "physical_activity_hours": 4.5,
        "family_history": True,
        "smoking_status": "never"
    }
    res2 = client.post("/api/screening/diabetes", json=second_input, headers=headers)
    assert res2.status_code == 200
    rec2 = res2.json()

    comp2 = rec2["historical_comparison"]
    assert comp2 is not None
    assert comp2["has_previous_data"] is True
    assert comp2["previous_screening_id"] == rec1["id"]
    assert comp2["previous_risk_percentage"] == rec1["risk_score_percentage"]
    assert comp2["current_risk_percentage"] == rec2["risk_score_percentage"]

    # Risk difference must strictly equal current_pct - prev_pct in percentage points
    expected_points = rec2["risk_score_percentage"] - rec1["risk_score_percentage"]
    assert comp2["risk_change_points"] == expected_points
    assert comp2["risk_trend"] in ["Decreased", "Increased", "Stable"]

    # Check parameter comparisons
    glucose_comp = next((p for p in comp2["parameter_comparisons"] if p["key"] == "fasting_glucose"), None)
    assert glucose_comp is not None
    assert glucose_comp["has_previous"] is True
    assert glucose_comp["previous_value"] == "145 mg/dL"
    assert glucose_comp["current_value"] == "105 mg/dL"
    assert glucose_comp["change"] == "-40 mg/dL"
    assert glucose_comp["trend"] == "Decreased"


# ==============================================================================
# TEST 3: Disease Isolation (Cardio vs Diabetes)
# ==============================================================================
def test_disease_isolation_cardio_vs_diabetes(test_setup):
    client = test_setup["client"]
    headers = test_setup["headers"]

    # Perform Diabetes screening first
    diabetes_input = {
        "age": 54,
        "gender": "male",
        "fasting_glucose": 140,
        "systolic_bp": 130,
        "diastolic_bp": 82,
        "physical_activity_hours": 2.0
    }
    res_d = client.post("/api/screening/diabetes", json=diabetes_input, headers=headers)
    assert res_d.status_code == 200

    # First Cardiovascular screening must NOT compare to the previous Diabetes screening!
    cardio_input = {
        "age": 54,
        "gender": "male",
        "systolic_bp": 125,
        "cholesterol": 195,
        "fasting_glucose": 100,
        "heart_rate": 72,
        "smoking_status": "never",
        "chest_discomfort_level": 0,
        "bmi": 24.5,
        "physical_activity_hours": 3.0
    }
    res_c = client.post("/api/screening/cardiovascular", json=cardio_input, headers=headers)
    assert res_c.status_code == 200
    rec_c = res_c.json()

    comp_c = rec_c["historical_comparison"]
    assert comp_c["has_previous_data"] is False, "Cardiovascular screening must NOT link to previous Diabetes screening"
    assert comp_c["previous_screening_id"] is None
    assert "Baseline screening — no previous Cardiovascular screening available for comparison." in comp_c["explanation"]


# ==============================================================================
# TEST 4: Second Cardiovascular Screening
# ==============================================================================
def test_second_cardiovascular_screening_compares_only_to_cardio(test_setup):
    client = test_setup["client"]
    headers = test_setup["headers"]

    # First cardio
    c1_input = {
        "age": 54,
        "gender": "male",
        "systolic_bp": 150,
        "cholesterol": 240,
        "fasting_glucose": 115,
        "heart_rate": 80,
        "smoking_status": "active",
        "chest_discomfort_level": 1,
        "bmi": 28.0,
        "physical_activity_hours": 1.5
    }
    res_c1 = client.post("/api/screening/cardiovascular", json=c1_input, headers=headers)
    assert res_c1.status_code == 200
    rec_c1 = res_c1.json()

    # Second cardio
    c2_input = {
        "age": 54,
        "gender": "male",
        "systolic_bp": 128,
        "cholesterol": 190,
        "fasting_glucose": 98,
        "heart_rate": 72,
        "smoking_status": "former",
        "chest_discomfort_level": 0,
        "bmi": 26.0,
        "physical_activity_hours": 3.5
    }
    res_c2 = client.post("/api/screening/cardiovascular", json=c2_input, headers=headers)
    assert res_c2.status_code == 200
    rec_c2 = res_c2.json()

    comp_c2 = rec_c2["historical_comparison"]
    assert comp_c2["has_previous_data"] is True
    assert comp_c2["previous_screening_id"] == rec_c1["id"]
    assert comp_c2["previous_risk_percentage"] == rec_c1["risk_score_percentage"]
    assert comp_c2["risk_change_points"] == rec_c2["risk_score_percentage"] - rec_c1["risk_score_percentage"]

    # Parameter comparison for cholesterol
    chol_comp = next((p for p in comp_c2["parameter_comparisons"] if p["key"] == "cholesterol"), None)
    assert chol_comp is not None
    assert chol_comp["has_previous"] is True
    assert chol_comp["previous_value"] == "240 mg/dL"
    assert chol_comp["current_value"] == "190 mg/dL"
    assert chol_comp["change"] == "-50 mg/dL"


# ==============================================================================
# TEST 5: First Hypertension Screening (Baseline)
# ==============================================================================
def test_first_hypertension_screening_baseline(test_setup):
    client = test_setup["client"]
    headers = test_setup["headers"]

    htn_input = {
        "age": 54,
        "gender": "male",
        "systolic_bp": 142,
        "diastolic_bp": 92,
        "heart_rate": 78,
        "bmi": 26.5,
        "physical_activity_hours": 2.5,
        "smoking_status": "never",
        "alcohol_consumption": "none",
        "sodium_intake": "moderate"
    }
    res = client.post("/api/screening/hypertension", json=htn_input, headers=headers)
    assert res.status_code == 200
    rec = res.json()

    comp = rec["historical_comparison"]
    assert comp["has_previous_data"] is False
    assert "Baseline screening — no previous Hypertension screening available for comparison." in comp["explanation"]


# ==============================================================================
# TEST 6: Second Hypertension Screening
# ==============================================================================
def test_second_hypertension_screening(test_setup):
    client = test_setup["client"]
    headers = test_setup["headers"]

    htn1_input = {
        "age": 54,
        "gender": "male",
        "systolic_bp": 155,
        "diastolic_bp": 98,
        "heart_rate": 82,
        "bmi": 27.5,
        "physical_activity_hours": 1.0,
        "sodium_intake": "high"
    }
    res1 = client.post("/api/screening/hypertension", json=htn1_input, headers=headers)
    rec1 = res1.json()

    htn2_input = {
        "age": 54,
        "gender": "male",
        "systolic_bp": 128,
        "diastolic_bp": 82,
        "heart_rate": 74,
        "bmi": 26.0,
        "physical_activity_hours": 4.0,
        "sodium_intake": "low"
    }
    res2 = client.post("/api/screening/hypertension", json=htn2_input, headers=headers)
    rec2 = res2.json()

    comp = rec2["historical_comparison"]
    assert comp["has_previous_data"] is True
    assert comp["previous_screening_id"] == rec1["id"]
    assert comp["risk_change_points"] == rec2["risk_score_percentage"] - rec1["risk_score_percentage"]

    sbp_comp = next((p for p in comp["parameter_comparisons"] if p["key"] == "systolic_bp"), None)
    assert sbp_comp["has_previous"] is True
    assert sbp_comp["previous_value"] == "155 mmHg"
    assert sbp_comp["current_value"] == "128 mmHg"
    assert sbp_comp["change"] == "-27 mmHg"
    assert sbp_comp["trend"] == "Decreased"


# ==============================================================================
# TEST 7: First Symptom Screening (Baseline)
# ==============================================================================
def test_first_symptom_screening_baseline(test_setup):
    client = test_setup["client"]
    headers = test_setup["headers"]

    sym_input = {
        "symptoms": ["Excessive thirst", "Frequent urination"],
        "duration": "weeks",
        "severity": "mild",
        "onset": "gradual",
        "description": "Noticeable dry mouth after meals."
    }
    res = client.post("/api/screening/symptoms", json=sym_input, headers=headers)
    assert res.status_code == 200
    rec = res.json()

    assert rec["screening_type"] == "symptom_risk"
    comp = rec["historical_comparison"]
    assert comp["has_previous_data"] is False
    assert "Baseline screening — no previous Symptom Risk screening available for comparison." in comp["explanation"]


# ==============================================================================
# TEST 8: Second Symptom Screening (Progression Analysis)
# ==============================================================================
def test_second_symptom_screening_progression(test_setup):
    client = test_setup["client"]
    headers = test_setup["headers"]

    sym1_input = {
        "symptoms": ["Fatigue", "Frequent urination"],
        "duration": "weeks",
        "severity": "moderate",
        "onset": "gradual"
    }
    res1 = client.post("/api/screening/symptoms", json=sym1_input, headers=headers)
    assert res1.status_code == 200

    # Second symptom screening: Fatigue resolved, Frequent urination continuing, Dizziness new
    sym2_input = {
        "symptoms": ["Frequent urination", "Dizziness"],
        "duration": "days",
        "severity": "mild",
        "onset": "sudden"
    }
    res2 = client.post("/api/screening/symptoms", json=sym2_input, headers=headers)
    assert res2.status_code == 200
    rec2 = res2.json()

    prog = rec2.get("symptom_progression")
    assert prog is not None
    assert prog["has_previous_history"] is True
    assert "Dizziness" in prog["new_symptoms"]
    assert "Frequent urination" in prog["continuing_symptoms"]
    assert "Fatigue" in prog["resolved_symptoms"]


# ==============================================================================
# TEST 9: Immutability of Previous Records
# ==============================================================================
def test_immutability_of_previous_records(test_setup):
    client = test_setup["client"]
    session = test_setup["session"]
    headers = test_setup["headers"]

    input1 = {
        "age": 54,
        "gender": "male",
        "fasting_glucose": 130,
        "systolic_bp": 130,
        "diastolic_bp": 82,
        "physical_activity_hours": 2.0
    }
    res1 = client.post("/api/screening/diabetes", json=input1, headers=headers)
    rec1 = res1.json()
    id1 = rec1["id"]

    # Fetch directly from database
    db_rec1_before = session.query(Screening).filter(Screening.id == id1).one()
    created_at_before = db_rec1_before.created_at
    risk_score_before = db_rec1_before.risk_score
    input_data_before = dict(db_rec1_before.input_data)

    # Submit second screening
    input2 = {
        "age": 54,
        "gender": "male",
        "fasting_glucose": 95,
        "systolic_bp": 120,
        "diastolic_bp": 80,
        "physical_activity_hours": 4.0
    }
    res2 = client.post("/api/screening/diabetes", json=input2, headers=headers)
    rec2 = res2.json()
    id2 = rec2["id"]
    assert id1 != id2, "New screening must have a distinct new record ID"

    # Verify first record in DB is 100% unaltered
    session.expire_all()
    db_rec1_after = session.query(Screening).filter(Screening.id == id1).one()
    assert db_rec1_after.created_at == created_at_before
    assert db_rec1_after.risk_score == risk_score_before
    assert db_rec1_after.input_data == input_data_before
    assert db_rec1_after.id == id1


# ==============================================================================
# TEST 10: Non-Diagnostic Terminology & Safe Phrasing
# ==============================================================================
def test_non_diagnostic_terminology_and_safe_phrasing(test_setup):
    client = test_setup["client"]
    headers = test_setup["headers"]

    # Initial high-risk screening
    c1 = client.post("/api/screening/cardiovascular", json={
        "age": 54, "gender": "male", "systolic_bp": 160, "cholesterol": 270,
        "fasting_glucose": 135, "heart_rate": 88, "smoking_status": "active",
        "chest_discomfort_level": 2, "bmi": 29.0, "physical_activity_hours": 1.0
    }, headers=headers).json()

    # Second improved screening
    c2 = client.post("/api/screening/cardiovascular", json={
        "age": 54, "gender": "male", "systolic_bp": 122, "cholesterol": 180,
        "fasting_glucose": 92, "heart_rate": 70, "smoking_status": "former",
        "chest_discomfort_level": 0, "bmi": 25.5, "physical_activity_hours": 4.0
    }, headers=headers).json()

    explanation = c2["historical_comparison"]["explanation"]

    # Must contain required safe phrasing
    assert "percentage points" in explanation
    assert "coincided with a change in the model's estimated risk" in explanation
    assert "not a medical diagnosis" in explanation

    # Must NEVER contain forbidden diagnostic claims
    forbidden = ["cured", "no longer have", "completely healthy", "free from disease"]
    for word in forbidden:
        assert word not in explanation.lower(), f"Forbidden diagnostic word '{word}' found in explanation!"


# ==============================================================================
# TEST 11: Screening History Chronology (Newest First)
# ==============================================================================
def test_screening_history_chronology(test_setup):
    client = test_setup["client"]
    headers = test_setup["headers"]
    SessionLocal = test_setup["SessionLocal"]
    user = test_setup["user"]

    valid_d1 = {
        "age": 54, "gender": "male", "height_cm": 178, "weight_kg": 84,
        "fasting_glucose": 130, "systolic_bp": 135, "diastolic_bp": 85,
        "physical_activity_hours": 2.0
    }
    valid_d2 = {
        "age": 54, "gender": "male", "height_cm": 178, "weight_kg": 83,
        "fasting_glucose": 120, "systolic_bp": 128, "diastolic_bp": 82,
        "physical_activity_hours": 3.0
    }
    valid_d3 = {
        "age": 54, "gender": "male", "height_cm": 178, "weight_kg": 81,
        "fasting_glucose": 105, "systolic_bp": 122, "diastolic_bp": 80,
        "physical_activity_hours": 4.0
    }

    # Submit 3 screenings in sequence
    r1 = client.post("/api/screening/diabetes", json=valid_d1, headers=headers).json()
    r2 = client.post("/api/screening/diabetes", json=valid_d2, headers=headers).json()
    r3 = client.post("/api/screening/diabetes", json=valid_d3, headers=headers).json()

    # Query via API endpoint
    res = client.get("/api/screening/history?disease_type=diabetes", headers=headers)
    assert res.status_code == 200
    api_history = res.json()
    assert len(api_history) >= 3
    assert api_history[0]["id"] == r3["id"]
    assert api_history[1]["id"] == r2["id"]
    assert api_history[2]["id"] == r1["id"]

    # Query via service function directly
    with SessionLocal() as db:
        service_history = get_screening_history(user.id, db, screening_type="diabetes")
        assert len(service_history) >= 3
        assert service_history[0]["id"] == r3["id"]
        assert service_history[1]["id"] == r2["id"]
        assert service_history[2]["id"] == r1["id"]


# ==============================================================================
# TEST 12: Health Trends Integration
# ==============================================================================
def test_health_trends_integration(test_setup):
    client = test_setup["client"]
    headers = test_setup["headers"]
    SessionLocal = test_setup["SessionLocal"]
    user = test_setup["user"]

    d1 = {
        "age": 54, "gender": "male", "height_cm": 178, "weight_kg": 84,
        "fasting_glucose": 140, "systolic_bp": 135, "diastolic_bp": 85
    }
    d2 = {
        "age": 54, "gender": "male", "height_cm": 178, "weight_kg": 82,
        "fasting_glucose": 110, "systolic_bp": 125, "diastolic_bp": 80
    }

    # Screening 1 logs blood_glucose and systolic_bp
    res1 = client.post("/api/screening/diabetes", json=d1, headers=headers)
    assert res1.status_code == 200

    # Screening 2 logs another point
    res2 = client.post("/api/screening/diabetes", json=d2, headers=headers)
    assert res2.status_code == 200

    # Query via API endpoint
    res = client.get("/api/health/trends?timeframe=30d", headers=headers)
    assert res.status_code == 200
    trends = res.json()
    glucose_trend = trends["metric_details"].get("blood_glucose")
    assert glucose_trend is not None
    assert glucose_trend["count"] >= 2
    assert glucose_trend["has_sufficient_data"] is True
    assert glucose_trend["latest"]["value"] == 110.0

    # Query via service function directly
    with SessionLocal() as db:
        svc_trends = get_health_trends(user.id, db, timeframe="30d")
        svc_glucose = svc_trends["metric_details"].get("blood_glucose")
        assert svc_glucose is not None
        assert svc_glucose["count"] >= 2
        assert svc_glucose["has_sufficient_data"] is True
        assert svc_glucose["latest"]["value"] == 110.0


# ==============================================================================
# TEST 13: Dashboard Overview Integration
# ==============================================================================
def test_dashboard_overview_integration(test_setup):
    client = test_setup["client"]
    headers = test_setup["headers"]
    SessionLocal = test_setup["SessionLocal"]
    user = test_setup["user"]

    htn_data = {
        "age": 54, "gender": "male", "height_cm": 178, "weight_kg": 84,
        "systolic_bp": 145, "diastolic_bp": 94, "heart_rate": 80,
        "sodium_intake": "moderate"
    }

    # Submit screening
    res = client.post("/api/screening/hypertension", json=htn_data, headers=headers)
    assert res.status_code == 200

    # Query via API endpoint for dashboard overview
    res = client.get("/api/health/dashboard-overview?timeframe=30d", headers=headers)
    assert res.status_code == 200
    dashboard = res.json()
    screenings_summary = dashboard.get("screenings_summary", {})
    assert "hypertension" in screenings_summary
    assert screenings_summary["hypertension"]["latest"] is not None
    assert screenings_summary["hypertension"]["latest"]["risk_score"] is not None

    vitals = dashboard.get("latest_measurements", {})
    assert vitals.get("systolic_bp", {}).get("value") == 145.0
    assert vitals.get("diastolic_bp", {}).get("value") == 94.0

    # Query via API endpoint for patient summary snapshot
    res_summary = client.get("/api/health/summary", headers=headers)
    assert res_summary.status_code == 200
    summary = res_summary.json()
    assert "hypertension" in summary.get("latest_screenings", {})

    # Query via service function directly
    with SessionLocal() as db:
        svc_dash = get_dashboard_overview(user.id, db, timeframe="30d")
        svc_screenings = svc_dash.get("screenings_summary", {})
        assert "hypertension" in svc_screenings
        assert svc_dash["latest_measurements"]["systolic_bp"]["value"] == 145.0
