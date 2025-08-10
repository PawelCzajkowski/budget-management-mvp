from fastapi import HTTPException

class BudgetLimitExceededError(HTTPException):
    """Exception raised when a free user attempts to create more than one budget."""
    
    def __init__(self):
        super().__init__(
            status_code=403,
            detail={
                "code": "BUDGET_LIMIT_EXCEEDED",
                "message": "Free users can only create one budget. Upgrade to Premium for unlimited budgets.",
                "feature": "multiple_budgets"
            }
        )
