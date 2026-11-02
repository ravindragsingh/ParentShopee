import json
import os

from config import FIREBASE_SERVICE_ACCOUNT_JSON
from responses import fail

_firebase_app = None
_firebase_init_attempted = False


def get_firebase_app():
    """Lazily initializes the Firebase Admin SDK on first use and hands back the
    same app instance to every caller (push notifications and Firebase Auth
    alike). Returns None (never raises) if it isn't configured, so push
    delivery can keep skipping silently as it already does -- auth callers
    (verify_firebase_token below) are the ones that turn a missing app into a
    user-facing error, since login/register can't silently no-op.

    Honors FIREBASE_AUTH_EMULATOR_HOST for local development: when set, the
    Admin SDK talks to a local Auth Emulator and needs no real service-account
    credential at all, matching how the Firebase client SDKs auto-detect the
    same env var."""
    global _firebase_app, _firebase_init_attempted
    if _firebase_init_attempted:
        return _firebase_app
    _firebase_init_attempted = True
    try:
        import firebase_admin
        from firebase_admin import credentials

        if os.getenv("FIREBASE_AUTH_EMULATOR_HOST"):
            _firebase_app = firebase_admin.initialize_app(
                options={"projectId": os.getenv("FIREBASE_PROJECT_ID", "demo-rewardurkids")}
            )
        elif FIREBASE_SERVICE_ACCOUNT_JSON:
            cred = credentials.Certificate(json.loads(FIREBASE_SERVICE_ACCOUNT_JSON))
            _firebase_app = firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"[firebase] WARNING: failed to initialize Firebase Admin SDK: {e}")
        _firebase_app = None
    return _firebase_app


def verify_firebase_token(id_token: str) -> dict:
    """Verifies a Firebase Auth ID token (signature, issuer, audience, expiry,
    and revocation are all checked by the Admin SDK against Firebase's public
    keys) and returns the decoded claims (uid, email, email_verified, firebase.
    sign_in_provider, ...). Used for every login/register/recovery flow that
    needs proof of a guardian's identity."""
    app = get_firebase_app()
    if not app:
        fail("Sign-in is not configured on this server.", 503)
    from firebase_admin import auth as firebase_auth

    try:
        return firebase_auth.verify_id_token(id_token, app=app, check_revoked=True)
    except firebase_auth.ExpiredIdTokenError:
        fail("Your sign-in session expired. Please sign in again.", 401)
    except firebase_auth.RevokedIdTokenError:
        fail("This sign-in has been revoked. Please sign in again.", 401)
    except Exception:
        fail("Invalid sign-in credential. Please try again.", 401)
