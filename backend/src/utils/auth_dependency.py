from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from utils.jwt_utils import verify_jwt_token
from exceptions.PremiumFeatureError import PremiumFeatureError
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verifies JWT using AWS Cognito JWKs. Returns Cognito claims dict.
    'sub' is the user_id, 'name' may be present if set in Cognito.
    """
    # Debug logging
    logger.info(f"Auth headers: {request.headers.get('Authorization')}")
    
    # Handle missing or invalid credentials
    if credentials is None:
        # Try to get the token directly from the Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]
                try:
                    payload = verify_jwt_token(token)
                    logger.info(f"Token verified successfully: {payload.get('sub')}")
                    return payload
                except Exception as e:
                    logger.error(f"Token verification failed: {str(e)}")
                    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {str(e)}")
        
        logger.error("Missing or invalid auth header")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid auth header")
    
    # Process standard credentials
    token = credentials.credentials
    try:
        payload = verify_jwt_token(token)
        logger.info(f"Token verified successfully: {payload.get('sub')}")
        return payload
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {str(e)}")

async def require_premium_user(user_payload: dict = Depends(get_current_user)):
    """
    Verifies that the user has premium access by checking Cognito groups.
    Raises PremiumFeatureError if user is not a premium member.
    Returns the user payload if access is granted.
    """
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