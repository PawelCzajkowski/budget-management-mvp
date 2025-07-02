import os
import sys
from fastapi import FastAPI, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from src.services.AI_Service import extract_budget_from_csv
from src.controllers import BudgetController
from src.utils.auth_dependency import get_current_user
import src.services.BudgetService as budget_service
from mangum import Mangum
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Debug prints for Lambda troubleshooting
print("Python Path:", sys.path)
print("Current directory:", os.getcwd())
print("Directory contents:", os.listdir())
print("Environment variables:", dict(os.environ))

# Environment variables for AWS Lambda
AWS_REGION = os.getenv("AWS_REGION")
DYNAMODB_TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").strip("'")

print(f"ALLOWED_ORIGINS: {ALLOWED_ORIGINS}")
print(f"COGNITO_USER_POOL_ID: {COGNITO_USER_POOL_ID}")
print(f"COGNITO_CLIENT_ID: {COGNITO_CLIENT_ID}")

app = FastAPI(
    title="Budget Management API",
    description="API for managing budgets and expenses",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "Access-Control-Allow-Origin"],
    expose_headers=["Content-Type", "Authorization"],
    max_age=86400,  # 24 hours
)

# Add a middleware to log requests for debugging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Request path: {request.url.path}")
    print(f"Request method: {request.method}")
    print(f"Request headers: {request.headers}")
    response = await call_next(request)
    print(f"Response status: {response.status_code}")
    return response

# Root path handler
@app.get("/")
async def root():
    return RedirectResponse(url="/budgets")

# Direct handler for /budgets endpoint
@app.get("/budgets")
async def get_all_budgets(user: dict = Depends(get_current_user)):
    try:
        logger.info("Fetching all budget IDs from root handler")
        budget_ids = budget_service.get_all_budget_ids(user["sub"])
        logger.info(f"Fetched {len(budget_ids)} budget IDs from root handler")
        return budget_ids
    except Exception as e:
        logger.error(f"Error fetching budget IDs from root handler: {str(e)}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

# Include routers
app.include_router(BudgetController.router, prefix="/budgets", tags=["budgets"])

# Create a Mangum handler for AWS Lambda
handler = Mangum(app)

# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8888)
