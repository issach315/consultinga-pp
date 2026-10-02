import phonenumbers


def is_valid_phone(value: str | None) -> bool:
    """Empty/None is valid — phone stays optional everywhere. A non-empty value
    must parse and be a real number for whichever country it's prefixed with
    (the same E.164 rules the frontend's libphonenumber-js checks)."""
    if not value or not value.strip():
        return True
    try:
        parsed = phonenumbers.parse(value, None)
    except phonenumbers.NumberParseException:
        return False
    return phonenumbers.is_valid_number(parsed)
