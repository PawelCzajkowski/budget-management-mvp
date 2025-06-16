from decimal import Decimal
from typing import TypedDict, Annotated, Dict
from enum import Enum

class PeriodType(Enum):
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"

class Owner(TypedDict):
    id: Annotated[str, "Unique identifier for the owner"]
    email: Annotated[str, "Email address of the owner"]
    name: Annotated[str, "Name of the owner"]
    budget_ids: Annotated[list[str], "IDs of budgets owned by this owner"]

class BudgetItem(TypedDict):
    id: Annotated[str, "Unique identifier for the budget item"]
    category: Annotated[str, "Category of the budget item"]
    name: Annotated[str, "Name of the budget item"]
    owner_id: Annotated[str, "Owner of the budget item"]
    account_number: Annotated[str, "Account number for the budget item"]
    planned_amounts: Annotated[list[Decimal], "Planned amounts for each period"]
    period_id: Annotated[str, "ID of the period this item belongs to"]


class Period(TypedDict):
    id: Annotated[str, "Unique identifier for the period"]
    budget_id: Annotated[str, "ID of the budget this period belongs to"]
    type: Annotated[PeriodType, "Type of the period (e.g., WEEK, MONTH, QUARTER, YEAR)"]
    name: Annotated[str, "Name of the period"]
    start_date: Annotated[str, "Start date of the period in ISO format"]
    end_date: Annotated[str, "End date of the period in ISO format"]
    budget_items: Annotated[list[BudgetItem], "Items planned for this period"]

class Budget(TypedDict):
    id: Annotated[str, "Unique identifier for the budget"]
    owner_id: Annotated[str, "ID of the user who owns the budget"]
    name: Annotated[str, "Name of the budget"]
    period_type: Annotated[PeriodType, "Type of the budget period (e.g., WEEK, MONTH, QUARTER, YEAR)"]
    periods: Annotated[list[Period], "Periods associated with the budget"]
    summary: Annotated[Decimal, "Summary amount for the budget item"]
