from fastapi import APIRouter, Depends, Header, HTTPException, Request
from typing import Optional
from datetime import datetime
from services.UserUsageService import UserUsageService
from utils.auth_dependency import get_current_user, require_admin
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1")
usage_service = UserUsageService()

class TokenLimitOverride(BaseModel):
    newTokenCount: int
    expiryDate: Optional[datetime] = None

@router.get("/users/import-tokens")
async def get_token_status(
    request: Request,
):
    """Get current token status for the authenticated user"""
    user = await get_current_user(request)
    user_id = user.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user ID")
    return usage_service.get_token_status(user_id)

@router.put("/admin/users/{user_id}/import-limit")
async def override_import_limit(
    user_id: str,
    override: TokenLimitOverride,
    request: Request
):
    """Admin endpoint to override a user's import limit"""
    admin = await require_admin(request)
    try:
        usage_service.admin_override_limit(
            user_id,
            override.newTokenCount,
            override.expiryDate
        )
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
