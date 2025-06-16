from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field


class ExpenseDTO(BaseModel):
    """
    Data Transfer Object for Expense.
    Represents an expense item with its details.
    """
    name: Optional[str] = Field(None, description="Name of the expense item")
    owner: Optional[str] = Field(None, description="Owner or responsible person for the expense")
    account_number: Optional[str] = Field(None, description="Account number associated with the expense")
    amounts: Optional[list[Decimal]] = Field(None, description="List of amounts for each period")

class PeriodDTO(BaseModel):
    """
    Data Transfer Object for Period.
    Represents a budget period with its details and associated items.
    """
    planned_amount: Optional[Decimal] = Field(None, description="Planned amount for the period")
    name: Optional[str] = Field(None, description="Name of the period (e.g., 'Q1 2024')")
    # expenses: Optional[list[ExpenseDTO]] = Field(None, description="List of expense items for this period")

class BudgetDTO(BaseModel):
    """
    Data Transfer Object for Budget.
    Represents a budget with its details and associated items.
    """
    owner: Optional[str] = Field(None, description="Owner or responsible person for the budget")
    name: Optional[str] = Field(None, description="Name of the budget")
    account_number: Optional[str] = Field(None, description="Primary account number for the budget")
    # periods: Optional[list[PeriodDTO]] = Field(None, description="List of budget periods")
    period_names: Optional[list[str]] = Field(None, description="List of names for each budget period")
    planned_amount_per_period: Optional[list[Decimal]] = Field(None, description="List of planned amounts for each period")
    summary: Optional[Decimal] = Field(None, description="Total budget amount across all periods")

class ComplexBudgetDTO(BaseModel):
    """
    Data Transfer Object for Complex Budget.
    Represents a complex budget with additional features and details.
    """
    list_of_Budget: List[BudgetDTO]