import base64
import binascii
import smtplib
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from config import CONTACT_EMAIL, EMAIL_FROM, SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER
from database import get_db
from deps import require_auth
from helpers import now
from models import DBSupportTicket, DBUser
from responses import fail, ok
from schemas import ContactTicketBody

router = APIRouter()


@router.post("/api/contact")
def submit_contact(body: ContactTicketBody, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    if not body.subject.strip():
        fail("Subject is required")
    if len(body.message.strip()) < 20:
        fail("Message must be at least 20 characters")

    # Persist the ticket first so it's never lost even if email delivery fails below.
    db.add(DBSupportTicket(
        id=str(uuid4()), user_id=user.id, user_name=user.name, username=user.username,
        user_role=user.role, category=body.category, subject=body.subject.strip(),
        message=body.message.strip(), created_at=now(),
    ))
    db.commit()

    # Build email body
    body_text = (
        f"New Support Ticket — Reward Ur Kids\n"
        f"{'='*50}\n\n"
        f"From   : {user.name} ({user.username})\n"
        f"Role   : {user.role}\n"
        f"Email  : {user.email or 'not provided'}\n"
        f"Category: {body.category}\n\n"
        f"Subject:\n{body.subject}\n\n"
        f"Message:\n{body.message}\n"
    )

    email_sent = False
    if SMTP_USER and SMTP_PASSWORD:
        try:
            msg = MIMEMultipart()
            msg["From"]    = EMAIL_FROM
            msg["To"]      = CONTACT_EMAIL
            msg["Subject"] = f"[Reward Ur Kids] {body.category}: {body.subject}"
            msg.attach(MIMEText(body_text, "plain"))

            if body.screenshot_b64:
                raw = body.screenshot_b64
                if "," in raw:
                    raw = raw.split(",", 1)[1]
                try:
                    img_bytes = base64.b64decode(raw)
                except binascii.Error:
                    fail("Invalid screenshot data — please re-attach the image.", 400)
                img_part  = MIMEImage(img_bytes)
                img_part.add_header("Content-Disposition", "attachment", filename="screenshot.png")
                msg.attach(img_part)

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as srv:
                srv.starttls()
                srv.login(SMTP_USER, SMTP_PASSWORD)
                srv.send_message(msg)
            email_sent = True
        except Exception as exc:
            print(f"[contact] email send failed: {exc}")

    if not email_sent:
        if SMTP_USER and SMTP_PASSWORD:
            # Credentials were present but sending still failed — surface the error
            fail("Failed to send email. Please try again later.", 500)
        # No credentials configured: log the ticket so it isn't silently lost
        print(f"[contact ticket — email not configured]\n{body_text}")

    return ok({"message": "Your ticket has been submitted. We'll get back to you soon!"})
