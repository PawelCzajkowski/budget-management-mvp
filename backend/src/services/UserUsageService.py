from datetime import datetime, timezone
from typing import Optional, Tuple

from exceptions.ImportLimitExceededError import ImportLimitExceededError
from utils.TokenBucketManager import TokenBucketManager

class UserUsageService:
    def __init__(self):
        self.token_manager = TokenBucketManager('budget-management-mvp-UserUsageTracker')

    def check_token_availability(self, user_id: str, user_type: str, timezone_str: str) -> Optional[str]:
        """Check if user can import CSV without decrementing token"""
        can_import, reset_date, month_key = self.token_manager.check_token_availability(user_id, user_type)
        
        if not can_import:
            raise ImportLimitExceededError(
                message="Monthly import limit reached",
                reset_date=reset_date,
                remaining_tokens=0
            )
        if month_key is None and user_type.upper() != "PREMIUM":
            # For non-premium users, we should always have a month key
            raise Exception("Internal error: month key not generated")
        return month_key

    def decrement_token(self, user_id: str, user_type: str, month_key: str) -> None:
        """Decrement token after successful import"""
        self.token_manager.decrement_token(user_id, user_type, month_key)

    def get_token_status(self, user_id: str) -> dict:
        """Get current token status for a user"""
        return self.token_manager.get_token_status(user_id)

    def reset_tokens(self, user_id: str) -> bool:
        """Reset tokens for a user"""
        return self.token_manager.reset_tokens(user_id)

    def admin_override_limit(self, user_id: str, new_token_count: int, 
                           expiry_date: Optional[datetime] = None) -> bool:
        """Admin override for token count"""
        return self.token_manager.admin_override_limit(user_id, new_token_count, expiry_date)
