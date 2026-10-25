from datetime import date, datetime
from typing import Union


def parse_date(value: Union[str, date]) -> date:
    """Parse a date from string or return if already a date object.
    
    Supported formats:
    - YYYY-MM-DD
    - DD-MM-YYYY
    - DD/MM/YYYY
    - YYYY/MM/DD
    """
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()

    val_str = str(value).strip()
    if not val_str:
        raise ValueError("Date string cannot be empty.")

    formats = [
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%Y/%m/%d",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(val_str, fmt).date()
        except ValueError:
            continue

    raise ValueError(f"Invalid date format: '{val_str}'. Expected YYYY-MM-DD or DD-MM-YYYY.")
