"""
AWS Lambda deployment configuration
"""
import os

# Lambda function configuration
LAMBDA_CONFIG = {
    "function_name": "budget-management-api",
    "runtime": "python3.11",
    "handler": "src.main.handler",
    "timeout": 30,  # seconds
    "memory_size": 512,  # MB
    "environment_variables": {
        "AWS_REGION": os.getenv("AWS_REGION", "eu-north-1"),
        "DYNAMODB_TABLE_NAME": os.getenv("DYNAMODB_TABLE_NAME", "budget-management-mvp-budgets"),
        "COGNITO_USER_POOL_ID": os.getenv("COGNITO_USER_POOL_ID"),
    }
}

# API Gateway configuration
API_GATEWAY_CONFIG = {
    "rest_api_name": "Budget Management API",
    "stage_name": "prod",
    "cors_origins": ["*"],  # Configure with specific origins in production
    "enable_logging": True,
    "log_level": "INFO"
}

# Required environment variables for deployment
REQUIRED_ENV_VARS = [
    "AWS_REGION",
    "DYNAMODB_TABLE_NAME", 
    "COGNITO_USER_POOL_ID"
]

def validate_environment():
    """Validate that all required environment variables are set"""
    missing_vars = []
    for var in REQUIRED_ENV_VARS:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
    
    return True 