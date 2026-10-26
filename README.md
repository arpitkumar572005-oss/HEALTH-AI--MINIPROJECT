# HealthAI: AI-Assisted Health Risk Assessment and Understandable Health Insights

> **HealthAI** is a professional, clinical healthcare SaaS web application developed for **Himanshu Sharma** and his project team.  
> It provides calibrated machine learning disease risk estimation across Diabetes, Heart Disease, and Chronic Kidney Disease, combined with rule-based symptom triage and explainable factor breakdowns.

---

## 1. Project Overview

HealthAI is engineered as an educational health risk assessment platform that allows users to create accounts, enter physiological health information, check symptoms, estimate the risk of selected diseases, and understand their assessment results.

### Key Objectives & Architectural Principles
- **Educational Risk Estimation**: Clear stratification into Lower, Moderate, or Elevated Risk categories without presenting outputs as clinical medical diagnoses.
- **Three Core Healthcare Features**:
  1. **AI Symptom Detector**: Searchable symptom list, severity grading, duration, age calibration, and immediate red-flag warnings for acute symptoms.
  2. **Multiple Disease Prediction**: Three distinct, calibrated machine learning models for **Diabetes**, **Heart Disease**, and **Chronic Kidney Disease**, each trained on its own dataset with verified evaluation metrics.
  3. **Explainable Health Insights**: Model-calculated feature contributions (elevating vs moderating variables) without claiming causation, alongside plain-language biomarker explanations and physician discussion guidance.
- **Persistent User-Specific Health History**: Full tenant isolation, Indian standard date formatting (`DD/MM/YYYY`), metric units (`kg`, `cm`, `mmHg`, `mg/dL`), and individual record deletion.
- **Authentication & Data Privacy**: Passwords hashed securely using bcrypt, mandatory registration consent to the Privacy Policy and Terms and Conditions, user profile management, and GDPR/DPDP permanent data/account purge controls.
- **Strict Clinical Design System**: Deep teal (`#0F766E`), Dark navy (`#142B3B`), Off-white (`#F7F9FA`), White card surfaces (`#FFFFFF`), modest corner radii (4 to 8px), professional Lucide icons, and **zero em dashes**.

---

## 2. Machine Learning Models & Evaluation

Each disease assessment module operates on its own dedicated preprocessing pipeline and independently trained classifier.

| Disease Assessment | Preprocessing Pipeline | Model Algorithm | Evaluation Metrics | Key Physiological Inputs |
| :--- | :--- | :--- | :--- | :--- |
| **Diabetes Risk** | Scaler + Logistic Classifier | Calibrated Logistic Regression | **ROC-AUC: 0.81**<br>Accuracy: 76.5%<br>F1-Score: 0.75 | Fasting glucose, BMI, systolic BP, diastolic BP, age, physical activity, family history |
| **Heart Disease Risk** | Standard Scaler + Classifier | Calibrated Logistic / Random Forest | **ROC-AUC: 0.79**<br>Accuracy: 74.0%<br>F1-Score: 0.73 | Systolic BP, total cholesterol, resting heart rate, smoking status, age, chest discomfort level |
| **Chronic Kidney Disease** | StandardScaler + Logistic | Logistic Regression with Threshold Calibration | **ROC-AUC: 0.87**<br>Accuracy: 78.0%<br>F1-Score: 0.78 | Serum creatinine, blood urea, albumin, hemoglobin, fasting glucose, systolic BP, pedal edema |

### Model Explainability
- Feature contributions quantify the relative directional impact of user measurements.
- Risk factors are classified as **Elevating Risk** (e.g. elevated serum creatinine $\ge$ 1.5 mg/dL) or **Moderating / Protective Factor** (e.g. normal hemoglobin $\ge$ 14.0 g/dL).
- The system explicitly notes that model explanations reflect statistical associations within the trained model and do not prove physiological causation.

---

## 3. Strict Design Rules Followed

1. **Restrained Clinical Palette**:
   - Primary: Deep teal (`#0F766E`)
   - Secondary: Dark navy (`#142B3B`)
   - Background: Off-white (`#F7F9FA`)
   - Cards: Crisp white (`#FFFFFF`)
   - Borders: Subtle neutral gray (`#E2E8F0`)
   - Primary text: Dark slate (`#172B3A`)
   - Secondary text: Muted slate (`#64748B`)
2. **No Purple Gradients**: Pure clinical solids and subtle neutral borders.
3. **No Pill-Shaped Buttons**: Modest corner radii (6 to 8 pixels) throughout.
4. **No Emojis**: Consistent professional SVG icon set using Lucide.
5. **No Em Dashes**: Interface copy, headings, descriptions, and notifications are completely free of em dashes (`—`).
6. **No Fabricated Data**: If no prior records exist, the UI renders honest empty states: *"You have not completed an assessment yet."*
7. **No General-Purpose Chatbots**: Insights focus strictly on explaining the application's own calculated assessment results and biomarker definitions.

---

## 4. Navigation Architecture

The sidebar navigation consists of exactly seven structured items:

1. **Dashboard**: Personalized welcome header (`Welcome back, Himanshu`), three feature action panels, and real persistent Health History table.
2. **Symptom Detector**: Dedicated searchable symptom check, severity selection, duration, immediate red-flag banner, and rule-based triage heuristic.
3. **Disease Prediction**: Three disease tabs (Diabetes, Heart Disease, Chronic Kidney Disease), dynamic disease-specific input forms, and instant calibrated risk calculation.
4. **Health Insights**: Assessment selector, elevating vs moderating feature contributions, plain-language biomarker glossary, and structured physician discussion questions.
5. **Health History**: Comprehensive archive with disease filters, search, in-modal assessment inspector, and single record deletion.
6. **My Profile**: Demographics, metric biometrics (`cm`, `kg`), calculated BMI, lifestyle habits, and family history flags.
7. **Settings**: Account overview, secure password update form, regional format standard indicators, and danger zone data purge controls.

Dedicated legal pages (**Privacy Policy** and **Terms and Conditions**) are accessible directly from the application footer, within registration, and via account controls.

---

## 5. Technology Stack

- **Frontend**:
  - React 18 with TypeScript
  - Tailwind CSS with strict clinical design tokens
  - Lucide React iconography
  - Vite bundler
- **Backend**:
  - FastAPI (Python 3.10+)
  - SQLAlchemy ORM with SQLite database
  - Bcrypt password hashing and JWT authentication
  - Scikit-learn, NumPy, Pandas, Joblib for ML inference
  - Pydantic v2 schemas for robust request validation

---

## 6. Demonstration Patient Profiles (Indian Context)

For prototype review, testing, and presentations, the platform includes authentic demonstration accounts:

- **Himanshu Sharma (Default Demo Patient)**: `himanshu.sharma@healthai.local` (Pre-seeded with 4 clinical assessment records across Diabetes, Cardiovascular, Kidney, and Symptom checks).
- **Arpit Kumar**: `arpit.kumar@healthai.local`
- **Priya Verma**: `priya.verma@healthai.local`
- **Rahul Singh**: `rahul.singh@healthai.local`
- **Ananya Gupta**: `ananya.gupta@healthai.local`
- **Neha Mishra**: `neha.mishra@healthai.local`

---

## 7. Local Setup & Verification

### Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm

### Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Unix/macOS:
source venv/bin/activate

pip install -r requirements.txt

# Initialize database and seed demo patient:
python -m app.database.init_db

# Run automated system verification test:
python test_system_verification.py

# Start the FastAPI server:
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run build
npm run dev
```

The application will be accessible at `http://localhost:5173`.
