import pytest
import os
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from utils.TokenBucketManager import TokenBucketManager
from exceptions.ImportLimitExceededError import ImportLimitExceededError
from unittest.mock import Mock, patch
from botocore.exceptions import ClientError

class TestTokenBucketManager:
    @pytest.fixture
    def token_manager(self):
        with patch('boto3.resource'), \
             patch.dict(os.environ, {'DYNAMODB_USER_USAGE_TABLE_NAME': 'test-table'}):
            return TokenBucketManager()

    def test_calculate_month_key(self, token_manager):
        dt = datetime(2025, 8, 10, tzinfo=timezone.utc)
        assert token_manager._calculate_month_key(dt) == "2025-08"

    def test_get_next_reset_date(self, token_manager):
        # Test for middle of the year
        timezone_str = "America/New_York"
        current = datetime(2025, 8, 10, tzinfo=ZoneInfo(timezone_str))
        expected = datetime(2025, 9, 1, tzinfo=ZoneInfo(timezone_str))
        with patch('utils.TokenBucketManager.datetime') as mock_dt:
            mock_dt.now.return_value = current
            assert token_manager._get_next_reset_date(timezone_str) == expected

        # Test for year end
        current = datetime(2025, 12, 10, tzinfo=ZoneInfo(timezone_str))
        expected = datetime(2026, 1, 1, tzinfo=ZoneInfo(timezone_str))
        with patch('utils.TokenBucketManager.datetime') as mock_dt:
            mock_dt.now.return_value = current
            assert token_manager._get_next_reset_date(timezone_str) == expected

    def test_check_token_availability_premium_user(self, token_manager):
        """Test that premium users always get tokens without DB check"""
        result, reset_date, month_key = token_manager.check_token_availability("user123", "PREMIUM")
        assert result is True
        assert reset_date is None
        assert month_key is None

    def test_check_token_availability_new_free_user(self, token_manager):
        """Test handling of first-time users with no existing record"""
        mock_table = Mock()
        token_manager.table = mock_table
        
        # Simulate successful creation of new record
        mock_table.update_item.return_value = {
            'Attributes': {
                'tokenCount': token_manager.DEFAULT_TOKEN_COUNT,
                'userType': 'BASIC',
                'lastUpdateTimestamp': int(datetime.now(timezone.utc).timestamp())
            }
        }

        result, reset_date, month_key = token_manager.check_token_availability("new_user", "BASIC")
        assert result is True
        assert reset_date is None
        assert month_key is not None
        
        # Verify the update was called with correct parameters
        mock_table.update_item.assert_called_once()
        call_args = mock_table.update_item.call_args[1]
        assert 'if_not_exists(tokenCount, :initial_tokens)' in call_args['UpdateExpression']
        assert call_args['ExpressionAttributeValues'][':initial_tokens'] == token_manager.DEFAULT_TOKEN_COUNT

    def test_check_token_availability_free_user_with_tokens(self, token_manager):
        """Test existing free user with available tokens"""
        mock_table = Mock()
        token_manager.table = mock_table
        
        mock_table.update_item.return_value = {
            'Attributes': {
                'tokenCount': 2,
                'userType': 'BASIC',
                'lastUpdateTimestamp': int(datetime.now(timezone.utc).timestamp())
            }
        }

        result, reset_date, month_key = token_manager.check_token_availability("user123", "BASIC")
        assert result is True
        assert reset_date is None
        assert month_key is not None

    def test_check_token_availability_free_user_no_tokens(self, token_manager):
        """Test existing free user with no available tokens"""
        mock_table = Mock()
        token_manager.table = mock_table
        
        mock_table.update_item.return_value = {
            'Attributes': {
                'tokenCount': 0,
                'userType': 'BASIC',
                'lastUpdateTimestamp': int(datetime.now(timezone.utc).timestamp())
            }
        }

        result, reset_date, month_key = token_manager.check_token_availability("user123", "BASIC")
        assert result is False
        assert reset_date is not None  # Should provide next reset date
        assert month_key is None

    def test_check_token_availability_error_handling(self, token_manager):
        """Test error handling for DynamoDB exceptions"""
        mock_table = Mock()
        token_manager.table = mock_table

        # Simulate a DynamoDB error
        mock_error = ClientError(
            {
                'Error': {
                    'Code': 'ResourceNotFoundException',
                    'Message': 'Table not found'
                },
                'ResponseMetadata': {
                    'RequestId': '1234567890ABCDEF',
                    'HTTPStatusCode': 400,
                    'HTTPHeaders': {'content-type': 'application/x-amz-json-1.0'},
                    'RetryAttempts': 0,
                    'HostId': 'test'
                }
            },
            'UpdateItem'
        )
        mock_table.update_item.side_effect = mock_error

        with pytest.raises(Exception) as exc_info:
            token_manager.check_token_availability("user123", "BASIC")
        assert "Failed to check token availability" in str(exc_info.value)

    def test_check_token_availability_race_condition(self, token_manager):
        """Test handling of concurrent access (race conditions)"""
        mock_table = Mock()
        token_manager.table = mock_table

        # First call fails with conditional check (race condition)
        mock_error = ClientError(
            {
                'Error': {
                    'Code': 'ConditionalCheckFailedException',
                    'Message': 'Conditional check failed'
                },
                'ResponseMetadata': {
                    'RequestId': '1234567890ABCDEF',
                    'HTTPStatusCode': 400,
                    'HTTPHeaders': {'content-type': 'application/x-amz-json-1.0'},
                    'RetryAttempts': 0,
                    'HostId': 'test'
                }
            },
            'UpdateItem'
        )
        mock_table.update_item.side_effect = [
            mock_error,
            # Second call succeeds
            {
                'Attributes': {
                    'tokenCount': token_manager.DEFAULT_TOKEN_COUNT,
                    'userType': 'BASIC'
                }
            }
        ]

        result, reset_date, month_key = token_manager.check_token_availability("user123", "BASIC")
        assert result is True
        assert reset_date is None
        assert month_key is not None
        assert mock_table.update_item.call_count == 2  # Verify retry happened

    def test_decrement_token_success(self, token_manager):
        mock_table = Mock()
        token_manager.table = mock_table  # Directly set the mock table
        
        result = token_manager.decrement_token(
            "user123", "FREE", "UTC", "2025-08"
        )
        assert result is True

    def test_admin_override_limit(self, token_manager):
        mock_table = Mock()
        token_manager.table = mock_table  # Directly set the mock table
        mock_table.update_item.return_value = {'Attributes': {'tokenCount': 5}}

        expiry = datetime(2025, 9, 1, tzinfo=timezone.utc)
        result = token_manager.admin_override_limit("user123", 5, expiry)
        assert result is True

        # Verify the update was called with correct parameters
        mock_table.update_item.assert_called_once()
        call_args = mock_table.update_item.call_args[1]
        assert 'overrideExpiry' in call_args['UpdateExpression']
        assert ':expiry' in call_args['ExpressionAttributeValues']
