from datetime import datetime, timezone
import json
import os
import uuid
import logging

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import cast
from decimal import Decimal

from models.BudgetDTO import BudgetDTO, ComplexBudgetDTO
from services.AI_Service import extract_budget_from_bytes, extract_budget_from_csv
import services.BudgetService as budget_service
from models.Budget import Budget, BudgetItem, Period
from exceptions.AuthorizationError import AuthorizationError

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load mock data
MOCK_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'tests', 'mock-import-csv-response.json')

def get_mock_budget_data():
    with open(MOCK_DATA_PATH, 'r') as f:
        return json.load(f)

def mock_credentials():
    return {"user_id": "mock_user_id", "token": "mock_token"}


def generate_id() -> str:
    return str(uuid.uuid4())


# @router.get("/", response_model=List[ComplexBudgetDTO])
# async def get_budgets(credentials: dict = Depends(mock_credentials)):
#     """
#     Get all budgets
#     """
#     try:
#         logger.info("Fetching all budgets")
#         # Placeholder - replace with actual service call

#         budgets = budget_service.get_budget
#         logger.info(f"Fetched {len(budgets)} budgets")
#         return budgets
#     except Exception as e:
#         logger.error(f"Error fetching budgets: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/", response_model=list[str])
async def get_all_budget_ids(credentials: dict = Depends(mock_credentials)):
    """
    Get all budget IDs
    """
    try:
        logger.info("Fetching all budget IDs")
        budget_ids = budget_service.get_all_budget_ids(credentials["user_id"])
        logger.info(f"Fetched {len(budget_ids)} budget IDs")
        
        return budget_ids
    except Exception as e:
        logger.error(f"Error fetching budget IDs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=ComplexBudgetDTO, status_code=201)
async def create_budget(budget_dto: ComplexBudgetDTO, credentials: dict = Depends(mock_credentials)):
    """
    Create a new budget
    """
    try:
        logger.info("Creating a new budget")
        budget_id = generate_id()
        budget_item_id = generate_id()
        period_id = generate_id()

        utc_now = datetime.now(timezone.utc).isoformat()

        # Parse ComplexBudgetDTO into Budget object
        budget = Budget(
            id=budget_id,
            name= "IMPLEMENT IN THE FUTURE",  # TODO Ensure name is not None
            created_at=utc_now,
            updated_at=utc_now,
            user_id=credentials["user_id"],  # TODO Replace with actual user ID logic
            list_of_budget_items=[
                BudgetItem(
                    id=budget_item_id,
                    created_at=utc_now,
                    updated_at=utc_now,
                    owner_id=item.owner or "",
                    label=item.name or "",
                    account_number=item.account_number or "",
                    category="category_placeholder",  # TODO Replace with actual category logic
                    periods=[
                        Period(
                            id=period_id,
                            label=name,
                            created_at=utc_now,
                            updated_at=utc_now,
                            planned_amount=period.planned_amount or Decimal("0"),  # Ensure planned_amount is not None
                            budget_id=budget_id,
                            budget_item_id=budget_item_id,
                            expense_list=[]  # Placeholder for expenses, replace with actual logic
                        ) for name, period in zip(item.period_names or [], item.periods or [])
                    ],
                    summary=item.summary or Decimal("0")  # Ensure summary is not None
                ) for item in budget_dto.budget.list_of_budget_items or []
            ],
            period_names=budget_dto.period_names
        )

        logger.info(f"Budget created with ID: {budget_id}")
        return budget_service.create_budget(budget, credentials["user_id"])
    except Exception as e:
        logger.error(f"Error creating budget: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import-csv")
async def import_csv(file: UploadFile = File(...), credentials: dict = Depends(mock_credentials)):
    """
    Import budget from CSV file
    """
    try:
        logger.info("Importing budget from CSV file")
        contents = await file.read()
        budget_dict = extract_budget_from_bytes(csv_bytes=contents)
        # budget_dict = cast(BudgetDTO, get_mock_budget_data())
        budget = BudgetDTO.model_validate(budget_dict)

        complex_budget = ComplexBudgetDTO.parse_from_BudgetDTO(input=budget)
        logger.info("Budget imported successfully")
        
        return complex_budget
    except Exception as e:
        logger.error(f"Error importing budget from CSV: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{budget_id}", response_model=ComplexBudgetDTO)
async def get_budget(budget_id: str, credentials: dict = Depends(mock_credentials)):
    """
    Get a specific budget by ID
    """
    try:
        logger.info(f"Fetching budget with ID: {budget_id}")
        budget = budget_service.get_budget(budget_id, credentials["user_id"])
        logger.info(f"Budget with ID {budget_id} fetched successfully")
        
        return ComplexBudgetDTO.parse_from_Budget(budget)
    except ValueError as e:
        logger.warning(f"Budget with ID {budget_id} not found")
        raise HTTPException(status_code=404, detail=str(e))
    except AuthorizationError as e:
        logger.warning(f"Authorization error: {str(e)}")
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching budget with ID {budget_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
