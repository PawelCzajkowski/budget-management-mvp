from fastapi.testclient import TestClient
from unittest.mock import patch, Mock
from decimal import Decimal
from tests.test_utils import custom_json_dumps
import os
import requests
from jose import jwt

# Mock requests.get before importing jwt_utils
def mock_get(*args, **kwargs):
    mock_response = Mock()
    mock_response.json = lambda: {"keys": [{"kid": "test-key", "e": "test-e", "n": "test-n"}]}
    mock_response.raise_for_status = lambda: None
    return mock_response

# Mock JWT functions
def mock_decode(token, key=None, algorithms=None, audience=None, issuer=None, options=None):
    return {
        "sub": "test-user-1",
        "cognito:groups": ["PremiumUser"] if token == PREMIUM_TOKEN else ["BasicUser"],
        "token_use": "access"
    }
jwt.decode = mock_decode

def mock_get_unverified_header(token):
    return {"kid": "test-key"}
jwt.get_unverified_header = mock_get_unverified_header

def mock_get_unverified_claims(token):
    return {
        "sub": "test-user-1",
        "cognito:groups": ["PremiumUser"] if token == PREMIUM_TOKEN else ["BasicUser"],
        "token_use": "access"
    }
jwt.get_unverified_claims = mock_get_unverified_claims

requests.get = mock_get

from main import app
from models.BudgetDTO import PeriodMismatchValidationRequest, ApplyPeriodCorrectionsRequest
from models.Budget import Period, Expense
import datetime

client = TestClient(app=app)

# Test JWT tokens that match our mock JWT functions
PREMIUM_TOKEN = "eyJraWQiOiJ0ZXN0LWtleSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJ0ZXN0LXVzZXItMSIsImNvZ25pdG86Z3JvdXBzIjpbIlByZW1pdW1Vc2VyIl0sInRva2VuX3VzZSI6ImFjY2VzcyJ9.test"
NON_PREMIUM_TOKEN = "eyJraWQiOiJ0ZXN0LWtleSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJ0ZXN0LXVzZXItMSIsImNvZ25pdG86Z3JvdXBzIjpbIkJhc2ljVXNlciJdLCJ0b2tlbl91c2UiOiJhY2Nlc3MifQ.test"

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
    "period_id": "test-period-1",  # Match PeriodMismatchValidationRequest schema
    "planned_amount": Decimal("1000.00"),
    "expenses": [{"expense_id": "test-expense-1", "amount": Decimal("500.00")}],  # Match ExpenseInputDTO schema
    "all_periods": [{"period_id": "test-period-1", "planned_amount": Decimal("1000.00")}]  # Match PeriodInputDTO schema
}

import requests

# Original get_jwks function to save
_original_get_jwks = None

def setup_module():
    """Setup any test dependencies"""
    # Set environment variables
    os.environ["AWS_REGION"] = "eu-north-1"
    os.environ["COGNITO_USER_POOL_ID"] = "test-pool-id"
    os.environ["COGNITO_CLIENT_ID"] = "test-client-id"
    
    # Save and patch get_jwks
    global _original_get_jwks
    from utils import jwt_utils
    _original_get_jwks = jwt_utils.get_jwks
    jwt_utils.get_jwks = lambda: [{"kid": "test-key", "e": "test-e", "n": "test-n"}]
    
    # Mock requests.get to prevent any HTTP calls
    def mock_get(*args, **kwargs):
        mock_response = Mock()
        mock_response.json = lambda: {"keys": [{"kid": "test-key", "e": "test-e", "n": "test-n"}]}
        return mock_response
        
    requests.get = mock_get

