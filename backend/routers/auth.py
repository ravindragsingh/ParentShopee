import random
from datetime import datetime, timedelta, timezone
from uuid import NAMESPACE_URL, uuid4, uuid5

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from starlette.requests import Request as StarletteRequest

from config import ACTIVATION_TOKEN_TTL_HOURS, EMAIL_RE, FRONTEND_URL
from database import get_db
from deps import create_session, require_auth, require_guardian
from email_utils import send_activation_email, send_reset_email, send_username_email
from firebase_app import get_firebase_app, verify_firebase_token
from geolocation import get_client_ip, get_client_platform, get_location_from_ip, record_login_location
from google_auth_utils import verify_google_token
from helpers import calculate_age, delete_family, delete_lone_user, generate_username_from_email, now, safe_user
from models import DBCoGuardianInvite, DBUser
from responses import fail, ok
from schemas import (
    ActivateBody, FirebaseSessionBody, ForgotPasswordBody, ForgotUsernameBody,
    GoogleAuthBody, GoogleCompleteBody, LoginBody, PushTokenBody, RegisterBody, RegisterFinalizeBody,
    RegisterPrecheckBody, ResendActivationBody, ResolveLoginIdentifierBody, UpdatePinBody,
)
from security import check_password_complexity, check_pin_complexity

router = APIRouter()

# Used only so /api/auth/resolve-login-identifier can return an email-shaped
# string for an unknown identifier instead of a distinguishable "not found"
# response -- the fake address is deterministic (same identifier -> same fake
# email) but Firebase will reject it as unknown the same way it rejects a
# wrong password, so the frontend shows one generic error either way.
_FAKE_EMAIL_NAMESPACE = uuid5(NAMESPACE_URL, "https://rewardurkids.com/unknown-login-identifier")


