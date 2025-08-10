import pytest
from datetime import datetime, timezone
from services.UserUsageService import UserUsageService
from exceptions.ImportLimitExceededError import ImportLimitExceededError
from unittest.mock import Mock, patch

class TestUserUsageService:
    @pytest.fixture
    def usage_service(self):
        service = UserUsageService()
        service.token_manager = Mock()  # Replace token_manager with a mock
        return service

    def test_check_token_availability_premium_user(self, usage_service):
        usage_service.token_manager.check_token_availability.return_value = (True, None, None)
        
        # Should not raise any exception for premium user
        month_key = usage_service.check_token_availability("user123", "PREMIUM", "UTC")
        assert month_key is None
        
        usage_service.token_manager.check_token_availability.assert_called_once_with(
            "user123", "PREMIUM", "UTC"
        )

    def test_check_token_availability_free_user_success(self, usage_service):
        month_key = "2025-08"
        usage_service.token_manager.check_token_availability.return_value = (True, None, month_key)
        
        # Should not raise any exception when tokens are available
        result_month_key = usage_service.check_token_availability("user123", "FREE", "UTC")
        assert result_month_key == month_key
        
        usage_service.token_manager.check_token_availability.assert_called_once_with(
            "user123", "FREE", "UTC"
        )

    def test_check_token_availability_free_user_no_tokens(self, usage_service):
        reset_date = datetime(2025, 9, 1, tzinfo=timezone.utc)
        usage_service.token_manager.check_token_availability.return_value = (False, reset_date, None)
        
        # Should raise ImportLimitExceededError when no tokens are available
        with pytest.raises(ImportLimitExceededError) as exc_info:
            usage_service.check_token_availability("user123", "FREE", "UTC")
        
        assert exc_info.value.reset_date == reset_date
        
        usage_service.token_manager.check_token_availability.assert_called_once_with(
            "user123", "FREE", "UTC"
        )
        assert exc_info.value.remaining_tokens == 0

    def test_get_token_status(self, usage_service):
        expected_status = {
            'tokenCount': 2,
            'resetDate': datetime(2025, 9, 1, tzinfo=timezone.utc),
            'lastResetTimestamp': 1691676000
        }
        usage_service.token_manager.get_token_status.return_value = expected_status
        
        status = usage_service.get_token_status("user123", "UTC")
        assert status == expected_status
        
        usage_service.token_manager.get_token_status.assert_called_once_with(
            "user123", "UTC"
        )

    def test_admin_override_limit(self, usage_service):
        expiry = datetime(2025, 9, 1, tzinfo=timezone.utc)
        usage_service.token_manager.admin_override_limit.return_value = True
        
        result = usage_service.admin_override_limit("user123", 5, expiry)
        assert result is True
        
        usage_service.token_manager.admin_override_limit.assert_called_once_with(
            "user123", 5, expiry
        )
