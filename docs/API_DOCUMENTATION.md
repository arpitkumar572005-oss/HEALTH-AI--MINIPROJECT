# HealthAI — REST API Documentation

Base URL: `/api`  
Authentication: HTTP Bearer Token (`Authorization: Bearer <JWT>`)

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Creates a new patient account and associated baseline profile.
- **Request Body**:
  ```json
  {
    "full_name": "Jane Doe",
    "email": "jane.doe@example.com",
    "password": "SecurePassword123!",
    "age": 36,
    "gender": "female",
    "height_cm": 168,
    "weight_kg": 64
  }
  ```
- **Response**: `201 Created` with JWT access token and user metadata.

### `POST /api/auth/login`
Authenticates existing credentials.
- **Request Body**:
  ```json
  {
    "email": "jane.doe@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response**: `200 OK` with JWT access token.

### `POST /api/auth/demo-login`
Instant demonstration login without credentials.
- **Request Body**:
  ```json
  {
    "role": "patient"
  }
  ```
- Supported roles: `"patient"`, `"doctor"`, `"admin"`.

---

## 2. Health Risk Screening Endpoints

### `POST /api/screening/diabetes`
Executes metabolic diabetes risk screening inference.
- **Request Body**:
  ```json
  {
    "age": 48,
    "gender": "male",
    "height_cm": 178,
    "weight_kg": 82,
    "fasting_glucose": 118,
    "systolic_bp": 126,
    "diastolic_bp": 82,
    "family_history": true,
    "physical_activity_hours": 2.5,
    "symptoms": ["Fatigue", "Frequent urination"]
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "id": "7bf3b680-4965-4f35-9004-bb50f75e2ec6",
    "screening_type": "diabetes",
    "screening_title": "Diabetes Risk Screening",
    "model_version": "1.0.0",
    "algorithm": "Logistic Regression",
    "risk_score": 0.5842,
    "risk_score_percentage": 58,
    "risk_category": "moderate",
    "risk_heading": "Moderate Diabetes Risk Detected",
    "risk_summary": "Certain metrics, such as glucose levels or family history, place this screening in a moderate risk category.",
    "feature_contributions": [
      {
        "feature": "fasting_glucose",
        "label": "Fasting Blood Glucose",
        "contribution": 0.38,
        "direction": "increases_risk",
        "patient_value": 118,
        "unit": "mg/dL",
        "explanation": "Fasting Blood Glucose (118 mg/dL) is higher than baseline, contributing toward an elevated risk score."
      }
    ],
    "general_guidance": [
      "Consider discussing this screening result with a qualified healthcare professional.",
      "Maintain periodic monitoring of your fasting blood glucose and blood pressure."
    ],
    "emergency_warning": false,
    "emergency_message": null,
    "medical_disclaimer": "This AI-generated result is intended for screening and educational purposes only and is not a medical diagnosis. Please consult a qualified healthcare professional for medical advice, diagnosis, or treatment.",
    "created_at": "2026-10-01T22:30:00Z"
  }
  ```

### `POST /api/screening/cardiovascular`
Executes cardiovascular risk screening (systolic BP, total cholesterol, resting pulse, smoking history, chest discomfort index).

### `POST /api/screening/hypertension`
Executes arterial blood pressure risk screening (dual pressure inputs, sodium consumption, exercise frequency).

### `GET /api/screening/history`
Retrieves past screenings for the authenticated user.
- **Query Parameters**:
  - `disease_type` (optional): `"all"`, `"diabetes"`, `"cardiovascular"`, `"hypertension"`.
  - `search` (optional): Filter string.

### `GET /api/screening/details/{id}`
Returns complete details including input parameters, full feature contribution attributions, and timestamps.

---

## 3. Biometric Records & Trend Tracking

### `POST /api/health/measurements`
Logs an individual biometric entry (e.g. at-home check-in).
- **Request Body**:
  ```json
  {
    "measurement_type": "blood_glucose",
    "value": 104,
    "unit": "mg/dL",
    "notes": "Morning fasting check"
  }
  ```

### `GET /api/health/trends?timeframe={7d|30d|3m|6m|1y}`
Returns structured longitudinal data arrays grouped by biometric metric for time-series charting.

---

## 4. Reports & Administrative Analytics

### `GET /api/reports/{id}/pdf`
Returns binary stream of standardized, printable AI Health Screening Report (`application/pdf`).

### `GET /api/admin/overview`
Requires `admin` role. Returns aggregated volume, daily throughput, risk category distributions, and hold-out validation metrics without exposing individual patient records.
