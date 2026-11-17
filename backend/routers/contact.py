import base64
import binascii
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from config import CONTACT_EMAIL
from database import get_db
from deps import require_auth
from email_utils import send_email, send_new_ticket_notification
from helpers import get_ticket_replies, now, ticket_dict
from models import DBSupportTicket, DBSupportTicketReply, DBUser
from responses import fail, ok
from schemas import ContactTicketBody, TicketReplyBody

router = APIRouter()


@router.post("/api/contact")
def submit_contact(body: ContactTicketBody, background_tasks: BackgroundTasks, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    if not body.subject.strip():
        fail("Subject is required")
    if len(body.message.strip()) < 20:
        fail("Message must be at least 20 characters")

    # Decoded up front so a malformed screenshot still fails the request the
    # way it always has -- only the actual SMTP send moves to the background.
    screenshot_bytes = None
    if body.screenshot_b64:
        raw = body.screenshot_b64
        if "," in raw:
            raw = raw.split(",", 1)[1]
        try:
            screenshot_bytes = base64.b64decode(raw)
        except binascii.Error:
            fail("Invalid screenshot data — please re-attach the image.", 400)

    # Persist the ticket first so it's never lost even if email delivery fails below.
    ticket = DBSupportTicket(
        id=str(uuid4()), user_id=user.id, user_name=user.name, username=user.username,
        user_role=user.role, category=body.category, subject=body.subject.strip(),
        message=body.message.strip(), created_at=now(),
    )
    db.add(ticket)
    db.commit()
    # db.commit() expires every object in the session, `user` (loaded earlier
    # by require_auth) included -- refresh both now, while the session is
    # still open, so the background task below can read their attributes
    # without needing a live session of its own (same as send_new_signup_notification's callers).
    db.refresh(ticket)
    db.refresh(user)

    # Fire-and-forget, same pattern as send_new_signup_notification -- a
    # slow/failed SMTP send should never turn an already-saved ticket into a
    # failed response for the submitter.
    background_tasks.add_task(send_new_ticket_notification, ticket, user, screenshot_bytes)

    return ok({"message": "Your ticket has been submitted. We'll get back to you soon!"})


@router.get("/api/contact/tickets")
def list_my_tickets(db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    tickets = db.query(DBSupportTicket).filter(
        DBSupportTicket.user_id == user.id,
    ).order_by(DBSupportTicket.created_at.desc()).all()
    return ok([ticket_dict(t, get_ticket_replies(db, t.id)) for t in tickets])


@router.post("/api/contact/tickets/{ticket_id}/reply")
def reply_to_my_ticket(ticket_id: str, body: TicketReplyBody, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    if not body.message.strip():
        fail("Reply message is required")
    ticket = db.query(DBSupportTicket).filter(
        DBSupportTicket.id == ticket_id, DBSupportTicket.user_id == user.id,
    ).first()
    if not ticket:
        fail("Ticket not found", 404)

    db.add(DBSupportTicketReply(
        id=str(uuid4()), ticket_id=ticket_id, is_admin="0",
        sender_name=user.name, message=body.message.strip(), created_at=now(),
    ))
    # A user following up on a ticket the support team already resolved
    # should reopen it, so it surfaces back in the admin's "open" queue.
    if ticket.status == "resolved":
        ticket.status = "open"
        ticket.resolved_at = None
    db.commit()

    send_email(
        CONTACT_EMAIL,
        f"[Reward Ur Kids] Follow-up: {ticket.subject}",
        f"{user.name} ({user.username}) followed up on their ticket \"{ticket.subject}\":\n\n"
        f"{body.message.strip()}\n",
    )

    return ok(ticket_dict(ticket, get_ticket_replies(db, ticket_id)))
