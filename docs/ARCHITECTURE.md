# HealthAI — System Architecture

**HealthAI** is a modern, modular AI health screening web application designed for early statistical risk detection and longitudinal biometric tracking.

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    User["User / Patient / Clinician (Browser)"]
    
    subgraph Frontend ["React + TypeScript Client (Vite)"]
        UI["UI Layer (AppShell, TailwindCSS, Inter)"]
        State["State & Context (AuthContext)"]
        API_Client["API Service Layer (Fetch Client)"]
        Charts["Visualization (Recharts, Custom SVG Risk Gauge)"]
        UI --> State
        State --> API_Client
        UI --> Charts
    end

    subgraph Backend ["FastAPI Backend Application"]
        Router["API Gateway / Routers (Auth, Screening, Health, Reports, Admin)"]
        AuthMiddleware["JWT Authentication & RBAC Guard"]
        Sanitizer["Pydantic Data Validation & Error Sanitizer"]
        InferenceService["Inference & Explainability Engine"]
        ReportService["PDF Report Generator (FPDF)"]
        
        Router --> AuthMiddleware
        AuthMiddleware --> Sanitizer
        Sanitizer --> InferenceService
        Sanitizer --> ReportService
    end

    subgraph ML_Layer ["Machine Learning Model Registry"]
        Preproc["StandardScaler Pipelines"]
        DiabetesModel["Diabetes Screening Model (v1.0.0)"]
        CardioModel["Cardiovascular Risk Model (v1.0.0)"]
        HtnModel["Hypertension Risk Model (v1.0.0)"]
        ExplainEngine["Feature Contribution Attribution"]

        InferenceService --> Preproc
        Preproc --> DiabetesModel
        Preproc --> CardioModel
        Preproc --> HtnModel
        InferenceService --> ExplainEngine
    end

    subgraph DataStore ["Database Layer"]
        Postgres["PostgreSQL / SQLite Storage Engine"]
        Tables["Tables: users, profiles, measurements, screenings, audit_logs"]
        Postgres --> Tables
    end

    User <--> Frontend
    Frontend <--> Backend
    Backend <--> DataStore
```

---

## 2. End-to-End Screening Data Flow

```mermaid
flowchart TD
    A["Patient Input Data (Biometrics, Symptoms, Measurements)"] --> B["Client-Side Validation (Boundaries, Types, Null Checks)"]
    B --> C["Pydantic Schema Validation (Backend Boundary)"]
    C --> D["Emergency Triage & Safety Boundary Check"]
    D --> E["StandardScaler Feature Preprocessing"]
    E --> F["Calibrated Model Inference (Predict Probability)"]
    F --> G["Risk Stratification (Lower < 35%, Moderate 35-65%, Elevated > 65%)"]
    G --> H["Explainable AI Feature Contribution Calculation"]
    H --> I["Non-Diagnostic Guidance & Standard Medical Disclaimer Injection"]
    I --> J["Database Persistence (Screening, Biometrics, Audit Log)"]
    J --> K["JSON API Response to Client"]
    K --> L["Interactive UI Presentation & PDF Report Generation"]
```

---

## 3. Screening Request Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Patient as User (Browser)
    participant UI as React UI (Wizard)
    participant API as FastAPI Router
    participant ML as ML Inference Engine
    participant DB as PostgreSQL Database

    Patient->>UI: Fills 5-Step Guided Wizard & clicks "Run AI Screening"
    UI->>API: POST /api/screening/{disease} with Bearer JWT
    API->>API: Authenticate user & validate Pydantic payload
    API->>ML: Pass structured biometric feature dictionary
    ML->>ML: Apply StandardScaler pipeline
    ML->>ML: Compute calibrated probability score (0.0 - 1.0)
    ML->>ML: Compute instance-level feature contribution weights
    ML->>ML: Evaluate emergency criteria & attach neutral guidance
    ML-->>API: Return screening result dictionary
    API->>DB: Persist screening record & associated biometric logs
    DB-->>API: Confirm record stored with UUID
    API-->>UI: Return 200 OK with ScreeningResult JSON
    UI->>Patient: Render Risk Gauge, Explainability Bars & PDF options
```

---

## 4. Architectural Principles

1. **Strict Medical Safety Separation**:
   - The platform strictly distinguishes **statistical health screening** from **medical diagnosis**.
   - No diagnostic pronouncements are ever generated ("You have diabetes" is replaced by "Elevated diabetes risk detected").
   - Every inference response contains the standard, non-removable disclaimer.
2. **Modular Screening Extensibility**:
   - Adding a new disease module requires zero modifications to the core API architecture. Each module exposes a uniform contract: preprocessing pipeline, metadata, model weights, and threshold bounds.
3. **In-Memory Model Serving**:
   - Machine learning pipelines are loaded into memory once during application startup and cached for microsecond-latency inference.
4. **Data Privacy by Design**:
   - Administrative dashboards present only aggregate metrics (volume, stratification, model benchmarks) without exposing individual patient protected health information (PHI).
