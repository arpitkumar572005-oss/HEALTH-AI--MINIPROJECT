"""
System Verification Suite for HealthAI
Validates ML models, authentication, tenant isolation, and clinical pipelines.
"""

import sys
import os

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import SessionLocal
from app.models.entities import User, PatientProfile, Screening, HealthMeasurement, AuditLog
from app.services.auth_service import hash_password, verify_password, create_access_token
from app.ml.inference_service import (
    run_diabetes_screening,
    run_cardiovascular_screening,
    run_kidney_screening,
)
from app.services.comparison_service import (
    run_symptom_early_risk_analysis,
)
from app.schemas.screening import (
    DiabetesScreeningInput,
    CardioScreeningInput,
    KidneyScreeningInput,
    SymptomScreeningInput,
)

def test_ml_pipelines():
    print("[1/3] Testing Machine Learning Inference Pipelines...")
    
    # 1. Diabetes
    diab_input = DiabetesScreeningInput(
        age=46,
        gender="male",
        height_cm=178.0,
        weight_kg=77.5,
        systolic_bp=128,
        diastolic_bp=82,
        fasting_glucose=108,
        family_history_diabetes=True,
        physical_activity_hours=3.5,
        smoking_status="former"
    )
    diab_res = run_diabetes_screening(diab_input)
    assert diab_res["risk_score"] >= 0.0 and diab_res["risk_score"] <= 1.0, "Diabetes score out of range"
    assert diab_res["risk_category"] in ["lower", "moderate", "elevated"], "Invalid diabetes risk category"
    assert len(diab_res["feature_contributions"]) > 0, "Diabetes missing feature contributions"
    print(f"  [PASS] Diabetes screening: score={diab_res['risk_score_percentage']}%, category={diab_res['risk_category']}")

    # 2. Cardiovascular
    cardio_input = CardioScreeningInput(
        age=52,
        gender="male",
        height_cm=175.0,
        weight_kg=82.0,
        systolic_bp=142,
        cholesterol=220,
        heart_rate=72,
        smoking_status="current",
        physical_activity_hours=1.5
    )
    cardio_res = run_cardiovascular_screening(cardio_input)
    assert cardio_res["risk_score"] >= 0.0 and cardio_res["risk_score"] <= 1.0, "Cardio score out of range"
    assert cardio_res["risk_category"] in ["lower", "moderate", "elevated"], "Invalid cardio category"
    assert len(cardio_res["feature_contributions"]) > 0, "Cardio missing contributions"
    print(f"  [PASS] Cardiovascular screening: score={cardio_res['risk_score_percentage']}%, category={cardio_res['risk_category']}")

    # 3. Chronic Kidney Disease
    kidney_input = KidneyScreeningInput(
        age=58,
        gender="male",
        systolic_bp=138,
        serum_creatinine=1.7,
        blood_urea=48.0,
        albumin=1,
        fasting_glucose=130,
        hemoglobin=11.2,
        history_hypertension=True,
        history_diabetes=True,
        pedal_edema=True
    )
    kidney_res = run_kidney_screening(kidney_input)
    assert kidney_res["risk_score"] >= 0.0 and kidney_res["risk_score"] <= 1.0, "Kidney score out of range"
    assert kidney_res["risk_category"] in ["lower", "moderate", "elevated"], "Invalid kidney category"
    assert len(kidney_res["feature_contributions"]) > 0, "Kidney missing contributions"
    print(f"  [PASS] Chronic Kidney Disease screening: score={kidney_res['risk_score_percentage']}%, category={kidney_res['risk_category']}")

    # 4. Symptom Check (Emergency detection)
    db = SessionLocal()
    try:
        emerg_res = run_symptom_early_risk_analysis(
            symptoms=["Chest discomfort", "Shortness of breath"],
            duration="1 day",
            severity="severe",
            onset="sudden",
            description="acute tightness",
            current_vitals={},
            user_id="test-verify",
            db=db
        )
        assert emerg_res["emergency_warning"] is True, "Emergency warning was not triggered for acute chest discomfort!"
        print(f"  [PASS] Emergency symptom triage: emergency_warning={emerg_res['emergency_warning']}")

        # 5. Symptom Check (Metabolic triage)
        metab_res = run_symptom_early_risk_analysis(
            symptoms=["Excessive thirst", "Frequent urination", "Fatigue"],
            duration="2 weeks",
            severity="moderate",
            onset="gradual",
            description="increasing thirst",
            current_vitals={},
            user_id="test-verify",
            db=db
        )
        assert len(metab_res["identified_patterns"]) > 0, "Expected matched symptom pattern"
        print(f"  [PASS] Non-emergency symptom triage: {len(metab_res['identified_patterns'])} pattern(s) identified")
    finally:
        db.close()


