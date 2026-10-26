"""
Authentication Pydantic Schemas
"""

from typing import Optional
from pydantic import BaseModel, Field

EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=EMAIL_REGEX, description="Valid email address")
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    age: Optional[int] = Field(None, ge=18, le=120)
    gender: Optional[str] = "other"
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    terms_consented: bool = Field(..., description="Required consent to the Privacy Policy and Terms and Conditions")

class UserLogin(BaseModel):
    email: str = Field(..., pattern=EMAIL_REGEX)
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., pattern=EMAIL_REGEX)

class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=8, description="Minimum 8 characters")

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, description="Minimum 8 characters")

class DemoLoginRequest(BaseModel):
    persona: Optional[str] = Field("himanshu", description="Indian sample identity: 'himanshu', 'arpit', 'priya', 'rahul', 'ananya', 'neha'")
    role: str = Field("patient", description="'patient'")

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_demo: bool
    created_at: str
