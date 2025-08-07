from fastapi import HTTPException, status

class PremiumFeatureError(HTTPException):
    """Exception raised when a non-premium user attempts to access premium features."""
    
    def __init__(self, feature_name: str):
        detail = {
            "detail": f"This feature ({feature_name}) requires a premium subscription",
            "upgrade_info": "Visit our pricing page to upgrade your account"
        }
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
