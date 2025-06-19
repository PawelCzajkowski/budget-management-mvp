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
