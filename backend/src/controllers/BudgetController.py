from datetime import datetime, timezone
import uuid
import logging
import os

from fastapi import APIRouter, HTTPException, Response, UploadFile, File, Depends, Body, Path
from decimal import Decimal
from typing import List, Optional

from src.models.BudgetDTO import BudgetDTO, ComplexBudgetDTO, PeriodMismatchValidationRequest, PeriodMismatchValidationResponse, ActionOptionDTO, ApplyPeriodCorrectionsRequest, ApplyPeriodCorrectionsResponse
from src.services.AI_Service import extract_budget_from_bytes
import src.services.BudgetService as budget_service
from src.models.Budget import Budget, BudgetItem, Period, Expense
from src.exceptions.AuthorizationError import AuthorizationError
from src.utils.auth_dependency import get_current_user

router = APIRouter()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_id() -> str:
    return str(uuid.uuid4())

@router.get("/", response_model=list[dict])
async def get_all_budget_ids(user: dict = Depends(get_current_user)):
    try:
        logger.info("Fetching all budget IDs")
        budget_ids = budget_service.get_all_budget_ids(user["sub"])
        logger.info(f"Fetched {len(budget_ids)} budget IDs")
        return budget_ids
    except Exception as e:
        logger.error(f"Error fetching budget IDs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", status_code=201)
async def create_budget(request: ComplexBudgetDTO, response: Response, user: dict = Depends(get_current_user)):
    try:
        logger.info("Creating a new budget")
        budget_id = generate_id()
        utc_now = datetime.now(timezone.utc).isoformat()
        budget = Budget(
            id=budget_id,
            title=request.budget.title or "",
            description=request.budget.description or "",
            created_at=utc_now,
            updated_at=utc_now,
            user_id=user["sub"],
            list_of_budget_items=[
                BudgetItem(
                    owner_id=item.owner or "",
                    label=item.name or "",
                    account_number=item.account_number or "",
                    category="category_placeholder",
                    updated_at=utc_now,
                    periods=[
                        Period(
                            label=name,
                            updated_at=utc_now,
                            planned_amount=period.planned_amount or Decimal("0"),
                            expense_list=[
                                Expense(
                                    name=expense.name or "",
                                    owner_id=expense.owner or "",
                                    account_number=expense.account_number or "",
                                    amount=expense.amount or Decimal("0"),
                                    updated_at=utc_now
                                ) for expense in period.expenses or []
                            ]
                        ) for name, period in zip(item.period_names or request.period_names or [], item.periods or [])
                    ],
                    summary=item.summary or Decimal("0")
                ) for item in request.budget.list_of_budget_items or []
            ],
            period_names=request.period_names
        )
        logger.info(f"Budget created with ID: {budget_id}")
        response.headers["Location"] = f"/budgets/{budget_id}"
        budget_service.create_budget(budget, user["sub"])
    except Exception as e:
        logger.error(f"Error creating budget: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import-csv", response_model=ComplexBudgetDTO)
async def import_csv(file: UploadFile = File(...)):
    """
    Import budget from CSV file
    """
    try:
        logger.info("Importing budget from CSV file")
        contents = await file.read()
        budget_dict = extract_budget_from_bytes(csv_bytes=contents)
        budget = BudgetDTO.model_validate(budget_dict)

        complex_budget = ComplexBudgetDTO.parse_from_BudgetDTO(input=budget)
        logger.info("Budget imported successfully")
        
        return complex_budget
    except Exception as e:
        logger.error(f"Error importing budget from CSV: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{budget_id}", response_model=ComplexBudgetDTO)
async def get_budget(budget_id: str, user: dict = Depends(get_current_user)):
    """
    Get a specific budget by ID
    """
    try:
        logger.info(f"Fetching budget with ID: {budget_id}")
        budget = budget_service.get_budget(budget_id, user["sub"])
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

@router.put("/{budget_id}", status_code=204)
async def update_budget(
    budget_id: str = Path(..., description="ID of the budget to update"),
    request: ComplexBudgetDTO = Body(...),
    user: dict = Depends(get_current_user)
):
    """
    Update an existing budget by ID
    """
    try:
        logger.info(f"Updating budget with ID: {budget_id}")
        budget_service.update_budget(budget_id, request, user["sub"])
        logger.info(f"Budget with ID {budget_id} updated successfully")
    except Exception as e:
        logger.error(f"Error updating budget with ID {budget_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{budget_id}", status_code=204)
async def delete_budget(budget_id: str, user: dict = Depends(get_current_user)):
    """
    Delete a budget by ID
    """
    try:
        logger.info(f"Deleting budget with ID: {budget_id}")
        budget_service.delete_budget(budget_id, user["sub"])
        logger.info(f"Budget with ID {budget_id} deleted successfully")
    except ValueError as e:
        logger.warning(f"Budget with ID {budget_id} not found")
        raise HTTPException(status_code=404, detail=str(e))
    except AuthorizationError as e:
        logger.warning(f"Authorization error: {str(e)}")
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting budget with ID {budget_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/validate-period-mismatch", response_model=PeriodMismatchValidationResponse)
async def validate_period_mismatch(
    request: PeriodMismatchValidationRequest,
    user: dict = Depends(get_current_user)
):
    try:
        return budget_service.validate_period_mismatch(request, user["sub"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/apply-period-corrections", response_model=ApplyPeriodCorrectionsResponse)
async def apply_period_corrections(
    request: ApplyPeriodCorrectionsRequest,
    user: dict = Depends(get_current_user)
):
    try:
        return budget_service.apply_period_corrections(request, user["sub"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
