# HealthAI — Local Development Setup Guide

Follow this guide to run **HealthAI** locally on your development machine.

---

## 1. Prerequisites
- **Python**: 3.10+ (tested through 3.14)
- **Node.js**: 18.0+ & npm 9+
- **Git**

---

## 2. Quick Start (Zero Dependency Mode)

HealthAI comes pre-configured with a transparent SQLite fallback so you can run it immediately without setting up PostgreSQL.

### Step 1: Clone or Navigate to the Project
```bash
cd healthai
```

### Step 2: Set Up Backend
```bash
# Create Python virtual environment (optional but recommended)
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### Step 3: Train / Verify ML Screening Models
```bash
# Generates realistic clinical datasets and trains all 3 screening models
python ml/datasets/generate_datasets.py
python ml/training/train_models.py
```

### Step 4: Run Backend Server
```bash
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
The backend API is now live at: `http://127.0.0.1:8000`  
Interactive Swagger API Documentation: `http://127.0.0.1:8000/docs`

---

## 3. Set Up Frontend

In a separate terminal:
```bash
cd healthai/frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
The application interface is now live at: `http://localhost:5173`

---

## 4. Default Demo Accounts

HealthAI includes pre-seeded demo accounts with sample biometric trajectories and screening history:

| Role | Email | Password | Access Highlights |
| :--- | :--- | :--- | :--- |
| **Demo Patient** | `demo.patient@healthai.local` | `DemoPassword123!` | Full patient wizard, 30-day biometrics, historical reports |
| **Demo Doctor** | `demo.doctor@healthai.local` | `DemoPassword123!` | Demonstration clinical review & reports |
| **Demo Admin** | `demo.admin@healthai.local` | `DemoPassword123!` | System analytics, model governance benchmarks, volume charts |

You can also use the **"Instant Demo"** button on the landing page or login screen to sign in with a single click.

---

## 5. Running Automated Tests

Run backend unit and end-to-end tests:
```bash
cd healthai
pytest tests/test_backend.py -v
```
All 9 test suites verify authentication, ML inference, safety disclaimers, PDF generation, trends, and admin endpoints.
