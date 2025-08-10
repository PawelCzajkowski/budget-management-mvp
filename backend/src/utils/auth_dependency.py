from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from utils.jwt_utils import verify_jwt_token
from exceptions.PremiumFeatureError import PremiumFeatureError
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

async def get_current_user(request: Request) -> dict:
    """
    Verifies JWT using AWS Cognito JWKs. Returns Cognito claims dict.
    'sub' is the user_id, 'name' may be present if set in Cognito.
    """
    # Debug logging
    logger.info(f"Auth headers: {request.headers.get('Authorization')}")
    
    # Get the authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        logger.error("Missing auth header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Missing authorization header"
        )
    
    # Parse the Bearer token
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        logger.error("Invalid auth header format")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    # Get and verify the token
    token = parts[1]
    try:
        payload = verify_jwt_token(token)
        logger.info(f"Token verified successfully: {payload.get('sub')}")
        return payload
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=f"Invalid token: {str(e)}"
        )

async def require_premium_user(request: Request):
    """
    Verifies that the user has premium access by checking Cognito groups.
    Raises PremiumFeatureError if user is not a premium member.
    Returns the user payload if access is granted.
    """
    # Get and verify the user payload
    user_payload = await get_current_user(request)
    
    logger.info(f"Checking premium access for user: {user_payload.get('sub')}")
    
    # Check for cognito:groups claim
    groups = user_payload.get("cognito:groups", [])
    if not isinstance(groups, list):
        logger.error(f"Invalid groups claim format for user {user_payload.get('sub')}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format: groups claim is malformed"
        )
    
    # Verify premium membership
    if "PremiumUser" not in groups:
        logger.warning(f"Non-premium user {user_payload.get('sub')} attempted to access premium feature")
        raise PremiumFeatureError(feature_name="budget corrections")
    
    # Return the user payload if all checks pass
    return user_payload

def get_user_type(groups: list[str]) -> str:
    """
    Determine user type based on Cognito groups.
    Returns 'PREMIUM' for premium users, 'BASIC' for others.
    """
    return "PREMIUM" if "PremiumUser" in groups else "BASIC"

async def require_admin(request: Request) -> dict:
    """
    Check if current user is an admin by verifying Cognito groups.
    Returns the user payload if access is granted.
    Raises HTTPException if user is not an admin.
    """
    logger.info("Checking admin access")
    user_payload = await get_current_user(request)
    
    # Check for cognito:groups claim
    groups = user_payload.get("cognito:groups", [])
    if not isinstance(groups, list):
        logger.error(f"Invalid groups claim format for user {user_payload.get('sub')}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format: groups claim is malformed"
        )
    
    # Verify admin membership
    if "admin" not in groups:
        logger.warning(f"Non-admin user {user_payload.get('sub')} attempted to access admin feature")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    logger.info(f"Admin access granted for user: {user_payload.get('sub')}")
    return user_payload