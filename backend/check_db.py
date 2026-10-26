import time
from app.database.session import SessionLocal
from app.models.entities import User, Screening

print("Testing DB query...", flush=True)
t0 = time.time()
db = SessionLocal()
users = db.query(User).all()
print(f"Found {len(users)} users in {time.time()-t0:.2f}s", flush=True)
for u in users:
    print(f"User: {u.id} - {u.email} - {u.full_name}", flush=True)
db.close()
