"""
Phase 6 Automated Tests — Centralized Health History, Trends & Patient Data Architecture
Validates:
1. Centralized patient health summary & profile linkage
2. Screening history across Diabetes, Cardiovascular, Hypertension, and Symptom screenings
3. Older records are preserved and not overwritten
4. Health measurements with source attribution
5. Health Trends logic:
   - When count == 0: has_sufficient_data = False
   - When count == 1: has_sufficient_data = False, message = 'Not enough historical data for a trend.'
   - When count >= 2: has_sufficient_data = True, real calculated shift delta
6. Unified Timeline chronological feed and event filtering
7. Dashboard overview dynamic data integrity
"""

import pytest
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.session import Base
from app.models.entities import (
    User,
    PatientProfile,
    Screening,
    HealthMeasurement,
    DailyCheckIn,
    HealthDocument
)
from app.services.patient_history_service import (
    get_patient_health_summary,
    get_screening_history,
    get_latest_screening,
    get_previous_screening,
    get_health_measurements,
    get_health_trends,
    get_health_timeline,
    get_dashboard_overview
)

# Test in-memory SQLite DB
TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()

    # Create test user
    user = User(
        id="test-patient-uuid-1234",
        email="patient.test@healthai.local",
        hashed_password="fakehashedpassword",
        full_name="Sarah Jenkins",
        role="patient",
        is_demo=False
    )
    session.add(user)

    profile = PatientProfile(
        id="test-profile-uuid-1234",
        user_id=user.id,
        age=52,
        gender="female",
        height_cm=165.0,
        weight_kg=68.5,
        bmi=25.2,
        smoking_status="never",
        alcohol_consumption="rare",
        physical_activity_hours=3.5,
        family_history_diabetes=True,
        family_history_hypertension=True,
        family_history_cardiovascular=False
    )
    session.add(profile)
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)


def test_centralized_patient_summary_empty(db_session):
    """Test patient health summary when no screenings or measurements have been performed."""
    user_id = "test-patient-uuid-1234"
    summary = get_patient_health_summary(user_id, db_session)
    assert summary["patient_id"] == user_id
    assert summary["full_name"] == "Sarah Jenkins"
    assert summary["profile"]["age"] == 52
    assert summary["screening_counts"]["total"] == 0
    assert summary["latest_screenings"] == {}
    assert summary["latest_measurements"] == {}


def test_screening_persistence_and_non_overwriting(db_session):
    """
    Test that screenings across Diabetes, Cardiovascular, and Hypertension:
    1. Persist with full metadata and model versions.
    2. Repeated screenings for the same module do NOT overwrite prior records.
    3. Old records remain intact with original scores and categories.
    """
    user_id = "test-patient-uuid-1234"
    now = datetime.now(timezone.utc)

    # 1. Diabetes screening 1 (Earlier)
    s_diab_1 = Screening(
        id="s-diab-1",
        user_id=user_id,
        screening_type="diabetes",
        model_version="1.0.0",
        algorithm_name="Logistic Regression",
        risk_score=0.48,
        risk_category="moderate",
        risk_summary="Moderate baseline diabetes risk.",
        input_data={"fasting_glucose": 110, "bmi": 25.5},
        feature_contributions=[{"feature": "fasting_glucose", "contribution": 0.4}],
        general_guidance=["Monitor blood sugar"],
        created_at=now - timedelta(days=14)
    )
    db_session.add(s_diab_1)

    # 2. Diabetes screening 2 (Current)
    s_diab_2 = Screening(
        id="s-diab-2",
        user_id=user_id,
        screening_type="diabetes",
        model_version="1.0.0",
        algorithm_name="Logistic Regression",
        risk_score=0.36,
        risk_category="moderate",
        risk_summary="Lower-moderate diabetes risk.",
        input_data={"fasting_glucose": 98, "bmi": 25.2},
        feature_contributions=[{"feature": "fasting_glucose", "contribution": 0.2}],
        general_guidance=["Maintain aerobic exercise"],
        created_at=now - timedelta(days=1)
    )
    db_session.add(s_diab_2)

    # 3. Cardiovascular screening
    s_cardio = Screening(
        id="s-cardio-1",
        user_id=user_id,
        screening_type="cardiovascular",
        model_version="1.0.0",
        algorithm_name="Logistic Regression",
        risk_score=0.22,
        risk_category="lower",
        risk_summary="Optimal lipid and BP baseline.",
        input_data={"systolic_bp": 120, "cholesterol": 185},
        feature_contributions=[],
        general_guidance=["Heart healthy diet"],
        created_at=now - timedelta(days=10)
    )
    db_session.add(s_cardio)

    # 4. Hypertension screening
    s_htn = Screening(
        id="s-htn-1",
        user_id=user_id,
        screening_type="hypertension",
        model_version="1.0.0",
        algorithm_name="Logistic Regression",
        risk_score=0.42,
        risk_category="moderate",
        risk_summary="Diastolic reading marginally elevated.",
        input_data={"systolic_bp": 126, "diastolic_bp": 84},
        feature_contributions=[],
        general_guidance=["Reduce sodium intake"],
        created_at=now - timedelta(days=5)
    )
    db_session.add(s_htn)
    db_session.commit()

    # Query screening history
    history = get_screening_history(user_id, db_session)
    assert len(history) == 4, "All 4 historical screenings must be preserved!"
    
    # Verify newest first ordering
    assert history[0]["id"] == "s-diab-2"
    assert history[1]["id"] == "s-htn-1"
    assert history[2]["id"] == "s-cardio-1"
    assert history[3]["id"] == "s-diab-1"

    # Verify latest screening query
    latest_diab = get_latest_screening(user_id, "diabetes", db_session)
    assert latest_diab is not None
    assert latest_diab["id"] == "s-diab-2"
    assert latest_diab["risk_score_percentage"] == 36

    # Verify previous screening query retrieves older record intact
    prev_diab = get_previous_screening(user_id, "diabetes", db_session, before_datetime=s_diab_2.created_at)
    assert prev_diab is not None
    assert prev_diab["id"] == "s-diab-1"
    assert prev_diab["risk_score_percentage"] == 48


