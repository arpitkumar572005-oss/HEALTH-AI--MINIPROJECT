import time
from fastapi import FastAPI
from fastapi.testclient import TestClient

app = FastAPI()

@app.get("/docs-test")
def test_endpoint():
    return {"status": "ok"}

client = TestClient(app)
t0 = time.time()
res = client.get("/docs-test")
print(f"Direct FastAPI response: {res.status_code} in {time.time()-t0:.2f}s", flush=True)
