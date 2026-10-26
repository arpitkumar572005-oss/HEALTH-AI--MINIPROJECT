import sys
import os
import time

backend_dir = r"C:\Users\arpit\.gemini\antigravity\scratch\healthai\backend"
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

print("1. Importing app...", flush=True)
t0 = time.time()
from app.main import app
print(f"2. App imported in {time.time()-t0:.2f}s", flush=True)

from fastapi.testclient import TestClient
print("3. Creating TestClient...", flush=True)
t0 = time.time()
client = TestClient(app)
print(f"4. Client created in {time.time()-t0:.2f}s", flush=True)

print("5. Posting demo login...", flush=True)
t0 = time.time()
res = client.post("/api/auth/demo-login", json={"role": "patient"})
print(f"6. Demo login status: {res.status_code} in {time.time()-t0:.2f}s", flush=True)
token = res.json()["access_token"]

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

print("7. Posting screening...", flush=True)
t0 = time.time()
res = client.post("/api/screening/diabetes", json=payload, headers=headers)
print(f"8. Screening status: {res.status_code} in {time.time()-t0:.2f}s", flush=True)
if res.status_code != 200:
    print(res.text, flush=True)
else:
    print("Success! Risk category:", res.json().get("risk_category"), flush=True)
