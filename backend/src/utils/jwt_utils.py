import os
import requests
import logging
from jose import jwt, JWTError, jwk
from jose.utils import base64url_decode
from fastapi import HTTPException, status
from functools import lru_cache

logger = logging.getLogger(__name__)

AWS_REGION = os.getenv("AWS_REGION", "eu-north-1")
USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")
COGNITO_ISSUER = f"https://cognito-idp.{AWS_REGION}.amazonaws.com/{USER_POOL_ID}"
JWKS_URL = f"{COGNITO_ISSUER}/.well-known/jwks.json"

logger.info(f"JWKS_URL: {JWKS_URL}")
logger.info(f"COGNITO_ISSUER: {COGNITO_ISSUER}")
logger.info(f"CLIENT_ID: {CLIENT_ID}")

@lru_cache(maxsize=1)
def get_jwks():
    try:
        resp = requests.get(JWKS_URL)
        resp.raise_for_status()
        jwks = resp.json()["keys"]
        logger.info(f"JWKS fetched successfully: {len(jwks)} keys")
        return jwks
    except Exception as e:
        logger.error(f"Failed to fetch JWKS: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch JWKS: {str(e)}",
        )

def verify_jwt_token(token: str):
    try:
        # Log token info for debugging (don't log the full token in production)
        logger.info(f"Verifying token (first 10 chars): {token[:10]}...")
        
        # Get token headers
        headers = jwt.get_unverified_header(token)
        logger.info(f"Token headers: {headers}")
        
        # Get key ID from token header
        kid = headers.get("kid")
        if not kid:
            logger.error("No 'kid' in token header")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No 'kid' in token header")
        
        # Get JWKs
        jwks = get_jwks()
        
        # Find matching key
        key = next((k for k in jwks if k["kid"] == kid), None)
        if not key:
            logger.error(f"Public key not found in JWKs for kid: {kid}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Public key not found in JWKs")
        
        # Log the key being used (without private parts)
        logger.info(f"Using key: kid={key.get('kid')}, kty={key.get('kty')}, alg={key.get('alg')}")
        
        # For debugging, get the unverified payload
        try:
            unverified_payload = jwt.get_unverified_claims(token)
            logger.info(f"Unverified token claims: token_use={unverified_payload.get('token_use')}, aud={unverified_payload.get('aud')}")
        except Exception as e:
            logger.warning(f"Could not get unverified claims: {str(e)}")
        
        # Decode and verify token
        options = {
            "verify_signature": True,
            "verify_aud": True,
            "verify_iat": True,
            "verify_exp": True,
            "verify_nbf": True,
            "verify_iss": True,
            "verify_sub": True,
            "verify_jti": True,
            "verify_at_hash": False,  # Skip at_hash verification which can be problematic
            "require_exp": True,
            "require_iat": True,
            "require_nbf": False,
        }
        
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=CLIENT_ID,
            issuer=COGNITO_ISSUER,
            options=options
        )
        
        logger.info(f"Token verified successfully for user: {payload.get('sub')}")
        return payload
        
    except JWTError as e:
        logger.error(f"JWT error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Invalid authentication credentials: {str(e)}",
        )
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Token verification failed: {str(e)}",
        ) 