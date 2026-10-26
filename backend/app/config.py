"""
HealthAI Application Configuration
"""

import os
from pydantic_settings import BaseSettings, SettingsConfigDict

_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_default_db_path = os.path.join(_backend_dir, "healthai.db").replace("\\", "/")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="allow")
    
    PROJECT_NAME: str = "HealthAI"
    FULL_TITLE: str = "HealthAI: AI-assisted health risk assessment and understandable health insights"
    POSITIONING: str = "AI-assisted health risk assessment"
    TAGLINE: str = "AI-assisted health risk assessment and understandable health insights."
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "healthai-super-secret-production-grade-key-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database: Supports PostgreSQL, falls back gracefully to SQLite for self-contained execution
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{_default_db_path}")
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"
    ]
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

settings = Settings()
