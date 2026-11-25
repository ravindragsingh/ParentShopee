import re
import smtplib
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from html import escape

from config import (
    ACTIVATION_TOKEN_TTL_HOURS, COGUARDIAN_INVITE_TTL_HOURS, CONTACT_EMAIL, EMAIL_FROM, FRONTEND_URL,
    SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER,
)
from models import DBSupportTicket, DBUser

# Lightweight markup a support admin can type in a ticket reply -- **bold**
# and ==highlight== (see the reply box's toolbar in AdminDashboard.jsx,
# which wraps the selected text in these same delimiters). Escaped first so
# nothing in the admin's own text can inject HTML, then only these two
# patterns are turned into real tags.
def _render_ticket_markup_html(text: str) -> str:
    out = escape(text)
    out = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', out)
    out = re.sub(r'==(.+?)==', r'<mark style="background:#fef08a;padding:0 2px;border-radius:2px;">\1</mark>', out)
    return out.replace('\n', '<br>')


def _strip_ticket_markup(text: str) -> str:
    """Plain-text fallback for the same markup -- a plain-text email can't
    show a highlight, so this just keeps the bold text as-is and brackets a
    highlighted span instead of dropping the emphasis entirely."""
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'==(.+?)==', r'[\1]', text)
    return text


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


def send_new_signup_notification(user: DBUser) -> bool:
    """Internal alert to the team inbox whenever a new guardian account is created,
    so signups are visible without digging through the admin panel."""
    subject = f"New Reward Ur Kids signup: {user.email}"
    body_text = (
        f"A new account was just created:\n\n"
        f"    Name:     {user.name}\n"
        f"    Username: {user.username}\n"
        f"    Email:    {user.email}\n"
        f"    Role:     {user.role}\n"
    )
    return send_email(CONTACT_EMAIL, subject, body_text)


def send_new_ticket_notification(ticket: DBSupportTicket, user: DBUser, screenshot_bytes: bytes = None) -> bool:
    """Internal alert to the team inbox whenever a support ticket is submitted --
    same fire-and-forget background-task pattern as send_new_signup_notification
    above. The ticket is already persisted by the time this runs, so a slow or
    failed SMTP send here can never turn an already-successful submission into
    an error response for the user (the previous inline smtplib call in
    routers/contact.py did exactly that on any transient SMTP hiccup)."""
    subject = f"[Reward Ur Kids] {ticket.category}: {ticket.subject}"
    body_text = (
        f"New Support Ticket — Reward Ur Kids\n"
        f"{'='*50}\n\n"
        f"From    : {user.name} ({user.username})\n"
        f"Role    : {user.role}\n"
        f"Email   : {user.email or 'not provided'}\n"
        f"Category: {ticket.category}\n\n"
        f"Subject:\n{ticket.subject}\n\n"
        f"Message:\n{ticket.message}\n"
    )
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"[email — not configured] To: {CONTACT_EMAIL}\nSubject: {subject}\n{body_text}")
        return True
    try:
        msg = MIMEMultipart()
        msg["From"] = EMAIL_FROM
        msg["To"] = CONTACT_EMAIL
        msg["Subject"] = subject
        msg.attach(MIMEText(body_text, "plain"))
        if screenshot_bytes:
            img_part = MIMEImage(screenshot_bytes)
            img_part.add_header("Content-Disposition", "attachment", filename="screenshot.png")
            msg.attach(img_part)
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as srv:
            srv.starttls()
            srv.login(SMTP_USER, SMTP_PASSWORD)
            srv.send_message(msg)
        return True
    except Exception as exc:
        print(f"[email] ticket notification send failed: {exc}")
        return False


def send_ticket_reply_email(ticket: DBSupportTicket, reply_message: str, to_addr: str) -> bool:
    """Sent whenever support replies to a ticket. The only HTML email in the
    app (every other one here is plain text) -- the admin reply box supports
    **bold**/==highlight== formatting, which a plain-text email can't
    represent at all, so this sends both an HTML part (with real formatting)
    and a plain-text fallback part for clients that don't render HTML."""
    subject = f"[Reward Ur Kids] Re: {ticket.subject}"
    plain_body = (
        f"Hi {ticket.user_name},\n\n"
        f"Support replied to your ticket \"{ticket.subject}\":\n\n"
        f"{_strip_ticket_markup(reply_message)}\n\n"
        f"Sign in and visit Contact Support to view the full conversation or reply.\n"
    )
    html_body = (
        f"<p>Hi {escape(ticket.user_name)},</p>"
        f"<p>Support replied to your ticket “{escape(ticket.subject)}”:</p>"
        f"<div style=\"background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin:12px 0;white-space:pre-wrap;\">"
        f"{_render_ticket_markup_html(reply_message)}"
        f"</div>"
        f"<p>Sign in and visit Contact Support to view the full conversation or reply.</p>"
    )
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"[email — not configured] To: {to_addr}\nSubject: {subject}\n{plain_body}")
        return True
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = EMAIL_FROM
        msg["To"] = to_addr
        msg["Subject"] = subject
        msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as srv:
            srv.starttls()
            srv.login(SMTP_USER, SMTP_PASSWORD)
            srv.send_message(msg)
        return True
    except Exception as exc:
        print(f"[email] ticket reply send failed: {exc}")
        return False