def test_health_measurements_and_source_tracking(db_session):
    """
    Test logging health measurements with source metadata ('screening', 'manual_input').
    """
    user_id = "test-patient-uuid-1234"
    now = datetime.now(timezone.utc)

    meas1 = HealthMeasurement(
        user_id=user_id,
        measurement_type="blood_glucose",
        value=98.0,
        unit="mg/dL",
        source="screening",
        notes="Logged from Diabetes Risk Screening",
        measured_at=now
    )
    meas2 = HealthMeasurement(
        user_id=user_id,
        measurement_type="blood_glucose",
        value=105.0,
        unit="mg/dL",
        source="manual_input",
        notes="Morning home glucometer check",
        measured_at=now - timedelta(days=3)
    )
    db_session.add_all([meas1, meas2])
    db_session.commit()

    measurements = get_health_measurements(user_id, db_session, measurement_type="blood_glucose")
    assert len(measurements) == 2
    assert measurements[0]["source"] == "screening"
    assert measurements[1]["source"] == "manual_input"
    assert measurements[0]["value"] == 98.0


def test_health_trends_insufficient_data_single_measurement(db_session):
    """
    CRITICAL MANDATORY REQUIREMENT:
    If only one measurement exists:
    Do NOT draw a fake trend.
    Show: 'Not enough historical data for a trend.'
    """
    user_id = "test-patient-uuid-1234"
    now = datetime.now(timezone.utc)

    # Add exactly 1 blood glucose measurement
    meas = HealthMeasurement(
        user_id=user_id,
        measurement_type="blood_glucose",
        value=98.0,
        unit="mg/dL",
        measured_at=now
    )
    db_session.add(meas)
    db_session.commit()

    trends = get_health_trends(user_id, db_session, timeframe="30d")
    detail = trends["metric_details"]["blood_glucose"]

    assert detail["count"] == 1
    assert detail["has_sufficient_data"] is False
    assert detail["status_message"] == "Not enough historical data for a trend."
    assert detail["shift_delta"] is None


def test_health_trends_sufficient_data_two_or_more_measurements(db_session):
    """
    If two or more valid historical measurements exist:
    has_sufficient_data = True
    Calculates actual shift delta and trajectory direction.
    """
    user_id = "test-patient-uuid-1234"
    now = datetime.now(timezone.utc)

    meas1 = HealthMeasurement(
        user_id=user_id,
        measurement_type="blood_glucose",
        value=106.0,
        unit="mg/dL",
        measured_at=now - timedelta(days=10)
    )
    meas2 = HealthMeasurement(
        user_id=user_id,
        measurement_type="blood_glucose",
        value=98.0,
        unit="mg/dL",
        measured_at=now
    )
    db_session.add_all([meas1, meas2])
    db_session.commit()

    trends = get_health_trends(user_id, db_session, timeframe="30d")
    detail = trends["metric_details"]["blood_glucose"]

    assert detail["count"] == 2
    assert detail["has_sufficient_data"] is True
    assert detail["shift_delta"] == -8.0  # 98 - 106
    assert detail["trend_direction"] == "decreasing"


