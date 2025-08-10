from typing import Optional, Dict, Union
from datetime import datetime

class ImportLimitExceededError(Exception):
    def __init__(self, message: str, reset_date: Optional[datetime], remaining_tokens: int = 0):
        self.message = message
        self.reset_date = reset_date or datetime.max
        self.remaining_tokens = remaining_tokens
        super().__init__(self.message)

    def to_dict(self):
        return {
            "error": "IMPORT_LIMIT_EXCEEDED",
            "message": self.message,
            "resetDate": self.reset_date.isoformat(),
            "remainingTokens": self.remaining_tokens
        }