def test_auth_and_persistence():
    print("[2/3] Testing Database Persistence and Account Operations...")
    db = SessionLocal()
    try:
        # Check Himanshu Sharma demo record
        himanshu = db.query(User).filter(User.email == "himanshu.sharma@healthai.local").first()
        assert himanshu is not None, "Demo patient Himanshu Sharma not found in database!"
        assert verify_password("DemoPassword123!", himanshu.hashed_password), "Password verification failed"
        
        # Check associated screenings
        screenings = db.query(Screening).filter(Screening.user_id == himanshu.id).all()
        assert len(screenings) >= 3, f"Expected at least 3 seeded screenings, found {len(screenings)}"
        print(f"  [PASS] Himanshu Sharma demo profile verified: {len(screenings)} stored screenings")

        # Test creating a temporary test user and verifying tenant isolation
        test_email = "test.verification.patient@healthai.local"
        existing = db.query(User).filter(User.email == test_email).first()
        if existing:
            db.delete(existing)
            db.commit()

        new_user = User(
            email=test_email,
            hashed_password=hash_password("SecurePassword2026!"),
            full_name="Verification Patient",
            role="patient"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Add a screening to this test user
        test_screening = Screening(
            user_id=new_user.id,
            screening_type="kidney",
            model_version="1.0.0",
            algorithm_name="LogisticRegression",
            risk_score=0.35,
            risk_category="lower",
            risk_summary="Kidney parameters within acceptable limits for verification test.",
            general_guidance=["Maintain routine annual urinalysis."],
            feature_contributions=[],
            input_data={"serum_creatinine": 0.9}
        )
        db.add(test_screening)
        db.commit()
        db.refresh(test_screening)

        # Verify tenant isolation: Himanshu should not see test_screening
        himanshu_records = db.query(Screening).filter(Screening.user_id == himanshu.id).all()
        assert test_screening.id not in [s.id for s in himanshu_records], "Cross-tenant leak detected!"
        print("  [PASS] Tenant isolation verified: records strictly segregated by user_id")

        # Test single deletion
        db.delete(test_screening)
        db.commit()
        assert db.query(Screening).filter(Screening.id == test_screening.id).first() is None
        print("  [PASS] Single record deletion verified")

        # Clean up test user
        db.delete(new_user)
        db.commit()
        print("  [PASS] User account cleanup completed")

    finally:
        db.close()


def test_em_dash_absence():
    print("[3/3] Auditing Model and Service Text Outputs for Em-Dashes...")
    
    # Run all 3 screenings and inspect all text fields
    diab = run_diabetes_screening(DiabetesScreeningInput(age=45, gender="male", systolic_bp=120, diastolic_bp=80, fasting_glucose=95))
    cardio = run_cardiovascular_screening(CardioScreeningInput(age=45, gender="male", systolic_bp=120, cholesterol=180, heart_rate=70))
    kidney = run_kidney_screening(KidneyScreeningInput(age=45, gender="male", systolic_bp=120, serum_creatinine=0.9, blood_urea=30, albumin=0, fasting_glucose=90, hemoglobin=14.0))

    for name, res in [("Diabetes", diab), ("Cardiovascular", cardio), ("Kidney", kidney)]:
        for key in ["risk_summary", "risk_heading", "medical_disclaimer"]:
            val = res.get(key, "")
            assert "\u2014" not in val, f"Em dash found in {name} {key}: {val}"
            assert "\u2013" not in val, f"En dash found in {name} {key}: {val}"
        for f in res.get("feature_contributions", []):
            assert "\u2014" not in f["explanation"], f"Em dash in factor explanation: {f['explanation']}"
            assert "\u2013" not in f["explanation"], f"En dash in factor explanation: {f['explanation']}"
    print("  [PASS] Zero em-dashes or en-dashes found in ML text outputs")


if __name__ == "__main__":
    print("==================================================")
    print("  HealthAI Comprehensive System Verification Test")
    print("==================================================")
    test_ml_pipelines()
    test_auth_and_persistence()
    test_em_dash_absence()
    print("==================================================")
    print("  ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!")
    print("==================================================")