def test_unified_timeline_feed_and_filtering(db_session):
    """
    Test that the timeline unifies screenings, measurements, checkins, and reports
    in strictly descending chronological order, and supports event_type filtering.
    """
    user_id = "test-patient-uuid-1234"
    now = datetime.now(timezone.utc)

    s = Screening(
        id="s-time-1",
        user_id=user_id,
        screening_type="cardiovascular",
        model_version="1.0.0",
        algorithm_name="Logistic Regression",
        risk_score=0.20,
        risk_category="lower",
        risk_summary="Cardiovascular risk screening completed.",
        input_data={},
        feature_contributions=[],
        general_guidance=[],
        created_at=now - timedelta(hours=2)
    )
    m = HealthMeasurement(
        id="m-time-1",
        user_id=user_id,
        measurement_type="blood_glucose",
        value=97.0,
        unit="mg/dL",
        measured_at=now - timedelta(hours=5)
    )
    c = DailyCheckIn(
        id="c-time-1",
        user_id=user_id,
        mood="great",
        energy_level=9,
        stress_level="low",
        sleep_hours=8.0,
        symptoms=[],
        activity_steps=7500,
        summary="Positive wellbeing reported.",
        checkin_date=now.strftime("%Y-%m-%d"),
        created_at=now - timedelta(hours=8)
    )
    d = HealthDocument(
        id="d-time-1",
        user_id=user_id,
        filename="metabolic_panel.pdf",
        document_type="blood_report",
        file_size_kb=140.0,
        detected_parameters=[{"parameter": "Glucose", "value": "97"}],
        summary="Panel analyzed successfully.",
        created_at=now - timedelta(hours=12)
    )
    db_session.add_all([s, m, c, d])
    db_session.commit()

    # 1. Query full timeline
    all_events = get_health_timeline(user_id, db_session)
    assert len(all_events) == 4
    # Newest first
    assert all_events[0]["id"] == "screening-s-time-1"
    assert all_events[1]["id"] == "meas-m-time-1"
    assert all_events[2]["id"] == "checkin-c-time-1"
    assert all_events[3]["id"] == "doc-d-time-1"

    # 2. Query filtered by screening
    screening_events = get_health_timeline(user_id, db_session, event_type="screening")
    assert len(screening_events) == 1
    assert screening_events[0]["event_type"] == "screening"

    # 3. Query filtered by measurement
    meas_events = get_health_timeline(user_id, db_session, event_type="measurement")
    assert len(meas_events) == 1
    assert meas_events[0]["event_type"] == "measurement"


def test_dashboard_overview_integration(db_session):
    """
    Test that the centralized dashboard overview retrieves real database records
    for screenings, calculated shifts, biometric sparklines, and dynamic insights.
    """
    user_id = "test-patient-uuid-1234"
    now = datetime.now(timezone.utc)

    # Prior diabetes: 48%, Latest diabetes: 36% -> Shift = -12%
    s1 = Screening(
        id="s-ov-1",
        user_id=user_id,
        screening_type="diabetes",
        model_version="1.0.0",
        algorithm_name="Logistic Regression",
        risk_score=0.48,
        risk_category="moderate",
        risk_summary="Moderate baseline.",
        input_data={"fasting_glucose": 108},
        feature_contributions=[],
        general_guidance=[],
        created_at=now - timedelta(days=10)
    )
    s2 = Screening(
        id="s-ov-2",
        user_id=user_id,
        screening_type="diabetes",
        model_version="1.0.0",
        algorithm_name="Logistic Regression",
        risk_score=0.36,
        risk_category="moderate",
        risk_summary="Improved screening result.",
        input_data={"fasting_glucose": 98},
        feature_contributions=[],
        general_guidance=[],
        created_at=now - timedelta(days=1)
    )
    m = HealthMeasurement(
        user_id=user_id,
        measurement_type="blood_glucose",
        value=98.0,
        unit="mg/dL",
        measured_at=now - timedelta(days=1)
    )
    db_session.add_all([s1, s2, m])
    db_session.commit()

    overview = get_dashboard_overview(user_id, db_session, timeframe="30d")

    # Verify diabetes shift is -12%
    diab_card = overview["screenings_summary"]["diabetes"]
    assert diab_card["latest"]["risk_score_percentage"] == 36
    assert diab_card["has_previous"] is True
    assert diab_card["previous_score"] == 48
    assert diab_card["shift"] == -12
    assert diab_card["trend"] == "decreased"

    # Verify diabetes risk progression has 2 points
    risk_trend = overview["diabetes_risk_trend"]
    assert risk_trend["has_sufficient_data"] is True
    assert len(risk_trend["points"]) == 2
    assert risk_trend["points"][0]["risk"] == 48
    assert risk_trend["points"][1]["risk"] == 36

    # Verify dynamic educational insights were generated
    assert len(overview["insights"]) > 0
