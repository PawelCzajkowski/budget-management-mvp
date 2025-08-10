import time
import boto3
import os
from datetime import datetime, timezone
from typing import Optional, Tuple, Any, Dict, Union
from botocore.exceptions import ClientError
from mypy_boto3_dynamodb.service_resource import Table, _Table
from mypy_boto3_dynamodb import DynamoDBServiceResource
import logging

logger = logging.getLogger(__name__)

DynamoDBItem = Dict[str, Union[str, int, Dict[str, Any]]]

class TokenBucketManager:
    def __init__(self, table_name: Optional[str] = None):
        """
        Initialize TokenBucketManager with a DynamoDB table.
        
        Args:
            table_name: Optional override for table name. If not provided,
                       uses DYNAMODB_USER_USAGE_TABLE_NAME from environment.
        """
        self.table_name = table_name or os.getenv('DYNAMODB_USER_USAGE_TABLE_NAME', '')
        if not self.table_name:
            raise ValueError("DynamoDB table name not provided and DYNAMODB_USER_USAGE_TABLE_NAME not set in environment")
        
        self.dynamodb: DynamoDBServiceResource = boto3.resource('dynamodb')  # type: ignore
        self.table = self.dynamodb.Table(self.table_name)
        self.DEFAULT_TOKEN_COUNT = 3
        
    def _ensure_user_record_exists(self, user_id: str, month_key: str) -> bool:
        """Create a new user record if it doesn't exist
        
        Returns:
            bool: True if record was created, False if it already existed
        
        Raises:
            Exception: If there was an error creating the record
        """
        try:
            self.table.put_item(
                Item={
                    'user_id': str(user_id),
                    'month_key': month_key,
                    'remaining_tokens': self.DEFAULT_TOKEN_COUNT,
                    'last_update': int(time.time())
                },
                ConditionExpression='attribute_not_exists(user_id) AND attribute_not_exists(month_key)'
            )
            logger.info(f"Created new token record for user {user_id} for {month_key}")
            return True
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', '')  # type: ignore
            if error_code == 'ConditionalCheckFailedException':
                return False
            logger.error(f"DynamoDB error for user {user_id}: {str(e)}", exc_info=True)
            raise
        except Exception as e:
            logger.error(f"Unexpected error for user {user_id}: {str(e)}", exc_info=True)
            raise

    def _calculate_month_key(self, dt: datetime) -> str:
        return dt.strftime("%Y-%m")

    def _get_next_reset_date(self) -> datetime:
        """Calculate the next reset date (1st of next month) in UTC"""
        current_time = datetime.now(timezone.utc)
        if current_time.month == 12:
            next_reset = current_time.replace(year=current_time.year + 1, month=1, day=1,
                                          hour=0, minute=0, second=0, microsecond=0)
        else:
            next_reset = current_time.replace(month=current_time.month + 1, day=1,
                                          hour=0, minute=0, second=0, microsecond=0)
        return next_reset

    def get_token_status(self, user_id: str) -> Dict[str, Any]:
        """Get current token status for a user.
        
        Args:
            user_id: The user's unique identifier
            
        Returns:
            dict with keys:
                remaining_tokens (int): Number of tokens left
                next_reset_date (datetime): When the tokens will reset
                month_key (str): Current month key
                is_new (bool): Whether this is a new user
                error (str, optional): Error message if something went wrong
        """
        current_time = datetime.now(timezone.utc)
        month_key = self._calculate_month_key(current_time)
        next_reset = self._get_next_reset_date()
        default_tokens = self.DEFAULT_TOKEN_COUNT
        max_retries = 3
        retry_count = 0
        
        def parse_tokens(item: Optional[dict] = None) -> int:
            """Extract token count from DynamoDB item"""
            if not item:
                return default_tokens
            try:
                tokens = item.get('remaining_tokens')
                return int(tokens) if tokens is not None else default_tokens
            except (TypeError, ValueError):
                logger.error(f"Invalid token count in DynamoDB item for user {user_id}", exc_info=True)
                return 0
        
        while retry_count < max_retries:
            try:
                # Try to get existing user data
                response = self.table.get_item(
                    Key={
                        'user_id': str(user_id),
                        'month_key': month_key
                    }
                )
                
                # If item exists, return its data
                if 'Item' in response:
                    return {
                        'remaining_tokens': parse_tokens(response['Item']),
                        'next_reset_date': next_reset,
                        'month_key': month_key,
                        'is_new': False
                    }
                
                # No item found - create and return defaults
                if self._ensure_user_record_exists(user_id, month_key):
                    return {
                        'remaining_tokens': default_tokens,
                        'next_reset_date': next_reset,
                        'month_key': month_key,
                        'is_new': True
                    }
                
                # Item wasn't found but exists (race condition) - increment retry counter
                retry_count += 1
                if retry_count < max_retries:
                    time.sleep(0.1 * retry_count)  # Exponential backoff
                    continue
                
            except ClientError as e:
                error_code = e.response.get('Error', {}).get('Code', '')  # type: ignore
                error_msg = f"DynamoDB error for user {user_id}: {error_code}"
                logger.error(error_msg, exc_info=True)
                
                # For throttling errors, retry with backoff
                if error_code == 'ProvisionedThroughputExceededException' and retry_count < max_retries:
                    retry_count += 1
                    time.sleep(0.1 * retry_count)
                    continue
                    
                return {
                    'remaining_tokens': 0,
                    'next_reset_date': next_reset,
                    'month_key': month_key,
                    'is_new': False,
                    'error': str(e)
                }
                
            except Exception as e:
                error_msg = f"Unexpected error for user {user_id}: {e.__class__.__name__}"
                logger.error(error_msg, exc_info=True)
                return {
                    'remaining_tokens': 0,
                    'next_reset_date': next_reset,
                    'month_key': month_key,
                    'is_new': False,
                    'error': str(e)
                }
        
        # Default return after max retries or other failures
        logger.warning(f"Max retries reached for user {user_id} token status")
        return {
            'remaining_tokens': 0,
            'next_reset_date': next_reset,
            'month_key': month_key,
            'is_new': False,
            'error': 'Max retries exceeded'
        }
            
    def check_token_availability(self, user_id: str, user_type: str) -> Tuple[bool, Optional[datetime], Optional[str]]:
        """
        Check if user has available tokens without decrementing.
        For new users, initializes their token count.
        
        Args:
            user_id: The user's unique identifier
            user_type: The user's type (PREMIUM or FREE)
            
        Returns:
        - Tuple[bool, Optional[datetime], Optional[str]]:
            - bool: True if tokens are available
            - datetime: Next reset date if tokens exhausted, None otherwise
            - str: Month key for token tracking if tokens available, None otherwise
        """
        if user_type.upper() == "PREMIUM":
            return True, None, None

        status = self.get_token_status(user_id)
        remaining_tokens = status.get('remaining_tokens', 0)
        next_reset = status.get('next_reset_date')
        month_key = status.get('month_key')
        
        if remaining_tokens > 0:
            return True, None, month_key
        else:
            return False, next_reset, None

    def decrement_token(self, user_id: str, user_type: str, month_key: str) -> bool:
        """Decrement token count after successful operation
        
        Args:
            user_id: The user's unique identifier
            user_type: The user's type (PREMIUM or FREE)
            month_key: The month key for token tracking
            
        Returns:
            bool: True if token was decremented successfully
            
        Raises:
            Exception: If token decrement failed
        """
        if user_type.upper() == "PREMIUM":
            return True

        current_timestamp = int(time.time())
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                self.table.update_item(
                    Key={
                        'user_id': str(user_id),
                        'month_key': month_key
                    },
                    UpdateExpression='SET remaining_tokens = if_not_exists(remaining_tokens, :initial) - :dec, '
                                   'last_update = :ts',
                    ConditionExpression='attribute_not_exists(remaining_tokens) OR remaining_tokens > :zero',
                    ExpressionAttributeValues={
                        ':initial': self.DEFAULT_TOKEN_COUNT,
                        ':dec': 1,
                        ':zero': 0,
                        ':ts': current_timestamp
                    }
                )
                return True
                
            except ClientError as e:
                error_code = e.response.get('Error', {}).get('Code', '')  # type: ignore
                
                if error_code == 'ConditionalCheckFailedException':
                    raise Exception("No tokens available")
                    
                if error_code == 'ProvisionedThroughputExceededException' and retry_count < max_retries:
                    retry_count += 1
                    time.sleep(0.1 * retry_count)
                    continue
                    
                logger.error(f"Failed to decrement token for user {user_id}", exc_info=True)
                raise Exception(f"Failed to update token count: {str(e)}")
                
            except Exception as e:
                logger.error(f"Unexpected error decrementing token for user {user_id}", exc_info=True)
                raise Exception(f"Failed to update token count: {str(e)}")
                
        raise Exception("Max retries exceeded while decrementing token")

    def admin_override_limit(self, user_id: str, new_token_count: int, expiry_date: Optional[datetime] = None) -> bool:
        """Admin override for token count
        
        Args:
            user_id: The user's unique identifier
            new_token_count: The new token count to set
            expiry_date: Optional expiry date for the override
            
        Returns:
            bool: True if override was successful
            
        Raises:
            Exception: If override failed
        """
        current_time = datetime.now(timezone.utc)
        month_key = self._calculate_month_key(current_time)
        current_timestamp = int(time.time())
        
        update_exp = ['SET remaining_tokens = :new_count', 'last_update = :ts']
        exp_values = {
            ':new_count': new_token_count,
            ':ts': current_timestamp
        }
        
        if expiry_date:
            update_exp.append('override_expiry = :expiry')
            exp_values[':expiry'] = int(expiry_date.timestamp())

        try:
            self.table.update_item(
                Key={
                    'user_id': str(user_id),
                    'month_key': month_key
                },
                UpdateExpression='SET ' + ', '.join(update_exp),
                ExpressionAttributeValues=exp_values
            )
            logger.info(f"Admin override set for user {user_id}: {new_token_count} tokens")
            return True
            
        except Exception as e:
            logger.error(f"Failed to override token count for user {user_id}", exc_info=True)
            raise Exception(f"Failed to override token count: {str(e)}")

    def reset_tokens(self, user_id: str) -> bool:
        """Reset tokens for a user to default count
        
        Args:
            user_id: The user's unique identifier
            
        Returns:
            bool: True if reset was successful
            
        Raises:
            Exception: If reset failed
        """
        current_time = datetime.now(timezone.utc)
        month_key = self._calculate_month_key(current_time)
        current_timestamp = int(time.time())

        try:
            self.table.update_item(
                Key={
                    'user_id': str(user_id),
                    'month_key': month_key
                },
                UpdateExpression='SET remaining_tokens = :reset, last_update = :ts',
                ExpressionAttributeValues={
                    ':reset': self.DEFAULT_TOKEN_COUNT,
                    ':ts': current_timestamp
                }
            )
            logger.info(f"Reset tokens for user {user_id} to {self.DEFAULT_TOKEN_COUNT}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to reset tokens for user {user_id}", exc_info=True)
            raise Exception(f"Failed to reset tokens: {str(e)}")
