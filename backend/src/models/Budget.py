from decimal import Decimal
from typing import TypedDict, Annotated
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

class Expense(TypedDict):
    id: Annotated[str, "Unique identifier for the expense item"]
    category: Annotated[str, "Category of the expense item"]
    name: Annotated[str, "Name of the expense item"]
    owner_id: Annotated[str, "Owner of the expense item"]
    account_number: Annotated[str, "Account number for the expense item"]
    amount: Annotated[Decimal, "Planned amounts for each period"]
    period_id: Annotated[str, "ID of the period this item belongs to"]
    budget_id: Annotated[str, "ID of the budget this item belongs to"]


class Period(TypedDict):
    id: Annotated[str, "Unique identifier for the period"]
    budget_id: Annotated[str, "ID of the budget this period belongs to"]
    budget_item_id: Annotated[str, "ID of the budget item this period belongs to"]
    # type: Annotated[PeriodType, "Type of the period (e.g., WEEK, MONTH, QUARTER, YEAR)"]
    label: Annotated[str, "Name of the period"]
    # start_date: Annotated[str, "Start date of the period in ISO format"]
    # end_date: Annotated[str, "End date of the period in ISO format"]
    expense_list: Annotated[list[Expense], "Items planned for this period"]

class BudgetItem(TypedDict):
    id: Annotated[str, "Unique identifier for the budget item"]
    owner_id: Annotated[str, "ID of the user who owns the budget item"]
    label: Annotated[str, "Name of the budget item"]
    account_number: Annotated[str, "Account number for the expense item"]
    category: Annotated[str, "Category of the expense item"]
    # period_type: Annotated[PeriodType, "Type of the budget period (e.g., WEEK, MONTH, QUARTER, YEAR)"]
    periods: Annotated[list[Period], "Periods associated with the budget item"]
    summary: Annotated[Decimal, "Summary amount for the budget item"]

class Budget(TypedDict):
    id: Annotated[str, "Unique identifier for the budget"]
    name: Annotated[str, "Name of the budget"]
    created_at: Annotated[str, "Creation date of the budget in ISO format"]
    updated_at: Annotated[str, "Last update date of the budget in ISO format"]
    user_id: Annotated[str, "ID of the user who owns the budgets"]
    list_of_budget_items: Annotated[list[BudgetItem], "List of budget items"]
    period_names: Annotated[list[str], "List of names for each budget period"]
