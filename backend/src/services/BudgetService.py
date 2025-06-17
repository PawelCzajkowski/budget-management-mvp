from models.Budget import Budget
from repositories.BugetRepository import BudgetRepository
from models.BudgetDTO import ComplexBudgetDTO, BudgetItemDTO
from decimal import Decimal

budget_repository = BudgetRepository()

def create_budget(budget: Budget, user_id: str) -> ComplexBudgetDTO:
    """
    Create a new budget.
    Returns the created budget as ComplexBudgetDTO.
    """

    budget_repository.put_budget(budget)

    budget_items = [
        BudgetItemDTO(
            name=item['label'],
            owner=item['owner_id'],
            account_number=item['account_number'],
            planned_amount_per_period=[
                period['planned_amount'] 
                for period in item['periods']
            ],
            summary=item['summary'],
            period_names=[period['label'] for period in item['periods']]
        ) for item in budget['list_of_budget_items']
    ]

    complex_budget = ComplexBudgetDTO(
        list_of_budgets=budget_items,
        period_names=budget['period_names']
    )

    return complex_budget
