from typing import Any, Dict, Optional

class Table:
    def get_item(self, Key: Dict[str, Any]) -> Dict[str, Any]: ...
    def put_item(self, Item: Dict[str, Any]) -> Dict[str, Any]: ...
    def update_item(
        self,
        Key: Dict[str, Any],
        UpdateExpression: str,
        ExpressionAttributeValues: Dict[str, Any],
        ConditionExpression: Optional[str] = None,
        ReturnValues: Optional[str] = None
    ) -> Dict[str, Any]: ...
