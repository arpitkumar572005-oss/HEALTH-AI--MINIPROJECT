"""
Database Initialization and Seed Script for HealthAI
Sets up tables and seeds sample demonstration data (Himanshu Sharma)
with documented historical assessments, clearly labeled as Demo Data.
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.session import engine, Base, SessionLocal
from app.models.entities import (
    User,
    PatientProfile,
    HealthMeasurement,
    Screening,
    DailyCheckIn,
    AuditLog
)
from app.services.auth_service import hash_password

def migrate_schema():
    with engine.connect() as conn:
        try:
            res = conn.execute(text("PRAGMA table_info(patient_profiles)")).fetchall()
            existing_cols = [r[1] for r in res]
            if existing_cols:
                if "sleep_hours_typical" not in existing_cols:
                    conn.execute(text("ALTER TABLE patient_profiles ADD COLUMN sleep_hours_typical REAL DEFAULT 7.3"))
                if "blood_type" not in existing_cols:
                    conn.execute(text("ALTER TABLE patient_profiles ADD COLUMN blood_type TEXT DEFAULT 'O+'"))
                if "known_allergies" not in existing_cols:
                    conn.execute(text("ALTER TABLE patient_profiles ADD COLUMN known_allergies TEXT"))

            res_s = conn.execute(text("PRAGMA table_info(screenings)")).fetchall()
            s_cols = [r[1] for r in res_s]
            if s_cols:
                if "historical_comparison" not in s_cols:
                    conn.execute(text("ALTER TABLE screenings ADD COLUMN historical_comparison JSON"))
                if "symptom_data" not in s_cols:
                    conn.execute(text("ALTER TABLE screenings ADD COLUMN symptom_data JSON"))

            res_m = conn.execute(text("PRAGMA table_info(health_measurements)")).fetchall()
            m_cols = [r[1] for r in res_m]
            if m_cols:
                if "source" not in m_cols:
                    conn.execute(text("ALTER TABLE health_measurements ADD COLUMN source TEXT DEFAULT 'manual_input'"))

            conn.commit()
        except Exception:
            pass

def init_db():
    Base.metadata.create_all(bind=engine)
    migrate_schema()
    db = SessionLocal()
    try:
        # Clean out legacy dummy test accounts
        legacy_users = db.query(User).filter(
            User.email.like("%@healthai.test") |
            User.email.like("test_%") |
            User.email.like("audit_%") |
            User.email.like("htn_%") |
            User.email.like("fresh_%") |
            User.email.like("type_comp_%") |
            User.email.like("phase8_%")
        ).all()
        for u in legacy_users:
            db.delete(u)
        db.commit()

        # Check or create primary Indian demonstration account: Himanshu Sharma
        demo_email = "himanshu.sharma@healthai.local"
        patient = db.query(User).filter(User.email == demo_email).first()

        if not patient:
            # Check if old demo.patient exists and update
            old_demo = db.query(User).filter(User.email == "demo.patient@healthai.local").first()
            if old_demo:
                old_demo.email = demo_email
                old_demo.full_name = "Himanshu Sharma"
                patient = old_demo
            else:
                patient = User(
                    email=demo_email,
                    hashed_password=hash_password("DemoPassword123!"),
                    full_name="Himanshu Sharma",
                    role="patient",
                    is_demo=True
                )
                db.add(patient)
            db.flush()
        else:
            patient.full_name = "Himanshu Sharma"
            db.flush()

        # Update demonstration profile
        profile = db.query(PatientProfile).filter(PatientProfile.user_id == patient.id).first()
        if not profile:
            profile = PatientProfile(user_id=patient.id)
            db.add(profile)
            
        profile.age = 46
        profile.gender = "male"
        profile.height_cm = 178.0
        profile.weight_kg = 77.5
        profile.bmi = 24.5
        profile.smoking_status = "former"
        profile.alcohol_consumption = "moderate"
        profile.physical_activity_hours = 3.0
        profile.sleep_hours_typical = 7.3
        profile.blood_type = "O+"
        profile.family_history_diabetes = True
        profile.family_history_hypertension = False
        profile.family_history_cardiovascular = False
        profile.existing_conditions = "Mild seasonal allergies"
        profile.known_allergies = "Penicillin (mild rash)"

        # Clear existing demo screenings and measurements for demo patient to re-seed cleanly
        db.query(Screening).filter(Screening.user_id == patient.id).delete()
        db.query(HealthMeasurement).filter(HealthMeasurement.user_id == patient.id).delete()

        now = datetime.now(timezone.utc)

        # 1. Seed Demo Measurements
        sample_dates = [now - timedelta(days=28 - i * 4) for i in range(8)]
        glucose_vals = [104, 102, 106, 101, 100, 99, 101, 98]
        sbp_vals = [126, 125, 124, 123, 122, 123, 121, 122]
        dbp_vals = [84, 82, 82, 81, 80, 81, 79, 80]
        hr_vals = [75, 74, 73, 71, 72, 70, 71, 72]
        wt_vals = [78.5, 78.3, 78.2, 78.0, 77.9, 77.8, 77.6, 77.5]

        for dt, g, s, d, h, w in zip(sample_dates, glucose_vals, sbp_vals, dbp_vals, hr_vals, wt_vals):
            db.add(HealthMeasurement(
                user_id=patient.id,
                measurement_type="blood_glucose",
                value=g,
                unit="mg/dL",
                notes="Morning fasting check (Demo Data)",
                is_demo=True,
                measured_at=dt
            ))
            db.add(HealthMeasurement(
                user_id=patient.id,
                measurement_type="systolic_bp",
                value=s,
                unit="mmHg",
                notes="Resting blood pressure (Demo Data)",
                is_demo=True,
                measured_at=dt
            ))
            db.add(HealthMeasurement(
                user_id=patient.id,
                measurement_type="diastolic_bp",
                value=d,
                unit="mmHg",
                notes="Resting blood pressure (Demo Data)",
                is_demo=True,
                measured_at=dt
            ))
            db.add(HealthMeasurement(
                user_id=patient.id,
                measurement_type="heart_rate",
                value=h,
                unit="bpm",
                notes="Resting pulse (Demo Data)",
                is_demo=True,
                measured_at=dt
            ))
            db.add(HealthMeasurement(
                user_id=patient.id,
                measurement_type="weight",
                value=w,
                unit="kg",
                notes="Morning baseline weigh-in (Demo Data)",
                is_demo=True,
                measured_at=dt
            ))

        db.add(HealthMeasurement(
            user_id=patient.id,
            measurement_type="cholesterol",
            value=188.0,
            unit="mg/dL",
            notes="Comprehensive lipid panel (Demo Data)",
            is_demo=True,
            measured_at=now - timedelta(days=5)
        ))
        db.add(HealthMeasurement(
            user_id=patient.id,
            measurement_type="serum_creatinine",
            value=0.92,
            unit="mg/dL",
            notes="Comprehensive metabolic panel (Demo Data)",
            is_demo=True,
            measured_at=now - timedelta(days=5)
        ))
        db.add(HealthMeasurement(
            user_id=patient.id,
            measurement_type="blood_urea",
            value=26.0,
            unit="mg/dL",
            notes="Comprehensive metabolic panel (Demo Data)",
            is_demo=True,
            measured_at=now - timedelta(days=5)
        ))

        # 2. Seed Demo Historical Screenings for Himanshu Sharma (All 3 Disease Modules + Symptom Detector)
        # Assessment A: Diabetes Screening (Moderate, 36%)
        db.add(Screening(
            user_id=patient.id,
            screening_type="diabetes",
            model_version="1.0.0",
            algorithm_name="Logistic Regression",
            risk_score=0.36,
            risk_category="moderate",
            risk_summary="Fasting blood glucose (98 mg/dL) and consistent aerobic activity placed this screening in the lower end of the moderate risk spectrum.",
            input_data={
                "age": 46,
                "gender": "male",
                "bmi": 24.5,
                "fasting_glucose": 98,
                "systolic_bp": 122,
                "diastolic_bp": 80,
                "family_history": True,
                "physical_activity_hours": 3.0,
                "symptoms": []
            },
            feature_contributions=[
                {"feature": "age", "label": "Age", "contribution": 0.36, "direction": "increases_risk", "patient_value": 46, "unit": "years", "explanation": "Age (46 years) contributes moderately to statistical baseline weighting."},
                {"feature": "family_history", "label": "Family History", "contribution": 0.28, "direction": "increases_risk", "patient_value": "Yes", "unit": "", "explanation": "Reported parental diabetes increases statistical screening probability."},
                {"feature": "fasting_glucose", "label": "Fasting Blood Glucose", "contribution": 0.22, "direction": "decreases_risk", "patient_value": 98, "unit": "mg/dL", "explanation": "Fasting blood glucose (98 mg/dL) is within normal reference range."},
                {"feature": "bmi", "label": "Body Mass Index", "contribution": 0.14, "direction": "decreases_risk", "patient_value": 24.5, "unit": "kg/m²", "explanation": "BMI is in a favorable reference zone."}
            ],
            general_guidance=[
                "Continue balanced dietary habits prioritizing whole grains and lean proteins.",
                "Maintain periodic morning blood glucose checks.",
                "Discuss long-term family risk factors with your primary healthcare provider."
            ],
            emergency_warning=False,
            is_demo=True,
            created_at=now - timedelta(days=2)
        ))

        # Assessment B: Heart Disease Screening (Lower, 22%)
        db.add(Screening(
            user_id=patient.id,
            screening_type="cardiovascular",
            model_version="1.0.0",
            algorithm_name="Logistic Regression",
            risk_score=0.22,
            risk_category="lower",
            risk_summary="Model-estimated cardiovascular risk is in the lower risk category based on favorable lipid and blood pressure readings.",
            input_data={
                "age": 46,
                "gender": "male",
                "bmi": 24.5,
                "systolic_bp": 120,
                "cholesterol": 182,
                "heart_rate": 70,
                "smoking_status": "former",
                "chest_discomfort_level": 0,
                "physical_activity_hours": 3.0
            },
            feature_contributions=[
                {"feature": "cholesterol", "label": "Total Cholesterol", "contribution": 0.42, "direction": "decreases_risk", "patient_value": 182, "unit": "mg/dL", "explanation": "Total serum cholesterol is well below average population risk thresholds."},
                {"feature": "systolic_bp", "label": "Systolic Blood Pressure", "contribution": 0.32, "direction": "decreases_risk", "patient_value": 120, "unit": "mmHg", "explanation": "Systolic pressure aligns with optimal cardiovascular baselines."}
            ],
            general_guidance=[
                "Continue heart-healthy nutritional patterns.",
                "Maintain routine preventive wellness evaluations."
            ],
            emergency_warning=False,
            is_demo=True,
            created_at=now - timedelta(days=14)
        ))

        # Assessment C: Chronic Kidney Disease Screening (Lower, 24%)
        db.add(Screening(
            user_id=patient.id,
            screening_type="kidney",
            model_version="1.0.0",
            algorithm_name="Calibrated Logistic Regression",
            risk_score=0.24,
            risk_category="lower",
            risk_summary="Model-estimated chronic kidney disease risk score is in the lower screening category based on normal serum creatinine and blood urea readings.",
            input_data={
                "age": 46,
                "systolic_bp": 122,
                "serum_creatinine": 0.92,
                "blood_urea": 26.0,
                "albumin": 0,
                "fasting_glucose": 98.0,
                "hemoglobin": 14.8,
                "history_hypertension": False,
                "history_diabetes": False,
                "pedal_edema": False
            },
            feature_contributions=[
                {"feature": "serum_creatinine", "label": "Serum Creatinine", "contribution": 0.38, "direction": "decreases_risk", "patient_value": 0.92, "unit": "mg/dL", "explanation": "Serum creatinine (0.92 mg/dL) is within optimal clinical baseline range."},
                {"feature": "albumin", "label": "Urine Albumin", "contribution": 0.28, "direction": "decreases_risk", "patient_value": "Grade 0", "unit": "", "explanation": "Zero proteinuria detected; favorable glomerular barrier integrity."},
                {"feature": "hemoglobin", "label": "Hemoglobin", "contribution": 0.20, "direction": "decreases_risk", "patient_value": 14.8, "unit": "g/dL", "explanation": "Healthy hemoglobin level indicates absence of renal anemia."},
                {"feature": "systolic_bp", "label": "Systolic Blood Pressure", "contribution": 0.14, "direction": "decreases_risk", "patient_value": 122, "unit": "mmHg", "explanation": "Resting systolic pressure aligns with standard cardiovascular targets."}
            ],
            general_guidance=[
                "Maintain adequate daily hydration with pure water.",
                "Routinely monitor blood pressure during routine medical checkups.",
                "Discuss long-term renal wellness during periodic health evaluations."
            ],
            emergency_warning=False,
            is_demo=True,
            created_at=now - timedelta(days=21)
        ))

        # Assessment D: Symptom-Based Screening
        db.add(Screening(
            user_id=patient.id,
            screening_type="symptom_risk",
            model_version="1.0.0",
            algorithm_name="Clinical Triage Rule Protocol",
            risk_score=0.28,
            risk_category="lower",
            risk_summary="Reported mild headache and mild fatigue over 2 days. No emergency red flags detected. Self-care and rest indicated.",
            input_data={
                "symptoms": ["Headache", "Fatigue"],
                "duration": "1-2 days",
                "severity": "mild",
                "onset": "gradual",
                "description": "Mild tension headache after work hours."
            },
            feature_contributions=[
                {"feature": "headache", "label": "Headache", "contribution": 0.50, "direction": "increases_risk", "patient_value": "Mild", "unit": "", "explanation": "Gradual onset mild headache without visual disturbances or stiff neck."},
                {"feature": "fatigue", "label": "Fatigue", "contribution": 0.50, "direction": "increases_risk", "patient_value": "Mild", "unit": "", "explanation": "Mild tiredness responsive to rest."}
            ],
            general_guidance=[
                "Ensure 7 to 8 hours of restful sleep.",
                "Maintain proper hydration throughout the workday.",
                "If symptoms persist beyond 5 to 7 days or worsen suddenly, consult a doctor."
            ],
            emergency_warning=False,
            is_demo=True,
            created_at=now - timedelta(days=5)
        ))

        db.commit()
        print("Successfully initialized HealthAI database with verified demonstration data.")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
