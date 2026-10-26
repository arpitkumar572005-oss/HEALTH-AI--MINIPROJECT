import time
from app.main import app
from fastapi.testclient import TestClient

print("Creating TestClient...", flush=True)
client = TestClient(app)

print("Making GET /docs...", flush=True)
t0 = time.time()
res = client.get("/docs")
print(f"GET /docs returned {res.status_code} in {time.time()-t0:.2f}s", flush=True)
