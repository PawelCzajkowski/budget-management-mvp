from models.Budget import Budget, BudgetItem, Period, Expense
from repositories.BugetRepository import BudgetRepository
from models.BudgetDTO import ComplexBudgetDTO, BudgetItemDTO, PeriodMismatchValidationRequest, PeriodMismatchValidationResponse, ActionOptionDTO, ApplyPeriodCorrectionsRequest, ApplyPeriodCorrectionsResponse
from decimal import Decimal
from exceptions.AuthorizationError import AuthorizationError
from datetime import datetime, timezone


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
                category=item.category or "",
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
                    ) for name, period in zip(request.period_names or [], item.periods or [])
                ],
                summary=item.summary or Decimal("0")
            ) for item in request.budget.list_of_budget_items or []
        ],
        period_names=request.period_names
    )
    budget_repository.update_budget(budget)
    return ComplexBudgetDTO.parse_from_Budget(budget)

def delete_budget(budget_id: str, user_id: str) -> None:
    """
    Delete a budget by its ID for a specific user.
    """
    budgets_list = budget_repository.get_budgets_id_by_user(user_id)

    if not any(id.get('id') == budget_id for id in budgets_list):
        raise ValueError(f"Budget with ID {budget_id} not found")
    return budget_repository.delete_budget(budget_id)

def validate_period_mismatch(request: PeriodMismatchValidationRequest, user_id: str) -> PeriodMismatchValidationResponse:
    expenses_sum = sum([e.amount for e in request.expenses])
    difference = request.planned_amount - expenses_sum

    actions = []
    # Always allow "pending"
    actions.append(ActionOptionDTO(
        key="pending",
        label="Expenses are pending",
        description="You can wait for more expenses to be added."
    ))

    # If there are future periods, allow "move"
    future_periods = [p for p in request.all_periods if p.period_id != request.period_id]
    if future_periods and difference > 0:
        actions.append(ActionOptionDTO(
            key="move",
            label="Move planned expense",
            description="Move the remaining planned amount to another period.",
            target_periods=[{"period_id": p.period_id} for p in future_periods],
            max_movable_amount=difference
        ))

    # If there is a positive difference, allow "savings"
    if difference > 0:
        actions.append(ActionOptionDTO(
            key="savings",
            label="Mark as savings",
            description="The saved amount can be redistributed to future periods.",
            saved_amount=difference,
            redistributable_periods=[{"period_id": p.period_id} for p in future_periods]
        ))

    # If expenses exceed planned, allow "exceeded"
    if expenses_sum > request.planned_amount:
        actions.append(ActionOptionDTO(
            key="exceeded",
            label="Expenses exceeded",
            description="Expenses have exceeded the planned amount. Please review and correct."
        ))

    summary = {
        "planned_amount": request.planned_amount,
        "expenses_sum": expenses_sum,
        "difference": difference
    }

    return PeriodMismatchValidationResponse(actions=actions, summary=summary)

def apply_period_corrections(request: ApplyPeriodCorrectionsRequest, user_id: str) -> ApplyPeriodCorrectionsResponse:
    budget = budget_repository.get_budget(request.budget_id)
    if not budget:
        return ApplyPeriodCorrectionsResponse(status="error", message="Budget not found")
    if budget["user_id"] != user_id:
        return ApplyPeriodCorrectionsResponse(status="error", message="Unauthorized")

    # Find the relevant budget item and period
    updated = False
    for item in budget["list_of_budget_items"]:
        for period in item["periods"]:
            if period["label"] == request.period_id:
                if request.action == "move" and request.move_details:
                    # Subtract from current period
                    period["planned_amount"] -= request.move_details.amount
                    # Add to target period
                    for target_item in budget["list_of_budget_items"]:
                        for target_period in target_item["periods"]:
                            if target_period["label"] == request.move_details.target_period_id:
                                target_period["planned_amount"] += request.move_details.amount
                                updated = True
                elif request.action == "savings" and request.redistribution:
                    # Subtract total redistributed from current period
                    total_redistributed = sum([r.amount for r in request.redistribution])
                    period["planned_amount"] -= total_redistributed
                    # Add to each target period
                    for r in request.redistribution:
                        for target_item in budget["list_of_budget_items"]:
                            for target_period in target_item["periods"]:
                                if target_period["label"] == r.period_id:
                                    target_period["planned_amount"] += r.amount
                                    updated = True
                elif request.action == "pending":
                    # No changes
                    updated = True
                elif request.action == "exceeded":
                    # No changes, just mark
                    updated = True
    if not updated:
        return ApplyPeriodCorrectionsResponse(status="error", message="No changes applied or invalid period/action")

    budget_repository.update_budget(budget)
    # Convert Budget object to dict for response
    updated_budget = None
    if not isinstance(budget, dict):
        try:
            parsed = ComplexBudgetDTO.parse_from_Budget(budget)
            if hasattr(parsed, 'model_dump'):
                result = parsed.model_dump()
                if isinstance(result, dict):
                    updated_budget = result
        except Exception:
            updated_budget = None
    # If budget is already a dict, do not assign it to updated_budget to avoid linter error
    return ApplyPeriodCorrectionsResponse(
        status="success",
        message="Budget updated successfully.",
        updated_budget=updated_budget
    )
