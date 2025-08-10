class TokenBucketReservation:
    def __init__(self, user_id: str, month: str):
        self.user_id = user_id
        self.month = month

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            # If there was an exception, we should restore the token
            pass  # Token wasn't actually decremented yet
