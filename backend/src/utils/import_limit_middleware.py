from fastapi import Request, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from typing import Callable, Optional
from utils.auth_dependency import get_current_user, get_user_type
from utils.TokenBucketManager import TokenBucketManager
from exceptions.ImportLimitExceededError import ImportLimitExceededError
from datetime import datetime, timezone
import logging
import math

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger(__name__)

class ImportLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.token_bucket = TokenBucketManager()  # Use environment variable for table name
        # In Lambda, the path includes the stage name (v1)
        self.import_csv_path = "/budgets/import-csv"
        self.full_path_patterns = [
            self.import_csv_path,           # Local development
            f"/v1{self.import_csv_path}",   # Lambda/API Gateway with stage
        ]

    async def dispatch(self, request: Request, call_next) -> Response:
        # Fast path: Skip token check for non-import endpoints
        if request.url.path not in self.full_path_patterns or request.method != "POST":
            return await call_next(request)

        try:
            # Get user info from JWT and validate early
            user = await get_current_user(request)
            user_id = user.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: missing user ID"
                )

            # Fast path: Premium users bypass token checks
            user_type = get_user_type(user.get("cognito:groups", []))
            if user_type == "PREMIUM":
                return await call_next(request)

            # Token management for free users
            try:
                token_status = self.token_bucket.get_token_status(user_id)
                remaining_tokens = token_status.get('remaining_tokens', 0)
                next_reset = token_status.get('next_reset_date')
                month_key = token_status.get('month_key')
            except Exception as e:
                logger.error("Failed to check token status", exc_info=True)
                return JSONResponse(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content={"error": "Failed to check token status", "detail": str(e)}
                )

            if remaining_tokens <= 0:
                reset_message = "CSV import limit reached for this month. Upgrade to Premium for unlimited imports!"
                if next_reset:
                    reset_message += f" Next reset on: {next_reset.strftime('%Y-%m-%d %H:%M UTC')}"
                
                now = datetime.now(timezone.utc)
                retry_after = math.ceil((next_reset - now).total_seconds()) if next_reset else 86400  # Default to 24h
                
                # Return standardized rate limit error response with CORS headers
                error = ImportLimitExceededError(
                    reset_message,
                    next_reset,
                    remaining_tokens
                )
                
                headers = {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Max-Age': '3600',
                    'Retry-After': str(retry_after),
                    'X-RateLimit-Limit': '3',
                    'X-RateLimit-Remaining': str(remaining_tokens),
                    'X-RateLimit-Reset': str(math.ceil(next_reset.timestamp()) if next_reset else 0)
                }
                
                error_response = JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content=error.to_dict(),
                    headers=headers
                )
                return error_response
            
            # Process the request and handle token decrement atomically
            response = await call_next(request)
            
            # Only decrement token on successful import to ensure fair usage
            if response.status_code == 200:
                try:
                    current_month_key = datetime.now(timezone.utc).strftime("%Y-%m")
                    current_month_key = datetime.now(timezone.utc).strftime("%Y-%m")
                    try:
                        self.token_bucket.decrement_token(user_id, user_type, current_month_key)
                    except Exception:
                        logger.error("Failed to decrement token", exc_info=True)
                        # Don't fail the request since it was successful
                except Exception as e:
                    # Log the error but don't fail the request since it was successful
                    logger.error(f"Failed to decrement token for user {user_id}: {str(e)}")
            
            return response
            
        except ImportLimitExceededError as e:
            return JSONResponse(
                status_code=429,
                content=e.to_dict()
            )
        except HTTPException as e:
            return JSONResponse(
                status_code=e.status_code,
                content={"error": e.detail}
            )
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"error": "INTERNAL_SERVER_ERROR", "message": str(e)}
            )
