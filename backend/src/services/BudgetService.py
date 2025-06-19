from models.Budget import Budget
from repositories.BugetRepository import BudgetRepository
from models.BudgetDTO import ComplexBudgetDTO, BudgetItemDTO
from decimal import Decimal
from exceptions.AuthorizationError import AuthorizationError

budget_repository = BudgetRepository()

def create_budget(budget: Budget, user_id: str) -> ComplexBudgetDTO:
    """
    Create a new budget.
    Returns the created budget as ComplexBudgetDTO.
    """

    budget_repository.put_budget(budget)

    return ComplexBudgetDTO.parse_from_Budget(budget)

def get_budget(budget_id: str, user_id: str) -> Budget:
    """
    Retrieve a budget by its ID.
    Returns the Budget object.
    """
    budget = budget_repository.get_budget(budget_id)
    if not budget:
        raise ValueError(f"Budget with ID {budget_id} not found")
    if budget['user_id'] != user_id:
        raise AuthorizationError(f"Budget with ID {budget_id} does not belong to user {user_id}")

    return budget

def get_all_budget_ids(user_id: str) -> list[dict]:
    """
    Retrieve all budget IDs and titles for a user.
    Returns a list of budget IDs and titles.
    """
    ids = budget_repository.get_budgets_id_by_user(user_id)
    return ids


# def get_budgets(user_id: str) -> list[Budget]:
#     """
#     Retrieve all budgets for a user.
#     Returns a list of Budgets.
#     """
#     budgets = budget_repository.get_budgets_by_user(user_id)

#     all_budgets = []
#     for budget in budgets:
#         budget_items = [
#             BudgetItemDTO(
#                 name=item['label'],
#                 owner=item['owner_id'],
#                 account_number=item['account_number'],
#                 planned_amount_per_period=[
#                     period['planned_amount'] 
#                     for period in item['periods']
#                 ],
#                 summary=item['summary'],
#                 period_names=[period['label'] for period in item['periods']]
#             ) for item in budget['list_of_budget_items']
#         ]

#         complex_budget = ComplexBudgetDTO(
#             list_of_budgets=budget_items,
#             period_names=budget['period_names']
#         )
#         all_budgets.append(complex_budget)

#     return all_budgets

def update_budget(budget_id: str, request: ComplexBudgetDTO, user_id: str) -> ComplexBudgetDTO:
    """
    Update an existing budget.
    Returns the updated budget as ComplexBudgetDTO.
    """
    from models.Budget import Budget, BudgetItem, Period, Expense
    from decimal import Decimal
    from datetime import datetime, timezone

    utc_now = datetime.now(timezone.utc).isoformat()

    # Retrieve the original budget to keep its created_at value
    original_budget = budget_repository.get_budget(budget_id)
    if not original_budget:
        raise ValueError(f"Budget with ID {budget_id} not found")
    if original_budget['user_id'] != user_id:
        raise AuthorizationError(f"Budget with ID {budget_id} does not belong to user {user_id}")

    created_at = original_budget.get('created_at', utc_now)

    budget = Budget(
        id=budget_id,
        title=request.budget.title or "",
        description=request.budget.description or "",
        created_at=created_at,  # Keep the original created_at
        updated_at=utc_now,
        user_id=user_id,
        list_of_budget_items=[
            BudgetItem(
                updated_at=utc_now,
                owner_id=item.owner or "",
                label=item.name or "",
                account_number=item.account_number or "",
                category="category_placeholder",
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
                    ) for name, period in zip(item.period_names or [], item.periods or [])
                ],
                summary=item.summary or Decimal("0")
            ) for item in request.budget.list_of_budget_items or []
        ],
        period_names=request.period_names
    )
    budget_repository.update_budget(budget)
    return ComplexBudgetDTO.parse_from_Budget(budget)
