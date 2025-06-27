import os
import requests
from jose import jwt, JWTError, jwk
from jose.utils import base64url_decode
from fastapi import HTTPException, status
from functools import lru_cache

AWS_REGION = os.getenv("AWS_REGION", "eu-north-1")
USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")
COGNITO_ISSUER = f"https://cognito-idp.{AWS_REGION}.amazonaws.com/{USER_POOL_ID}"
JWKS_URL = f"{COGNITO_ISSUER}/.well-known/jwks.json"

@lru_cache(maxsize=1)
def get_jwks():
    resp = requests.get(JWKS_URL)
    resp.raise_for_status()
    return resp.json()["keys"]

def verify_jwt_token(token: str):
    try:
        headers = jwt.get_unverified_header(token)
        kid = headers["kid"]
        jwks = get_jwks()
        key = next((k for k in jwks if k["kid"] == kid), None)
        if not key:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Public key not found in JWKs")
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=CLIENT_ID,
            issuer=COGNITO_ISSUER
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Invalid authentication credentials: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Token verification failed: {str(e)}",
        ) 