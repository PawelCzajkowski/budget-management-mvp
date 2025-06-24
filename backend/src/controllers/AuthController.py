from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel
from jose import jwt
import os
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["auth"])

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-key")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24  # 1 day

class AuthRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/register", status_code=201)
def register(auth: AuthRequest):
    # Mock registration: just log and return success
    print(f"User registered: {auth.email}")
    return {"message": "Registered (mock)"}

@router.post("/login", response_model=TokenResponse)
def login(auth: AuthRequest):
    # Ignore password, accept any login
    payload = {
        "sub": auth.email,  # Use email as sub for local
        "email": auth.email,
        "exp": datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return {"access_token": token, "token_type": "bearer"} 