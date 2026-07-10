import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from config import (
    ACTIVATION_TOKEN_TTL_HOURS, EMAIL_FROM, FRONTEND_URL, RESET_TOKEN_TTL_HOURS,
    SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER,
)
from models import DBUser


def send_email(to_addr: str, subject: str, body_text: str) -> bool:
    """Best-effort plain-text email send. Returns True if actually sent. If SMTP
    creds aren't configured (e.g. local dev), logs the content instead so the flow
    is still testable, and callers treat that as success (matches existing /api/contact
    behaviour)."""
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"[email — not configured] To: {to_addr}\nSubject: {subject}\n{body_text}")
        return True
    try:
        msg = MIMEMultipart()
        msg["From"] = EMAIL_FROM
        msg["To"] = to_addr
        msg["Subject"] = subject
        msg.attach(MIMEText(body_text, "plain"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as srv:
            srv.starttls()
            srv.login(SMTP_USER, SMTP_PASSWORD)
            srv.send_message(msg)
        return True
    except Exception as exc:
        print(f"[email] send failed: {exc}")
        return False


def send_activation_email(user: DBUser) -> bool:
    link = f"{FRONTEND_URL}/activate?token={user.activation_token}"
    subject = "Activate your Reward Ur Kids account"
    body_text = (
        f"Hi {user.name},\n\n"
        f"Thanks for signing up for Reward Ur Kids! Please activate your account by "
        f"clicking the link below:\n\n"
        f"    {link}\n\n"
        f"This link expires in {ACTIVATION_TOKEN_TTL_HOURS} hours. If you didn't create "
        f"this account, you can safely ignore this email.\n"
    )
    return send_email(user.email, subject, body_text)


def send_reset_email(user: DBUser) -> bool:
    link = f"{FRONTEND_URL}/reset-password?token={user.reset_token}"
    subject = "Reset your Reward Ur Kids password"
    body_text = (
        f"Hi {user.name},\n\n"
        f"We received a request to reset the password for your Reward Ur Kids account "
        f"(username: {user.username}). Click the link below to choose a new password:\n\n"
        f"    {link}\n\n"
        f"This link expires in {RESET_TOKEN_TTL_HOURS} hour. If you didn't request this, "
        f"you can safely ignore this email — your password won't be changed.\n"
    )
    return send_email(user.email, subject, body_text)


def send_username_email(user: DBUser) -> bool:
    subject = "Your Reward Ur Kids username"
    body_text = (
        f"Hi {user.name},\n\n"
        f"You (or someone) requested a reminder of your Reward Ur Kids username. It is:\n\n"
        f"    {user.username}\n\n"
        f"If you didn't request this, you can safely ignore this email.\n"
    )
    return send_email(user.email, subject, body_text)
