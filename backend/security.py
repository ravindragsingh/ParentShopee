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


_SEQUENTIAL_ASC  = "0123456789"
_SEQUENTIAL_DESC = "9876543210"

def check_pin_complexity(pin: str) -> None:
    """Raises 400 unless the PIN is a plausible 6-digit code — not blank/too
    short, not all the same digit, and not a straight sequential run."""
    if not pin or not re.fullmatch(r'\d{6}', pin):
        fail("PIN must be exactly 6 digits")
    if len(set(pin)) == 1:
        fail("PIN can't be the same digit repeated — pick something less guessable")
    if pin in _SEQUENTIAL_ASC or pin in _SEQUENTIAL_DESC:
        fail("PIN can't be a simple sequence like 123456 — pick something less guessable")
