import pytest
from fastapi import HTTPException
from unittest.mock import Mock, patch
from utils.auth_dependency import require_premium_user
from exceptions.PremiumFeatureError import PremiumFeatureError

# Test data
PREMIUM_USER_PAYLOAD = {
    "sub": "test-user-id",
    "cognito:groups": ["PremiumUser"],
    "token_use": "access"
}

NON_PREMIUM_USER_PAYLOAD = {
    "sub": "test-user-id",
    "cognito:groups": ["BasicUser"],
    "token_use": "access"
}

INVALID_GROUPS_PAYLOAD = {
    "sub": "test-user-id",
    "cognito:groups": "not-a-list",
    "token_use": "access"
}

@pytest.mark.asyncio
async def test_require_premium_user_with_premium_user():
    """Test that premium users can access premium features and get user data"""
    result = await require_premium_user(PREMIUM_USER_PAYLOAD)
    assert result == PREMIUM_USER_PAYLOAD
    assert result["sub"] == "test-user-id"  # Verify user data is returned
    assert "PremiumUser" in result["cognito:groups"]  # Verify groups are preserved

@pytest.mark.asyncio
async def test_require_premium_user_with_non_premium_user():
    """Test that non-premium users are denied access"""
    with pytest.raises(PremiumFeatureError) as exc_info:
        await require_premium_user(NON_PREMIUM_USER_PAYLOAD)
    
    assert exc_info.value.status_code == 403
    assert "requires a premium subscription" in str(exc_info.value.detail)
    assert isinstance(exc_info.value.detail, dict)  # Verify error structure
    assert "upgrade_info" in exc_info.value.detail  # Verify upgrade info is included

@pytest.mark.asyncio
async def test_require_premium_user_with_invalid_groups():
    """Test handling of invalid groups claim"""
    with pytest.raises(HTTPException) as exc_info:
        await require_premium_user(INVALID_GROUPS_PAYLOAD)
    
    assert exc_info.value.status_code == 401
    assert "groups claim is malformed" in str(exc_info.value.detail)

@pytest.mark.asyncio
async def test_require_premium_user_with_no_groups():
    """Test handling of missing groups claim"""
    with pytest.raises(PremiumFeatureError) as exc_info:
        await require_premium_user({"sub": "test-user-id"})
    
    assert exc_info.value.status_code == 403

@pytest.mark.asyncio
async def test_require_premium_user_full_payload_preserved():
    """Test that all user payload fields are preserved"""
    full_payload = {
        "sub": "test-user-id",
        "cognito:groups": ["PremiumUser"],
        "email": "test@example.com",
        "custom:field": "value",
        "token_use": "access"
    }
    
    result = await require_premium_user(full_payload)
    assert result == full_payload  # Verify entire payload is returned
    assert all(key in result for key in full_payload.keys())  # Verify no fields are lost
