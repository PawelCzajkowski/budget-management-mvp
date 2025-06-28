from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
import os
import logging
import boto3
from botocore.exceptions import ClientError

router = APIRouter(prefix="/auth", tags=["auth"])

# Configure logging
logger = logging.getLogger(__name__)

AWS_REGION = os.getenv("AWS_REGION")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")

cognito_client = boto3.client("cognito-idp", region_name=AWS_REGION)

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class RegisterResponse(BaseModel):
    message: str
    user_id: str

def _validate_password(password: str) -> bool:
    # Simple password validation (Cognito will also enforce its own policy)
    return len(password) >= 8

@router.post("/register", response_model=RegisterResponse, status_code=201)
def register(request: RegisterRequest):
    """
    Register a new user in AWS Cognito.
    """
    if not request.username or not request.email or not request.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username, email, and password are required"
        )
    if not _validate_password(request.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    try:
        response = cognito_client.sign_up(
            ClientId=COGNITO_CLIENT_ID,
            Username=request.email,
            Password=request.password,
            UserAttributes=[
                {"Name": "email", "Value": request.email},
                {"Name": "name", "Value": request.username}
            ]
        )
        user_sub = response["UserSub"]
        logger.info(f"Cognito user registered: {request.username} ({request.email}) with sub: {user_sub}")
        return RegisterResponse(
            message="User registered successfully. Please check your email to confirm your account.",
            user_id=user_sub
        )
    except cognito_client.exceptions.UsernameExistsException:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this username or email already exists"
        )
    except ClientError as e:
        logger.error(f"Cognito registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest):
    """
    Authenticate user with AWS Cognito and return JWT token.
    """
    if not request.email or not request.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required"
        )
    try:
        # Cognito default is to use username, but we want to allow login by email
        # So we need to find the username for the given email
        user_resp = cognito_client.list_users(
            UserPoolId=COGNITO_USER_POOL_ID,
            Filter=f'email = "{request.email}"'
        )
        users = user_resp.get("Users", [])
        if not users:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        username = users[0]["Username"]
        auth_resp = cognito_client.initiate_auth(
            ClientId=COGNITO_CLIENT_ID,
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={
                "USERNAME": username,
                "PASSWORD": request.password
            }
        )
        access_token = auth_resp["AuthenticationResult"]["AccessToken"]
        logger.info(f"User logged in via Cognito: {request.email} (username: {username})")
        return TokenResponse(access_token=access_token, token_type="bearer")
    except cognito_client.exceptions.NotAuthorizedException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    except cognito_client.exceptions.UserNotConfirmedException:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account not confirmed. Please check your email."
        )
    except ClientError as e:
        logger.error(f"Cognito login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        ) 