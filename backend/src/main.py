import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.AI_Service import extract_budget_from_csv
from controllers import BudgetController
from mangum import Mangum

# Environment variables for AWS Lambda
AWS_REGION = os.getenv("AWS_REGION")
DYNAMODB_TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")

app = FastAPI(
    title="Budget Management API",
    description="API for managing budgets and expenses",
    version="1.0.0"
)

# Configure CORS for Lambda deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(BudgetController.router, prefix="/budgets", tags=["budgets"])

# Lambda handler for AWS Lambda deployment
handler = Mangum(app)
