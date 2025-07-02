from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.utils.jwt_utils import verify_jwt_token
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