def send_admin_message_email(target_name: str, subject: str, message: str, to_addr: str) -> bool:
    """Sent for any admin-initiated message delivered via
    helpers.notify_user_via_ticket -- a direct one-off message from the
    Families panel, a referral payout confirmation, etc. Same HTML (with
    **bold**/==highlight== support) + plain-text-fallback shape as
    send_ticket_reply_email, just framed as a new message rather than a
    reply to something the user submitted. Note this puts the actual message
    content in the email -- including anything sensitive within it, like a
    gift card code in a referral payout notification -- a deliberate choice
    to make admin messages actually useful by email, not a side effect."""
    full_subject = f"[Reward Ur Kids] {subject}"
    plain_body = (
        f"Hi {target_name},\n\n"
        f"You have a new message from the Reward Ur Kids team:\n\n"
        f"{_strip_ticket_markup(message)}\n\n"
        f"Sign in and visit My Tickets (Contact Support) to view or reply.\n"
    )
    html_body = (
        f"<p>Hi {escape(target_name)},</p>"
        f"<p>You have a new message from the Reward Ur Kids team:</p>"
        f"<div style=\"background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin:12px 0;white-space:pre-wrap;\">"
        f"{_render_ticket_markup_html(message)}"
        f"</div>"
        f"<p>Sign in and visit My Tickets (Contact Support) to view or reply.</p>"
    )
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"[email — not configured] To: {to_addr}\nSubject: {full_subject}\n{plain_body}")
        return True
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = EMAIL_FROM
        msg["To"] = to_addr
        msg["Subject"] = full_subject
        msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as srv:
            srv.starttls()
            srv.login(SMTP_USER, SMTP_PASSWORD)
            srv.send_message(msg)
        return True
    except Exception as exc:
        print(f"[email] admin message send failed: {exc}")
        return False


def send_reset_email(user: DBUser, link: str) -> bool:
    """`link` is a Firebase password-reset link (see firebase_app.py /
    routers/auth.py forgot_password) -- Firebase owns the token/expiry now,
    this just keeps the branded email wrapper around it."""
    subject = "Reset your Reward Ur Kids password"
    body_text = (
        f"Hi {user.name},\n\n"
        f"We received a request to reset the password for your Reward Ur Kids account "
        f"(username: {user.username}). Click the link below to choose a new password:\n\n"
        f"    {link}\n\n"
        f"If you didn't request this, you can safely ignore this email — your password won't be changed.\n"
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


def send_coguardian_invite_email(email: str, guardian_name: str, token: str) -> bool:
    link = f"{FRONTEND_URL}/coguardian-invite?token={token}"
    subject = f"{guardian_name} invited you to co-manage their family on Reward Ur Kids"
    body_text = (
        f"Hi,\n\n"
        f"{guardian_name} has invited you to join their family on Reward Ur Kids as a "
        f"co-guardian. You'll be able to manage chores, rewards, and your kids' wallets "
        f"together, with the same access as {guardian_name}.\n\n"
        f"Accept the invite here:\n\n"
        f"    {link}\n\n"
        f"This link expires in {COGUARDIAN_INVITE_TTL_HOURS // 24} days. If you weren't "
        f"expecting this, you can safely ignore this email.\n"
    )
    return send_email(email, subject, body_text)


def send_coguardian_recovery_email(email: str, guardian_name: str, token: str) -> bool:
    link = f"{FRONTEND_URL}/coguardian-invite?token={token}"
    subject = "Regain access to your Reward Ur Kids co-guardian profile"
    body_text = (
        f"Hi,\n\n"
        f"{guardian_name} sent you this link to get your co-guardian profile working "
        f"again on a new or reset device -- your profile, PIN, and access are unchanged.\n\n"
        f"    {link}\n\n"
        f"This link expires in {COGUARDIAN_INVITE_TTL_HOURS // 24} days. If you weren't "
        f"expecting this, you can safely ignore this email.\n"
    )
    return send_email(email, subject, body_text)
