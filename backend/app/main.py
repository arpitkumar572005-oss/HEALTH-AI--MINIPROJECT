"""
HealthAI Backend Main Application
FastAPI application with medical safety guardrails, clean CORS,
comprehensive routers, and non-diagnostic screening services.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database.init_db import init_db
from app.api import auth, users, screening, health, reports, assistant, checkins, goals, reminders, insights, timeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("healthai")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing HealthAI backend database and models...")
    try:
        init_db()
        logger.info("HealthAI database and initial records verified.")
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")
    yield
    logger.info("HealthAI backend shutting down gracefully.")

app = FastAPI(
    title=settings.FULL_TITLE,
    description=f"{settings.POSITIONING}: {settings.TAGLINE}",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security & friendly error handling (Requirement 40: Never expose stack traces or server paths)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception at {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Something went wrong while processing your request. Please try again."
        }
    )

# Routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)
app.include_router(screening.router, prefix=settings.API_V1_PREFIX)
app.include_router(health.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)
app.include_router(assistant.router, prefix=settings.API_V1_PREFIX)
app.include_router(checkins.router, prefix=settings.API_V1_PREFIX)
app.include_router(goals.router, prefix=settings.API_V1_PREFIX)
app.include_router(reminders.router, prefix=settings.API_V1_PREFIX)
app.include_router(insights.router, prefix=settings.API_V1_PREFIX)
app.include_router(timeline.router, prefix=settings.API_V1_PREFIX)

@app.get("/api/health-check", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "full_title": settings.FULL_TITLE,
        "positioning": settings.POSITIONING,
        "tagline": settings.TAGLINE,
        "version": settings.VERSION,
        "disclaimer": "AI health screening system for informational and educational purposes only."
    }
