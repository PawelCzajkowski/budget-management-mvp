import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.AI_Service import extract_budget_from_csv
from controllers import BudgetController
from controllers.AuthController import router as auth_router
from mangum import Mangum

AWS_REGION = os.getenv("AWS_REGION", "eu-north-1") # Domyślnie dla lokalnego
DYNAMODB_ENDPOINT_URL = os.getenv("DYNAMODB_ENDPOINT_URL", "http://localhost:5555") # Domyślnie dla lokalnego
DYNAMODB_TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "budgets") # Domyślnie dla lokalnego

COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "your_local_mock_pool_id")
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID", "your_local_mock_client_id") # Często niepotrzebne w backendzie do weryfikacji, ale warto mieć dla spójności


app = FastAPI(
    title="Budget Management API",
    description="API for managing budgets and expenses",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(BudgetController.router, prefix="/budgets", tags=["budgets"])
app.include_router(auth_router)

handler = Mangum(app)
