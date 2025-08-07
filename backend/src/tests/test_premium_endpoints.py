from fastapi.testclient import TestClient
from unittest.mock import patch
from decimal import Decimal
from main import app
from models.BudgetDTO import PeriodMismatchValidationRequest, ApplyPeriodCorrectionsRequest
from models.Budget import Period, Expense
import datetime

client = TestClient(app)

# Test data
PREMIUM_TOKEN = "premium-user-token"
NON_PREMIUM_TOKEN = "non-premium-user-token"

PREMIUM_USER_PAYLOAD = {
    "sub": "test-premium-user",
    "cognito:groups": ["PremiumUser"],
    "token_use": "access"
}

NON_PREMIUM_USER_PAYLOAD = {
    "sub": "test-basic-user",
    "cognito:groups": ["BasicUser"],
    "token_use": "access"
}

TEST_EXPENSE: Expense = {
    "name": "Test Expense 1",
    "owner_id": "test-owner-1",
    "account_number": "123-456",
    "amount": Decimal("500.00"),
    "updated_at": datetime.datetime.now().isoformat()
}

TEST_PERIOD: Period = {
    "label": "Test Period",
    "planned_amount": Decimal("1000.00"),
    "expense_list": [TEST_EXPENSE],
    "updated_at": datetime.datetime.now().isoformat()
}

TEST_REQUEST_DATA = {
    "budget_id": "test-budget",
    "period": TEST_PERIOD,
    "planned_amount": Decimal("1000.00"),
    "expenses": [TEST_EXPENSE],
    "all_periods": [TEST_PERIOD]
}

def setup_module():
    """Setup any test dependencies"""
    pass

def test_validate_period_mismatch_premium_user(monkeypatch):
    """Test that premium users can access the period mismatch validation endpoint"""
    user_sub = "test-premium-user"
    def mock_verify_jwt(token):
        return PREMIUM_USER_PAYLOAD

    def mock_validate_period_mismatch(request, sub):
        # Verify the user sub is correctly passed through
        assert sub == user_sub
        return {"status": "success"}
    
    monkeypatch.setattr("utils.jwt_utils.verify_jwt_token", mock_verify_jwt)
    monkeypatch.setattr("services.BudgetService.validate_period_mismatch", mock_validate_period_mismatch)
    
    response = client.post(
        "/budgets/validate-period-mismatch",
        headers={"Authorization": f"Bearer {PREMIUM_TOKEN}"},
        json=TEST_REQUEST_DATA
    )
    
    assert response.status_code == 200

def test_validate_period_mismatch_non_premium_user(monkeypatch):
    """Test that non-premium users cannot access the period mismatch validation endpoint"""
    def mock_verify_jwt(token):
        return NON_PREMIUM_USER_PAYLOAD
    
    # Mock should never be called for non-premium users
    def mock_validate_period_mismatch(request, sub):
        raise AssertionError("Service should not be called for non-premium users")
    
    monkeypatch.setattr("utils.jwt_utils.verify_jwt_token", mock_verify_jwt)
    monkeypatch.setattr("services.BudgetService.validate_period_mismatch", mock_validate_period_mismatch)
    
    response = client.post(
        "/budgets/validate-period-mismatch",
        headers={"Authorization": f"Bearer {NON_PREMIUM_TOKEN}"},
        json=TEST_REQUEST_DATA
    )
    
    assert response.status_code == 403
    error_response = response.json()
    assert "premium subscription" in error_response["detail"]
    assert "upgrade_info" in error_response

def test_apply_period_corrections_premium_user(monkeypatch):
    """Test that premium users can access the apply period corrections endpoint"""
    def mock_verify_jwt(token):
        return PREMIUM_USER_PAYLOAD
    
    monkeypatch.setattr("utils.jwt_utils.verify_jwt_token", mock_verify_jwt)
    
    request_data = {
        "budget_id": "test-budget",
        "period": TEST_PERIOD,
        "action": "REDISTRIBUTE",
        "planned_amount": Decimal("1000.00")
    }
    
    response = client.post(
        "/budgets/apply-period-corrections",
        headers={"Authorization": f"Bearer {PREMIUM_TOKEN}"},
        json=request_data
    )
    
    assert response.status_code == 200

def test_apply_period_corrections_non_premium_user(monkeypatch):
    """Test that non-premium users cannot access the apply period corrections endpoint"""
    def mock_verify_jwt(token):
        return NON_PREMIUM_USER_PAYLOAD
    
    monkeypatch.setattr("utils.jwt_utils.verify_jwt_token", mock_verify_jwt)
    
    request_data = {
        "budget_id": "test-budget",
        "period": TEST_PERIOD,
        "action": "REDISTRIBUTE",
        "planned_amount": Decimal("1000.00")
    }
    
    response = client.post(
        "/budgets/apply-period-corrections",
        headers={"Authorization": f"Bearer {NON_PREMIUM_TOKEN}"},
        json=request_data
    )
    
    assert response.status_code == 403
    assert "premium subscription" in response.json()["detail"]
