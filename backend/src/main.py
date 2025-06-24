import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.AI_Service import extract_budget_from_csv
from controllers import BudgetController
from controllers.AuthController import router as auth_router

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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8888)
    # extract_budget_from_csv(file_path="backend/budget-test-data.csv")