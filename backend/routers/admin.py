from uuid import uuid4
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from config import EMAIL_RE
from database import get_db
from deps import require_admin
from email_utils import send_email
from helpers import (
    chore_dict, delete_family, delete_kid, delete_lone_user, get_ticket_notification_email,
    get_ticket_replies, now, safe_user, ticket_dict,
)
from models import DBChore, DBRecurringTemplate, DBSupportTicket, DBSupportTicketReply, DBTransaction, DBUser, DBWallet
from responses import fail, ok
from schemas import AdminChoreUpdate, AdminUserUpdate, TicketReplyBody
from security import check_password_complexity, check_pin_complexity

router = APIRouter()


@router.get("/api/admin/families")
def admin_list_families(db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    primary_guardians = db.query(DBUser).filter(
        DBUser.role == "guardian",
        DBUser.co_guardian_of == None,
    ).all()

    result = []
    for guardian in primary_guardians:
        family_id = guardian.id
        co_guardian = db.query(DBUser).filter(DBUser.co_guardian_of == family_id).first()
        kids = db.query(DBUser).filter(DBUser.role == "kid", DBUser.guardian_id == family_id).all()

        chore_counts = {}
        for status in ("open", "pending", "complete", "expired"):
            chore_counts[status] = db.query(DBChore).filter(
                DBChore.family_id == family_id, DBChore.status == status
            ).count()

        recurring_count = db.query(DBRecurringTemplate).filter(
            DBRecurringTemplate.family_id == family_id,
            DBRecurringTemplate.is_active == "1",
        ).count()

        kid_data = []
        for kid in kids:
            wallet = db.query(DBWallet).filter(DBWallet.kid_id == kid.id).first()
            kid_data.append({**safe_user(kid), "balance": wallet.balance if wallet else 0})

        result.append({
            "familyId": family_id,
            "guardian": safe_user(guardian),
            "coGuardian": safe_user(co_guardian) if co_guardian else None,
            "kids": kid_data,
            "choreCounts": chore_counts,
            "recurringCount": recurring_count,
        })

    return ok(result)


@router.get("/api/admin/family/{family_id}/chores")
def admin_family_chores(family_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    chores = db.query(DBChore).filter(
        DBChore.family_id == family_id,
    ).order_by(DBChore.created_at.desc()).limit(100).all()
    return ok([chore_dict(c) for c in chores])


@router.put("/api/admin/user/{user_id}")
def admin_update_user(user_id: str, body: AdminUserUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    target = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not target:
        fail("User not found", 404)
    if target.role == "admin":
        fail("Cannot edit admin accounts", 403)
    if body.name is not None:
        if len(body.name.strip()) < 2:
            fail("Name must be at least 2 characters")
        target.name = body.name.strip()
    if body.email is not None and body.email.strip():
        if not EMAIL_RE.match(body.email.strip()):
            fail("Invalid email address")
        clash = db.query(DBUser).filter(DBUser.email == body.email.lower().strip(), DBUser.id != user_id).first()
        if clash:
            fail("Email address already in use")
        target.email = body.email.lower().strip()
    is_profile = target.role == "kid" or target.co_guardian_of
    if body.pin is not None and body.pin and is_profile:
        check_pin_complexity(body.pin)
        target.pin = body.pin
        target.pin_auto_generated = "0"
        target.pin_attempts = 0
        target.pin_locked_until = None
    if body.password is not None and body.password and not is_profile:
        check_password_complexity(body.password)
        target.password = body.password
    if body.avatar is not None:
        target.avatar = body.avatar
    db.commit()
    db.refresh(target)
    return ok(safe_user(target))


@router.post("/api/admin/user/{user_id}/suspend")
def admin_suspend_user(user_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    target = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not target:
        fail("User not found", 404)
    if target.role == "admin":
        fail("Cannot suspend admin accounts", 403)
    target.is_suspended = "1"
    db.commit()
    db.refresh(target)
    return ok(safe_user(target))


@router.post("/api/admin/user/{user_id}/unsuspend")
def admin_unsuspend_user(user_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    target = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not target:
        fail("User not found", 404)
    target.is_suspended = "0"
    db.commit()
    db.refresh(target)
    return ok(safe_user(target))


@router.delete("/api/admin/user/{user_id}")
def admin_delete_user(user_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    target = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not target:
        fail("User not found", 404)
    if target.role == "admin":
        fail("Cannot delete admin accounts", 403)

    name, username = target.name, target.username
    if target.role == "kid":
        delete_kid(db, target)
    elif target.co_guardian_of:
        delete_lone_user(db, target)
    else:
        delete_family(db, target)

    db.commit()
    return ok({"message": f"{name} (@{username}) has been deleted."})


@router.put("/api/admin/chore/{chore_id}")
def admin_update_chore(chore_id: str, body: AdminChoreUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    chore = db.query(DBChore).filter(DBChore.id == chore_id).first()
    if not chore:
        fail("Chore not found", 404)
    if body.title is not None:
        if not body.title.strip():
            fail("Title cannot be empty")
        chore.title = body.title.strip()
    if body.description is not None:
        chore.description = body.description
    if body.points is not None:
        if body.points < 0:
            fail("Points must be non-negative")
        chore.points = body.points
    if body.status is not None:
        if body.status not in ("open", "pending", "complete", "expired"):
            fail("Invalid status")
        chore.status = body.status
    if body.assignedKidId is not None:
        chore.assigned_kid_id = body.assignedKidId or None
    if body.dueDate is not None:
        chore.due_date = body.dueDate or None
    if body.imageEmoji is not None:
        chore.image_emoji = body.imageEmoji
    db.commit()
    db.refresh(chore)
    return ok(chore_dict(chore))


@router.get("/api/admin/family/{family_id}/transactions")
def admin_family_transactions(family_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    kids = db.query(DBUser).filter(DBUser.role == "kid", DBUser.guardian_id == family_id).all()
    kid_ids = [k.id for k in kids]
    if not kid_ids:
        return ok([])

    kid_map = {k.id: k for k in kids}
    txns = db.query(DBTransaction).filter(
        DBTransaction.kid_id.in_(kid_ids)
    ).order_by(DBTransaction.timestamp.desc()).limit(100).all()

    result = []
    for t in txns:
        kid = kid_map.get(t.kid_id)
        result.append({
            "id": t.id,
            "kidId": t.kid_id,
            "kidName": kid.name if kid else "Unknown",
            "kidAvatar": kid.avatar if kid else "👤",
            "type": t.type,
            "amount": t.amount,
            "description": t.description,
            "timestamp": t.timestamp,
        })
    return ok(result)


@router.get("/api/admin/tickets")
def admin_list_tickets(status: Optional[str] = None, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    q = db.query(DBSupportTicket)
    if status:
        if status not in ("open", "resolved"):
            fail("status must be 'open' or 'resolved'")
        q = q.filter(DBSupportTicket.status == status)
    tickets = q.order_by(DBSupportTicket.created_at.desc()).limit(200).all()
    return ok([ticket_dict(t, get_ticket_replies(db, t.id)) for t in tickets])


@router.post("/api/admin/tickets/{ticket_id}/resolve")
def admin_resolve_ticket(ticket_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    ticket = db.query(DBSupportTicket).filter(DBSupportTicket.id == ticket_id).first()
    if not ticket:
        fail("Ticket not found", 404)
    ticket.status = "resolved"
    ticket.resolved_at = now()
    db.commit()
    db.refresh(ticket)
    return ok(ticket_dict(ticket, get_ticket_replies(db, ticket.id)))


@router.post("/api/admin/tickets/{ticket_id}/reopen")
def admin_reopen_ticket(ticket_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    ticket = db.query(DBSupportTicket).filter(DBSupportTicket.id == ticket_id).first()
    if not ticket:
        fail("Ticket not found", 404)
    ticket.status = "open"
    ticket.resolved_at = None
    db.commit()
    db.refresh(ticket)
    return ok(ticket_dict(ticket, get_ticket_replies(db, ticket.id)))


@router.post("/api/admin/tickets/{ticket_id}/reply")
def admin_reply_ticket(ticket_id: str, body: TicketReplyBody, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    if not body.message.strip():
        fail("Reply message is required")
    ticket = db.query(DBSupportTicket).filter(DBSupportTicket.id == ticket_id).first()
    if not ticket:
        fail("Ticket not found", 404)

    db.add(DBSupportTicketReply(
        id=str(uuid4()), ticket_id=ticket_id, is_admin="1",
        sender_name="Reward Ur Kids Support", message=body.message.strip(), created_at=now(),
    ))
    db.commit()

    to_addr = get_ticket_notification_email(db, ticket)
    if to_addr:
        send_email(
            to_addr,
            f"[Reward Ur Kids] Re: {ticket.subject}",
            f"Hi {ticket.user_name},\n\n"
            f"Support replied to your ticket \"{ticket.subject}\":\n\n"
            f"{body.message.strip()}\n\n"
            f"Sign in and visit Contact Support to view the full conversation or reply.\n",
        )

    return ok(ticket_dict(ticket, get_ticket_replies(db, ticket_id)))
