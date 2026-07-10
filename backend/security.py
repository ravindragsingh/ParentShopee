import re

from responses import fail


def check_password_complexity(password: str) -> None:
    """Raises 400 unless the password meets complexity rules. Applies to new
    accounts and password resets — NOT to login, so existing passwords still work."""
    if not password or len(password) < 8:
        fail("Password must be at least 8 characters long")
    if not re.search(r'[A-Z]', password):
        fail("Password must contain at least one uppercase letter")
    if not re.search(r'[0-9]', password):
        fail("Password must contain at least one number")
    if not re.search(r'[^A-Za-z0-9]', password):
        fail("Password must contain at least one special character")
