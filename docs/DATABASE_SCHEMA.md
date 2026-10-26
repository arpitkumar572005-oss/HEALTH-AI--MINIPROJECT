# HealthAI — Database Schema & Data Dictionary

HealthAI employs a relational relational database architecture (compatible with both PostgreSQL and SQLite for zero-dependency local runs).

---

## 1. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--|| PATIENT_PROFILES : "has one profile"
    USERS ||--o{ HEALTH_MEASUREMENTS : "logs multiple"
    USERS ||--o{ SCREENINGS : "submits multiple"
    USERS ||--o{ AUDIT_LOGS : "generates"

    USERS {
        string id PK "UUID string (36 chars)"
        string email UK "Unique email address"
        string hashed_password "Bcrypt salted hash"
        string full_name "Full user name"
        string role "'patient', 'doctor', or 'admin'"
        boolean is_active "Account active status"
        boolean is_demo "Identifies sample demo accounts"
        datetime created_at "Registration UTC timestamp"
        datetime updated_at "Last update timestamp"
    }

    PATIENT_PROFILES {
        string id PK "UUID string"
        string user_id FK "References users.id (CASCADE)"
        integer age "Patient age in years"
        string gender "Biological sex ('female', 'male', 'other')"
        float height_cm "Stature in centimeters"
        float weight_kg "Weight in kilograms"
        float bmi "Auto-calculated BMI"
        string smoking_status "'never', 'former', 'active'"
        string alcohol_consumption "'none', 'moderate', 'frequent'"
        float physical_activity_hours "Weekly exercise hours"
        boolean family_history_diabetes "Family genetics flag"
        boolean family_history_hypertension "Family genetics flag"
        boolean family_history_cardiovascular "Family genetics flag"
        text existing_conditions "Self-reported health conditions"
        datetime created_at "Creation timestamp"
        datetime updated_at "Update timestamp"
    }

    HEALTH_MEASUREMENTS {
        string id PK "UUID string"
        string user_id FK "References users.id (CASCADE)"
        string measurement_type "'blood_glucose', 'systolic_bp', etc."
        float value "Numerical metric value"
        string unit "Metric unit (mg/dL, mmHg, bpm, kg)"
        string notes "Context notes or screening source"
        boolean is_demo "Demo tag"
        datetime measured_at "Measurement recorded timestamp"
    }

    SCREENINGS {
        string id PK "UUID string"
        string user_id FK "References users.id (CASCADE)"
        string screening_type "'diabetes', 'cardiovascular', 'hypertension'"
        string model_version "Model calibration version (e.g. 1.0.0)"
        string algorithm_name "Algorithm (e.g. Logistic Regression)"
        float risk_score "Probability score (0.0 to 1.0)"
        string risk_category "'lower', 'moderate', or 'elevated'"
        string risk_summary "Summary narrative statement"
        json input_data "Exact raw input parameters JSON"
        json feature_contributions "Explainable AI weights array JSON"
        json general_guidance "Suggested non-prescriptive steps JSON"
        boolean emergency_warning "Flag for concerning values"
        boolean is_demo "Demo tag"
        datetime created_at "Screening submission timestamp"
    }

    MODEL_VERSIONS {
        string id PK "UUID string"
        string disease_type UK "'diabetes', 'cardiovascular', 'hypertension'"
        string version "Semantic version"
        string algorithm "Selected classifier architecture"
        json metrics "ROC-AUC, Precision, Recall, Confusion Matrix"
        json features "Ordered feature list"
        datetime trained_at "Training completion timestamp"
    }

    AUDIT_LOGS {
        string id PK "UUID string"
        string user_id FK "References users.id (SET NULL)"
        string action "Action identifier (e.g. user_registered)"
        json details "Action context parameters"
        string ip_address "Originating network IP"
        datetime created_at "Audit timestamp"
    }
```

---

## 2. Table Indexing & Performance Design
- `users`: Indexed on `email` (unique) and `id` (primary key).
- `screenings`: Indexed on `user_id` and `created_at` for rapid screening history paging.
- `health_measurements`: Composite index on `(user_id, measurement_type, measured_at)` for high-throughput trend calculations.
- `patient_profiles`: Unique index on `user_id`.
