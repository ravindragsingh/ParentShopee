from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session
from starlette.requests import Request as StarletteRequest

from config import ACTIVATION_TOKEN_TTL_HOURS, EMAIL_RE, RESET_TOKEN_TTL_HOURS, SESSIONS
from database import get_db
from deps import require_auth
from email_utils import send_activation_email, send_reset_email, send_username_email
from geolocation import get_client_ip, get_location_from_ip, record_login_location
from helpers import calculate_age, now, safe_user
from models import DBUser
from responses import fail, ok
from schemas import (
    ActivateBody, ChangeOwnPasswordBody, ForgotPasswordBody, ForgotUsernameBody,
    LoginBody, RegisterBody, ResendActivationBody, ResetPasswordBody,
)
from security import check_password_complexity

router = APIRouter()


@router.post("/api/auth/login")
def login(body: LoginBody, request: StarletteRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.username == body.username, DBUser.password == body.password).first()
    if not user:
        fail("Invalid credentials", 401)
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
    db.commit()
    db.refresh(user)
    token = str(uuid4())
    SESSIONS[token] = user.id
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
        fail("To register as Parent, you should be 25 years or more.")
    if db.query(DBUser).filter(DBUser.username == body.username.strip()).first():
        fail("Username already taken")
    if db.query(DBUser).filter(DBUser.email == body.email.lower().strip()).first():
        fail("Email address already registered")
    if len(body.name.strip()) < 2:
        fail("Name must be at least 2 characters")
    check_password_complexity(body.password)
    if body.gender not in ("male", "female", "other"):
        fail("Gender must be 'male', 'female', or 'other'")

    location = get_location_from_ip(get_client_ip(request))
    expires = (datetime.now(timezone.utc) + timedelta(hours=ACTIVATION_TOKEN_TTL_HOURS)).isoformat()

    user = DBUser(
        id=str(uuid4()),
        name=body.name.strip(),
        username=body.username.strip(),
        password=body.password,
        role="parent",
        email=body.email.lower().strip(),
        date_of_birth=body.dateOfBirth,
        gender=body.gender,
        country=location["country"],
        city=location["city"],
        is_active="0",
        activation_token=str(uuid4()),
        activation_token_expires=expires,
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
    user = db.query(DBUser).filter(DBUser.username == body.username.strip()).first()
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
    username = body.username.strip()
    email = body.email.strip().lower()
    user = db.query(DBUser).filter(DBUser.username == username, DBUser.email == email).first()
    if not user:
        fail("We couldn't find an account with that username and email combination.")
    user.reset_token = str(uuid4())
    user.reset_token_expires = (datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_TTL_HOURS)).isoformat()
    db.commit()
    if not send_reset_email(user):
        fail("Username and email matched, but we couldn't send the reset email. Please try again shortly.", 500)
    return ok({"message": "Username and email matched! A password reset link has been sent to your email."})


@router.post("/api/auth/reset-password")
def reset_password(body: ResetPasswordBody, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.reset_token == body.token).first()
    if not user:
        fail("This password reset link is invalid. It may have already been used — request a new one.")
    if user.reset_token_expires and datetime.fromisoformat(user.reset_token_expires) < datetime.now(timezone.utc):
        fail("This password reset link has expired. Please request a new one.")
    check_password_complexity(body.password)
    user.password = body.password
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    return ok({"message": "Your password has been reset. You can sign in with your new password now."})


@router.post("/api/auth/forgot-username")
def forgot_username(body: ForgotUsernameBody, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    user = db.query(DBUser).filter(DBUser.email == email).first()
    if not user:
        fail("We couldn't find an account with that email address.")
    if not send_username_email(user):
        fail("Email matched, but we couldn't send the reminder. Please try again shortly.", 500)
    return ok({"message": "Email matched! Your username has been sent to your email."})


@router.put("/api/auth/password")
def change_own_password(body: ChangeOwnPasswordBody, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    check_password_complexity(body.password)
    user.password = body.password
    db.add(user); db.commit()
    return ok({"message": "Password updated"})