@router.post("/api/auth/login")
def login(body: LoginBody, request: StarletteRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # body.username doubles as "username or email" — kids only ever have a
    # username (no email), so this is effectively guardian-only, same as before.
    identifier = body.username.strip().lower()
    user = db.query(DBUser).filter(
        or_(func.lower(DBUser.username) == identifier, func.lower(DBUser.email) == identifier),
        DBUser.password == body.password,
    ).first()
    if not user:
        fail("Invalid credentials", 401)
    if user.role == "kid" or user.co_guardian_of:
        fail(
            "This account is part of a family — sign in with your family's main account and select your profile.",
            403,
            code="use_family_login",
        )
    if user.is_suspended == "1":
        fail("This account has been suspended. Contact support for help.", 403, code="account_suspended")
    if user.is_active != "1":
        fail(
            "Please activate your account before signing in — check your email for the activation link.",
            403,
            code="account_not_activated",
        )
    user.last_login_at = now()
    user.last_active_at = user.last_login_at
    user.last_login_platform = get_client_platform(request)
    db.commit()
    db.refresh(user)
    token = create_session(db, user.id)
    background_tasks.add_task(record_login_location, user.id, get_client_ip(request))
    return ok({"token": token, "user": safe_user(user)})


@router.post("/api/auth/register")
def register(body: RegisterBody, request: StarletteRequest, db: Session = Depends(get_db)):
    if not EMAIL_RE.match(body.email):
        fail("Please enter a valid email address")
    try:
        age = calculate_age(body.dateOfBirth)
    except Exception:
        fail("Invalid date of birth — use YYYY-MM-DD format")
    if age < 25:
        fail("To register as Guardian, you should be 25 years or more.")
    if db.query(DBUser).filter(func.lower(DBUser.username) == body.username.strip().lower()).first():
        fail("Username already taken")
    if db.query(DBUser).filter(DBUser.email == body.email.lower().strip()).first():
        fail("Email address already registered")
    if db.query(DBCoGuardianInvite).filter(DBCoGuardianInvite.email == body.email.lower().strip()).first():
        fail("This email has a pending co-guardian invite — use the link in that email to join the family instead of registering separately.")
    if len(body.name.strip()) < 2:
        fail("Name must be at least 2 characters")
    check_password_complexity(body.password)
    if body.gender not in ("male", "female", "other"):
        fail("Gender must be 'male', 'female', or 'other'")

    location = get_location_from_ip(get_client_ip(request))
    expires = (datetime.now(timezone.utc) + timedelta(hours=ACTIVATION_TOKEN_TTL_HOURS)).isoformat()

    # Every profile in the picker is PIN-gated, including the primary guardian's own —
    # seed a temporary PIN now so they aren't locked out of their first "continue as
    # me" pick; the profile picker's migration-notice banner surfaces it to them.
    temp_pin = f"{random.randint(0, 999999):06d}"

    user = DBUser(
        id=str(uuid4()),
        name=body.name.strip(),
        username=body.username.strip(),
        password=body.password,
        role="guardian",
        email=body.email.lower().strip(),
        date_of_birth=body.dateOfBirth,
        gender=body.gender,
        country=location["country"],
        city=location["city"],
        is_active="0",
        activation_token=str(uuid4()),
        activation_token_expires=expires,
        pin=temp_pin,
        pin_auto_generated="1",
        created_at=now(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if not send_activation_email(user):
        fail("Account created, but we couldn't send the activation email. Please try 'Resend activation email' from the sign-in page.", 500)

    return ok({
        "activationRequired": True,
        "email": user.email,
        "message": "Account created! Check your email for a link to activate your account.",
    }, 201)


def _firebase_delete_orphan(uid: str) -> None:
    """Best-effort cleanup for a Firebase Auth user that was created client-side
    but whose matching DBUser row failed to finalize (race condition, business
    validation failure, etc.) -- never raises, since the caller is already
    mid-error-handling and a cleanup failure shouldn't mask the real one."""
    app = get_firebase_app()
    if not app:
        return
    try:
        from firebase_admin import auth as firebase_auth
        firebase_auth.delete_user(uid, app=app)
    except Exception as e:
        print(f"[auth] WARNING: failed to delete orphaned Firebase user {uid}: {e}")


@router.post("/api/auth/resolve-login-identifier")
def resolve_login_identifier(body: ResolveLoginIdentifierBody, db: Session = Depends(get_db)):
    """First step of the Firebase login flow: the sign-in form takes a single
    "username or email" field (same UX as before), but Firebase's client SDK
    needs an actual email to sign in with. Always returns an email-shaped
    string -- a deterministic fake one for an unknown/ineligible identifier --
    so this response alone never reveals whether the identifier exists; the
    subsequent Firebase sign-in simply fails the same way for both. Guardians
    and admins both sign in this way (both have a real email + Firebase
    credential); kids/co-guardians never do (PIN-gated under the family
    session instead -- see routers/family.py)."""
    identifier = body.identifier.strip().lower()
    user = db.query(DBUser).filter(
        or_(func.lower(DBUser.username) == identifier, func.lower(DBUser.email) == identifier),
    ).first()
    if user and user.email and user.role in ("guardian", "admin") and not user.co_guardian_of:
        return ok({"email": user.email})
    fake = uuid5(_FAKE_EMAIL_NAMESPACE, identifier)
    return ok({"email": f"{fake}@invalid.rewardurkids.local"})


@router.post("/api/auth/firebase-session")
def firebase_session(body: FirebaseSessionBody, request: StarletteRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Exchanges a freshly-verified Firebase ID token (from either a password
    or Google sign-in on the client) for one of our own long-lived app session
    tokens -- see create_session. This is the only place a Firebase identity
    gets translated into app access; everything downstream (sessions, the
    PIN-gated profile picker, etc.) is unchanged from before this migration."""
    decoded = verify_firebase_token(body.idToken)
    uid = decoded["uid"]
    user = db.query(DBUser).filter(DBUser.firebase_uid == uid).first()
    if not user:
        # Reachable two ways: a genuinely unknown Firebase credential (shouldn't
        # happen via the password path -- resolve-login-identifier only hands out
        # a real email for an account that already has a firebase_uid), or a
        # first-time Google sign-in, where signInWithPopup silently creates a new
        # Firebase user with no DBUser behind it yet. `no_account` lets the
        # frontend tell these apart and route Google's case into the same
        # "finish creating your account" flow password registration uses.
        fail("Invalid credentials", 401, code="no_account")
    if user.role == "kid" or user.co_guardian_of:
        fail(
            "This account is part of a family — sign in with your family's main account and select your profile.",
            403,
            code="use_family_login",
        )
    if user.is_suspended == "1":
        fail("This account has been suspended. Contact support for help.", 403, code="account_suspended")
    if user.is_active != "1":
        fail(
            "Please activate your account before signing in — check your email for the activation link.",
            403,
            code="account_not_activated",
        )
    user.last_login_at = now()
    user.last_active_at = user.last_login_at
    user.last_login_platform = get_client_platform(request)
    db.commit()
    db.refresh(user)
    token = create_session(db, user.id)
    background_tasks.add_task(record_login_location, user.id, get_client_ip(request))
    return ok({"token": token, "user": safe_user(user)})


@router.post("/api/auth/register/precheck")
def register_precheck(body: RegisterPrecheckBody, db: Session = Depends(get_db)):
    """Runs every registration business-rule check except password complexity
    (Firebase owns the password now) *before* the frontend creates anything in
    Firebase -- keeps an invalid registration from ever producing an orphaned
    Firebase Auth user with no matching DBUser row. register/finalize re-runs
    these same checks as a race-condition safety net."""
    if not EMAIL_RE.match(body.email):
        fail("Please enter a valid email address")
    try:
        age = calculate_age(body.dateOfBirth)
    except Exception:
        fail("Invalid date of birth — use YYYY-MM-DD format")
    if age < 25:
        fail("To register as Guardian, you should be 25 years or more.")
    if db.query(DBUser).filter(func.lower(DBUser.username) == body.username.strip().lower()).first():
        fail("Username already taken")
    if db.query(DBUser).filter(DBUser.email == body.email.lower().strip()).first():
        fail("Email address already registered")
    if db.query(DBCoGuardianInvite).filter(DBCoGuardianInvite.email == body.email.lower().strip()).first():
        fail("This email has a pending co-guardian invite — use the link in that email to join the family instead of registering separately.")
    if len(body.name.strip()) < 2:
        fail("Name must be at least 2 characters")
    if body.gender not in ("male", "female", "other"):
        fail("Gender must be 'male', 'female', or 'other'")
    return ok({"ok": True})


@router.post("/api/auth/register/finalize")
def register_finalize(body: RegisterFinalizeBody, request: StarletteRequest, db: Session = Depends(get_db)):
    """Second half of registration: takes the ID token for a Firebase user that
    either (a) the frontend just created with createUserWithEmailAndPassword
    right after a successful precheck, or (b) Firebase created automatically on
    a first-time Google sign-in (signInWithPopup) -- distinguished below via the
    token's sign_in_provider claim. Either way, this is where the DBUser row
    actually gets created; any validation failure here deletes the Firebase
    user too; so we never leave a credential with no app account behind it."""
    decoded = verify_firebase_token(body.idToken)
    uid = decoded["uid"]
    email = (decoded.get("email") or "").lower().strip()
    is_google = decoded.get("firebase", {}).get("sign_in_provider") == "google.com"
    # The real Google account id (not Firebase's own uid) -- kept in the same
    # `google_id` column pre-migration code already reads (admin panel's
    # "Google sign-in" badge, safe_user's isGoogleAccount flag).
    google_sub = (decoded.get("firebase", {}).get("identities", {}).get("google.com") or [None])[0] if is_google else None

    try:
        if not email:
            fail("This sign-in method didn't provide an email address.")
        if db.query(DBUser).filter(DBUser.firebase_uid == uid).first():
            fail("This account is already registered. Please sign in instead.", 409)
        if db.query(DBUser).filter(DBUser.email == email).first():
            fail("An account with this email already exists. Please sign in instead.", 409)
        try:
            age = calculate_age(body.dateOfBirth)
        except Exception:
            fail("Invalid date of birth — use YYYY-MM-DD format")
        if age < 25:
            fail("To register as Guardian, you should be 25 years or more.")
        if body.gender not in ("male", "female", "other"):
            fail("Gender must be 'male', 'female', or 'other'")
        if len(body.name.strip()) < 2:
            fail("Name must be at least 2 characters")

        if body.username:
            if db.query(DBUser).filter(func.lower(DBUser.username) == body.username.strip().lower()).first():
                fail("Username already taken")
            username = body.username.strip()
        else:
            username = generate_username_from_email(db, email)
    except Exception:
        _firebase_delete_orphan(uid)
        raise

    location = get_location_from_ip(get_client_ip(request))
    # Every profile in the picker is PIN-gated, including the primary guardian's own —
    # seed a temporary PIN now so they aren't locked out of their first "continue as
    # me" pick; the profile picker's migration-notice banner surfaces it to them.
    temp_pin = f"{random.randint(0, 999999):06d}"

    user = DBUser(
        id=str(uuid4()),
        name=body.name.strip(),
        username=username,
        password=str(uuid4()),  # inert placeholder -- this account signs in via Firebase, not this field
        firebase_uid=uid,
        google_id=google_sub,
        role="guardian",
        email=email,
        date_of_birth=body.dateOfBirth,
        gender=body.gender,
        country=location["country"],
        city=location["city"],
        # Google already verified the email; a password sign-up still goes through
        # our own branded activation email, same as before this migration.
        is_active="1" if is_google else "0",
        activation_token=None if is_google else str(uuid4()),
        activation_token_expires=None if is_google else (
            datetime.now(timezone.utc) + timedelta(hours=ACTIVATION_TOKEN_TTL_HOURS)
        ).isoformat(),
        pin=temp_pin,
        pin_auto_generated="1",
        created_at=now(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if is_google:
        token = create_session(db, user.id)
        return ok({"token": token, "user": safe_user(user)}, 201)

    if not send_activation_email(user):
        fail("Account created, but we couldn't send the activation email. Please try 'Resend activation email' from the sign-in page.", 500)
    return ok({
        "activationRequired": True,
        "email": user.email,
        "message": "Account created! Check your email for a link to activate your account.",
    }, 201)


@router.post("/api/auth/google")
def google_login(body: GoogleAuthBody, request: StarletteRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    claims = verify_google_token(body.credential)
    google_id = claims["sub"]
    email = (claims.get("email") or "").lower().strip()

    user = db.query(DBUser).filter(DBUser.google_id == google_id).first()
    if not user:
        # Not linked to an account yet. If this email already registered the
        # traditional way, don't silently link it -- that's an account-takeover
        # risk if we get it wrong. Otherwise this is a first-time sign-up, which
        # still needs the eligibility fields (birthdate, gender) Google can't give us.
        if db.query(DBUser).filter(DBUser.email == email).first():
            fail(
                "An account with this email already exists. Please sign in with your username and password.",
                409, code="email_exists",
            )
        return ok({"needsProfile": True, "email": email, "name": claims.get("name") or ""})

    if user.role == "kid" or user.co_guardian_of:
        fail(
            "This account is part of a family — sign in with your family's main account and select your profile.",
            403, code="use_family_login",
        )
    if user.is_suspended == "1":
        fail("This account has been suspended. Contact support for help.", 403, code="account_suspended")

    user.last_login_at = now()
    user.last_active_at = user.last_login_at
    user.last_login_platform = get_client_platform(request)
    db.commit()
    db.refresh(user)
    token = create_session(db, user.id)
    background_tasks.add_task(record_login_location, user.id, get_client_ip(request))
    return ok({"token": token, "user": safe_user(user)})


@router.post("/api/auth/google/complete")
def google_complete(body: GoogleCompleteBody, request: StarletteRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    claims = verify_google_token(body.credential)
    google_id = claims["sub"]
    email = (claims.get("email") or "").lower().strip()
    name = claims.get("name") or email.split("@")[0]

    if db.query(DBUser).filter(DBUser.google_id == google_id).first():
        fail("This Google account is already linked to an account. Please sign in instead.", 409)
    if db.query(DBUser).filter(DBUser.email == email).first():
        fail("An account with this email already exists. Please sign in with your username and password.", 409)

    try:
        age = calculate_age(body.dateOfBirth)
    except Exception:
        fail("Invalid date of birth — use YYYY-MM-DD format")
    if age < 25:
        fail("To register as Guardian, you should be 25 years or more.")
    if body.gender not in ("male", "female", "other"):
        fail("Gender must be 'male', 'female', or 'other'")

    location = get_location_from_ip(get_client_ip(request))
    username = generate_username_from_email(db, email)
    # Every profile in the picker is PIN-gated, including the primary guardian's own —
    # seed a temporary PIN now so they aren't locked out of their first "continue as
    # me" pick; the profile picker's migration-notice banner surfaces it to them.
    temp_pin = f"{random.randint(0, 999999):06d}"

    user = DBUser(
        id=str(uuid4()),
        name=name.strip() or email.split("@")[0],
        username=username,
        password=str(uuid4()),  # inert placeholder -- this account signs in via Google only
        google_id=google_id,
        role="guardian",
        email=email,
        date_of_birth=body.dateOfBirth,
        gender=body.gender,
        country=location["country"],
        city=location["city"],
        is_active="1",  # Google already verified the email -- no activation email needed
        pin=temp_pin,
        pin_auto_generated="1",
        created_at=now(),
        last_login_platform=get_client_platform(request),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_session(db, user.id)
    background_tasks.add_task(record_login_location, user.id, get_client_ip(request))
    return ok({"token": token, "user": safe_user(user)}, 201)


@router.post("/api/auth/activate")
def activate_account(body: ActivateBody, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.activation_token == body.token).first()
    if not user:
        fail("This activation link is invalid. It may have already been used — try signing in, or request a new link.")
    if user.is_active == "1":
        return ok({"message": "Your account is already active. You can sign in now."})
    if user.activation_token_expires and datetime.fromisoformat(user.activation_token_expires) < datetime.now(timezone.utc):
        fail("This activation link has expired. Please request a new one from the sign-in page.")
    user.is_active = "1"
    user.activation_token = None
    user.activation_token_expires = None
    db.commit()
    return ok({"message": "Account activated! You can sign in now."})


@router.post("/api/auth/resend-activation")
def resend_activation(body: ResendActivationBody, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(func.lower(DBUser.username) == body.username.strip().lower()).first()
    if not user:
        fail("No account found with that username.")
    if user.is_active == "1":
        return ok({"message": "This account is already active. You can sign in now."})
    user.activation_token = str(uuid4())
    user.activation_token_expires = (datetime.now(timezone.utc) + timedelta(hours=ACTIVATION_TOKEN_TTL_HOURS)).isoformat()
    db.commit()
    if not send_activation_email(user):
        fail("Failed to send the activation email. Please try again shortly.", 500)
    return ok({"message": f"Activation email resent to {user.email}."})


@router.post("/api/auth/forgot-password")
def forgot_password(body: ForgotPasswordBody, db: Session = Depends(get_db)):
    """Firebase now owns the reset token/expiry/verification entirely -- this
    endpoint's only job is the same identity check as before (username+email
    must match one account) before asking Firebase to mint a link, then
    sending that link through our own branded email. The link points back at
    FRONTEND_URL/reset-password with an oobCode Firebase appends; that page
    completes the reset client-side via the Firebase SDK's confirmPasswordReset
    — there's no corresponding backend endpoint anymore."""
    username = body.username.strip()
    email = body.email.strip().lower()
    user = db.query(DBUser).filter(func.lower(DBUser.username) == username.lower(), DBUser.email == email).first()
    if not user or not user.firebase_uid:
        fail("We couldn't find an account with that username and email combination.")
    app = get_firebase_app()
    if not app:
        fail("Password reset is not configured on this server.", 503)
    try:
        from firebase_admin import auth as firebase_auth
        link = firebase_auth.generate_password_reset_link(
            user.email,
            action_code_settings=firebase_auth.ActionCodeSettings(url=f"{FRONTEND_URL}/reset-password", handle_code_in_app=True),
            app=app,
        )
    except Exception as e:
        print(f"[auth] WARNING: failed to generate Firebase password reset link: {e}")
        fail("Username and email matched, but we couldn't generate a reset link. Please try again shortly.", 500)
    if not send_reset_email(user, link):
        fail("Username and email matched, but we couldn't send the reset email. Please try again shortly.", 500)
    return ok({"message": "Username and email matched! A password reset link has been sent to your email."})


@router.post("/api/auth/forgot-username")
def forgot_username(body: ForgotUsernameBody, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    user = db.query(DBUser).filter(DBUser.email == email).first()
    if not user:
        fail("We couldn't find an account with that email address.")
    if not send_username_email(user):
        fail("Email matched, but we couldn't send the reminder. Please try again shortly.", 500)
    return ok({"message": "Email matched! Your username has been sent to your email."})


@router.put("/api/auth/pin")
def change_own_pin(body: UpdatePinBody, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    # Only the primary guardian self-services their own entry PIN here — kids' and
    # the co-guardian's PINs are set by the primary guardian (kids.py / family.py),
    # same as before.
    if user.role != "guardian" or user.co_guardian_of:
        fail("Only the primary guardian can change their own PIN this way", 403)
    check_pin_complexity(body.pin)
    user.pin = body.pin
    user.pin_auto_generated = "0"
    user.pin_attempts = 0
    user.pin_locked_until = None
    db.commit()
    return ok({"message": "PIN updated"})


@router.delete("/api/auth/account")
def delete_own_account(db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    # Self-service deletion for the account holder who registered (guardian or
    # co-guardian) -- required by app store policies, not just a nice-to-have.
    # Kids don't create their own accounts, so they're not offered this; a
    # guardian removes a kid's profile from the Kids tab instead.
    if user.co_guardian_of:
        delete_lone_user(db, user)
        message = "Your co-guardian access has been removed and your account deleted."
    else:
        delete_family(db, user)
        message = "Your account and all family data have been permanently deleted."
    db.commit()
    return ok({"message": message})


@router.put("/api/auth/push-token")
def register_push_token(body: PushTokenBody, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    # A device is shared across profiles (Netflix-style picker), so the token
    # simply follows whoever is currently active on it -- the previous
    # profile's stored token just goes stale rather than being explicitly
    # cleared, which is harmless since it's only ever read to send that
    # specific user a notification.
    user.push_token = body.token
    db.commit()
    return ok({"message": "Push token registered"})
