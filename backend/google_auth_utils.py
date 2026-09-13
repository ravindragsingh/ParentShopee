from google.auth import exceptions as google_exceptions
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from config import GOOGLE_ANDROID_CLIENT_ID, GOOGLE_CLIENT_ID
from responses import fail

_google_request = google_requests.Request()
_VALID_AUDIENCES = [aud for aud in (GOOGLE_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID) if aud]


def verify_google_token(credential: str) -> dict:
    """Verifies a Google Identity Services ID token: signature, issuer, audience,
    and expiry are all checked by the underlying library against Google's public
    keys. Returns the verified claims (sub, email, name, email_verified, ...).
    Accepts tokens audienced to either the Web client (web/iOS) or the Android
    client (Android's browser-based sign-in flow -- see nativeGoogleAuth.js)."""
    if not GOOGLE_CLIENT_ID:
        fail("Google sign-in is not configured on this server.", 503)
    try:
        claims = id_token.verify_oauth2_token(credential, _google_request, _VALID_AUDIENCES)
    except ValueError:
        fail("Invalid or expired Google sign-in token. Please try again.", 401)
    except google_exceptions.TransportError:
        fail("Couldn't reach Google to verify sign-in right now. Please try again shortly.", 503)
    except google_exceptions.GoogleAuthError:
        fail("Invalid or expired Google sign-in token. Please try again.", 401)
    if not claims.get("email_verified"):
        fail("Your Google account's email address is not verified.", 401)
    return claims