@patch("utils.jwt_utils.verify_jwt_token")
@patch("services.BudgetService.validate_period_mismatch")
def test_validate_period_mismatch_premium_user(mock_validate_mismatch, mock_verify_jwt):
    """Test that premium users can access the period mismatch validation endpoint"""
    user_sub = "test-premium-user"
    mock_verify_jwt.return_value = PREMIUM_USER_PAYLOAD
    mock_validate_mismatch.return_value = {
        "actions": [
            {
                "key": "move",
                "label": "Move planned expense",
                "description": "Move the remaining planned amount to another period.",
                "target_periods": [{"period_id": "period-2"}],
                "max_movable_amount": Decimal("100.00")
            }
        ],
        "summary": {
            "planned_amount": Decimal("1000.00"),
            "expenses_sum": Decimal("900.00"),
            "difference": Decimal("100.00")
        }
    }
    
    response = client.post(
        "/budgets/validate-period-mismatch",
        headers={
            "Authorization": f"Bearer {PREMIUM_TOKEN}",
            "Content-Type": "application/json"
        },
        content=custom_json_dumps(TEST_REQUEST_DATA)
    )
    
    assert response.status_code == 200

@patch("utils.jwt_utils.verify_jwt_token")
def test_validate_period_mismatch_non_premium_user(mock_verify_jwt):
    """Test that non-premium users cannot access the period mismatch validation endpoint"""
    mock_verify_jwt.return_value = NON_PREMIUM_USER_PAYLOAD
    
    response = client.post(
        "/budgets/validate-period-mismatch",
        headers={
            "Authorization": f"Bearer {NON_PREMIUM_TOKEN}",
            "Content-Type": "application/json"
        },
        content=custom_json_dumps(TEST_REQUEST_DATA)
    )
    
    assert response.status_code == 403
    error_response = response.json()
    # Accept the full error message as long as it mentions "premium subscription"
    assert str(error_response["detail"]["detail"]).lower().find("requires a premium subscription") != -1
    assert "upgrade_info" in error_response["detail"]

@patch("utils.jwt_utils.verify_jwt_token")
@patch("services.BudgetService.apply_period_corrections")
def test_apply_period_corrections_premium_user(mock_apply_corrections, mock_verify_jwt):
    """Test that premium users can access the apply period corrections endpoint"""
    user_sub = "test-premium-user"
    mock_verify_jwt.return_value = PREMIUM_USER_PAYLOAD
    mock_apply_corrections.return_value = {
        "status": "success",
        "message": "Budget updated successfully",
        "updated_budget": None
    }

    request_data = {
        "budget_id": "test-budget",
        "period_id": "test-period-1",
        "action": "move",
        "move_details": {
            "amount": Decimal("100.00"),
            "target_period_id": "test-period-2"
        }
    }

    response = client.post(
        "/budgets/apply-period-corrections",
        headers={
            "Authorization": f"Bearer {PREMIUM_TOKEN}",
            "Content-Type": "application/json"
        },
        content=custom_json_dumps(request_data)
    )

    assert response.status_code == 200

@patch("utils.jwt_utils.verify_jwt_token")
def test_apply_period_corrections_non_premium_user(mock_verify_jwt):
    """Test that non-premium users cannot access the apply period corrections endpoint"""
    mock_verify_jwt.return_value = NON_PREMIUM_USER_PAYLOAD
    
    request_data = {
        "budget_id": "test-budget",
        "period_id": "test-period-1",
        "action": "move",
        "move_details": {
            "amount": Decimal("100.00"),
            "target_period_id": "test-period-2"
        }
    }

    response = client.post(
        "/budgets/apply-period-corrections",
        headers={
            "Authorization": f"Bearer {NON_PREMIUM_TOKEN}",
            "Content-Type": "application/json"
        },
        content=custom_json_dumps(request_data)
    )

    assert response.status_code == 403
    error_response = response.json()
    # Accept the full error message as long as it mentions "premium subscription"
    assert str(error_response["detail"]["detail"]).lower().find("requires a premium subscription") != -1
    assert "upgrade_info" in error_response["detail"]

def teardown_module():
    if "_original_get_jwks" in globals():
        from utils import jwt_utils
        jwt_utils.get_jwks = _original_get_jwks