import json
import datetime
from decimal import Decimal
from typing import Any

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, o: Any) -> Any:
        if isinstance(o, Decimal):
            return float(o)
        if isinstance(o, datetime.datetime):
            return o.isoformat()
        return super().default(o)

def custom_json_dumps(obj: Any) -> str:
    return json.dumps(obj, cls=CustomJSONEncoder)
