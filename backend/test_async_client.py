import asyncio
import httpx
from fastapi import FastAPI

app = FastAPI()

@app.get("/ping")
async def ping():
    return {"message": "pong"}

async def test_it():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/ping")
        print("Response:", res.json(), flush=True)

if __name__ == "__main__":
    asyncio.run(test_it())
