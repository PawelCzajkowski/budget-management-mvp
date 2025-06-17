from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List, cast
import json
import os
from models.BudgetDTO import BudgetDTO, ComplexBudgetDTO, BudgetListDTO
from services.AI_Service import extract_budget_from_bytes, extract_budget_from_csv

router = APIRouter()

# Load mock data
MOCK_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'tests', 'mock-import-csv-response.json')

def get_mock_budget_data():
    with open(MOCK_DATA_PATH, 'r') as f:
        return json.load(f)

@router.get("/", response_model=List[BudgetDTO])
async def get_budgets():
    """
    Get all budgets
    """
    try:
        # Placeholder - replace with actual service call
        budgets = []
        return budgets
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=BudgetDTO)
async def create_budget(budget: BudgetDTO):
    """
    Create a new budget
    """
    try:
        # Placeholder - replace with actual service call
        return budget
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import-csv")
async def import_csv(file: UploadFile = File(...)):
    """
    Import budget from CSV file
    """
    try:
        contents = await file.read()
        # budget_list = extract_budget_from_bytes(csv_bytes=contents)
        budget_list_dict = cast(BudgetListDTO, get_mock_budget_data())
        budget_list = BudgetListDTO.model_validate(budget_list_dict)

        complex_budget = ComplexBudgetDTO.parse_from_budget_list(input=budget_list)
        return complex_budget
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{budget_id}", response_model=BudgetDTO)
async def get_budget(budget_id: str):
    """
    Get a specific budget by ID
    """
    try:
        # Placeholder - replace with actual service call
        budget = {}
        if not budget:
            raise HTTPException(status_code=404, detail="Budget not found")
        return budget
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
