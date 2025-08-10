import pytest
import os
from unittest.mock import Mock, AsyncMock, patch
from fastapi import FastAPI, Request, HTTPException
from starlette.responses import Response
from datetime import datetime, timezone, timedelta
from utils.import_limit_middleware import ImportLimitMiddleware
from exceptions.ImportLimitExceededError import ImportLimitExceededError

@pytest.fixture
def app():
    return FastAPI()

@pytest.fixture
def middleware(app):
    with patch.dict(os.environ, {'DYNAMODB_USER_USAGE_TABLE_NAME': 'test-table'}):
        return ImportLimitMiddleware(app)

@pytest.fixture
def mock_request():
    request = Mock()
    request.method = "POST"
    request.url = Mock()
    request.url.path = "/budgets/import-csv"
    request.headers = {"Authorization": "Bearer test_token"}
    request.state = Mock()
    return request

@pytest.fixture
def mock_response():
    response = Mock(spec=Response)
    response.status_code = 200
    return response

async def test_premium_user_bypass(middleware, mock_request):
    """Test that premium users bypass token checks completely"""
    # Setup mocks
    mock_user = {
        "sub": "test_user_id",
        "cognito:groups": ["PremiumUser"]
    }
    
    with patch("utils.auth_dependency.get_current_user", AsyncMock(return_value=mock_user)):
        next_call = AsyncMock(return_value=Response(content=""))
        response = await middleware.dispatch(mock_request, next_call)
        
        # Verify no token checks were made
        assert next_call.called
        assert not hasattr(mock_request.state, "token_month_key")

async def test_new_free_user_first_import(middleware, mock_request):
    """Test first import by a new free user"""
    # Setup mocks
    mock_user = {
        "sub": "test_user_id",
        "cognito:groups": []
    }
    
    mock_token_bucket = Mock()
    middleware.token_bucket = mock_token_bucket
    mock_token_bucket.check_token_availability.return_value = (True, None, "2025-08")
    
    with patch("utils.auth_dependency.get_current_user", AsyncMock(return_value=mock_user)):
        next_call = AsyncMock(return_value=Response(content=""))
        response = await middleware.dispatch(mock_request, next_call)
        
        # Verify token checks were made
        mock_token_bucket.check_token_availability.assert_called_once_with(
            "test_user_id", "BASIC"
        )
        assert mock_request.state.token_month_key == "2025-08"
        assert next_call.called

async def test_free_user_no_tokens(middleware, mock_request):
    """Test import attempt when user has no tokens left"""
    # Setup mocks
    mock_user = {
        "sub": "test_user_id",
        "cognito:groups": []
    }
    
    next_reset = datetime.now(timezone.utc).replace(day=1) + timedelta(days=30)  # Approximate month
    mock_token_bucket = Mock()
    middleware.token_bucket = mock_token_bucket
    mock_token_bucket.check_token_availability.return_value = (False, next_reset, None)
    
    with patch("utils.auth_dependency.get_current_user", AsyncMock(return_value=mock_user)):
        next_call = AsyncMock()
        response = await middleware.dispatch(mock_request, next_call)
        
        # Verify proper error response
        assert response.status_code == 429
        assert "CSV import limit reached" in response.body.decode()
        assert not next_call.called

async def test_missing_user_id(middleware, mock_request):
    """Test handling of missing user ID in token"""
    # Setup mocks
    mock_user = {
        "cognito:groups": []  # No sub/user_id
    }
    
    with patch("utils.auth_dependency.get_current_user", AsyncMock(return_value=mock_user)):
        next_call = AsyncMock()
        response = await middleware.dispatch(mock_request, next_call)
        
        assert response.status_code == 401
        assert "missing user ID" in response.body.decode()
        assert not next_call.called

async def test_successful_import_token_decrement(middleware, mock_request):
    """Test successful import decrements token"""
    # Setup mocks
    mock_user = {
        "sub": "test_user_id",
        "cognito:groups": []
    }
    
    mock_token_bucket = Mock()
    middleware.token_bucket = mock_token_bucket
    mock_token_bucket.check_token_availability.return_value = (True, None, "2025-08")
    
    with patch("utils.auth_dependency.get_current_user", AsyncMock(return_value=mock_user)):
        next_call = AsyncMock(return_value=Response(status_code=200))
        response = await middleware.dispatch(mock_request, next_call)
        
        # Verify token was decremented
        mock_token_bucket.decrement_token.assert_called_once_with(
            "test_user_id", "BASIC", "2025-08"
        )
        assert response.status_code == 200

async def test_failed_import_no_token_decrement(middleware, mock_request):
    """Test failed import doesn't decrement token"""
    # Setup mocks
    mock_user = {
        "sub": "test_user_id",
        "cognito:groups": []
    }
    
    mock_token_bucket = Mock()
    middleware.token_bucket = mock_token_bucket
    mock_token_bucket.check_token_availability.return_value = (True, None, "2025-08")
    
    with patch("utils.auth_dependency.get_current_user", AsyncMock(return_value=mock_user)):
        next_call = AsyncMock(return_value=Response(status_code=400))
        response = await middleware.dispatch(mock_request, next_call)
        
        # Verify token was not decremented
        assert not mock_token_bucket.decrement_token.called
        assert response.status_code == 400

async def test_skip_non_import_endpoints(middleware, mock_request):
    """Test that non-import endpoints bypass the middleware"""
    mock_request.url.path = "/api/v1/other-endpoint"
    
    next_call = AsyncMock(return_value=Response())
    response = await middleware.dispatch(mock_request, next_call)
    
    # Verify middleware was bypassed
    assert next_call.called
    assert not hasattr(mock_request.state, "token_month_key")
