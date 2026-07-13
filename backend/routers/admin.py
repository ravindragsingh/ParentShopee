from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session

from config import EMAIL_RE
from database import get_db
from deps import require_admin
from helpers import chore_dict, now, safe_user, ticket_dict
from models import DBChore, DBMessage, DBRecurringTemplate, DBShopItem, DBSupportTicket, DBTransaction, DBUser, DBWallet
from responses import fail, ok
from schemas import AdminChoreUpdate, AdminUserUpdate
from security import check_password_complexity

router = APIRouter()


@router.get("/api/admin/families")
def admin_list_families(db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    primary_parents = db.query(DBUser).filter(
        DBUser.role == "parent",
        DBUser.co_parent_of == None,
    ).all()

    result = []
    for parent in primary_parents:
        family_id = parent.id
        co_parent = db.query(DBUser).filter(DBUser.co_parent_of == family_id).first()
        kids = db.query(DBUser).filter(DBUser.role == "kid", DBUser.parent_id == family_id).all()

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
            "parent": safe_user(parent),
            "coParent": safe_user(co_parent) if co_parent else None,
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
    if body.password is not None and body.password:
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


def _delete_kid(db: Session, kid: DBUser):
    db.query(DBWallet).filter(DBWallet.kid_id == kid.id).delete(synchronize_session=False)
    db.query(DBTransaction).filter(DBTransaction.kid_id == kid.id).delete(synchronize_session=False)
    db.query(DBMessage).filter(or_(DBMessage.sender_id == kid.id, DBMessage.receiver_id == kid.id)).delete(synchronize_session=False)
    db.query(DBChore).filter(DBChore.assigned_kid_id == kid.id).update({"assigned_kid_id": None}, synchronize_session=False)
    db.query(DBChore).filter(DBChore.completed_by_kid_id == kid.id).update({"completed_by_kid_id": None}, synchronize_session=False)
    db.query(DBRecurringTemplate).filter(DBRecurringTemplate.assigned_kid_id == kid.id).update({"assigned_kid_id": None}, synchronize_session=False)
    db.delete(kid)

def _delete_lone_user(db: Session, u: DBUser):
    db.query(DBMessage).filter(or_(DBMessage.sender_id == u.id, DBMessage.receiver_id == u.id)).delete(synchronize_session=False)
    db.delete(u)

def _delete_family(db: Session, parent: DBUser):
    """Deleting the primary parent removes the whole family — every kid, the
    co-parent (if any), and all chores/recurring templates/shop items they own."""
    family_id = parent.id
    for kid in db.query(DBUser).filter(DBUser.role == "kid", DBUser.parent_id == family_id).all():
        _delete_kid(db, kid)
    co_parent = db.query(DBUser).filter(DBUser.co_parent_of == family_id).first()
    if co_parent:
        _delete_lone_user(db, co_parent)
    db.query(DBChore).filter(DBChore.family_id == family_id).delete(synchronize_session=False)
    db.query(DBRecurringTemplate).filter(DBRecurringTemplate.family_id == family_id).delete(synchronize_session=False)
    db.query(DBShopItem).filter(DBShopItem.family_id == family_id).delete(synchronize_session=False)
    _delete_lone_user(db, parent)

@router.delete("/api/admin/user/{user_id}")
def admin_delete_user(user_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    target = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not target:
        fail("User not found", 404)
    if target.role == "admin":
        fail("Cannot delete admin accounts", 403)

    name, username = target.name, target.username
    if target.role == "kid":
        _delete_kid(db, target)
    elif target.co_parent_of:
        _delete_lone_user(db, target)
    else:
        _delete_family(db, target)

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
    kids = db.query(DBUser).filter(DBUser.role == "kid", DBUser.parent_id == family_id).all()
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
    return ok([ticket_dict(t) for t in tickets])


@router.post("/api/admin/tickets/{ticket_id}/resolve")
def admin_resolve_ticket(ticket_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    ticket = db.query(DBSupportTicket).filter(DBSupportTicket.id == ticket_id).first()
    if not ticket:
        fail("Ticket not found", 404)
    ticket.status = "resolved"
    ticket.resolved_at = now()
    db.commit()
    db.refresh(ticket)
    return ok(ticket_dict(ticket))


@router.post("/api/admin/tickets/{ticket_id}/reopen")
def admin_reopen_ticket(ticket_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    ticket = db.query(DBSupportTicket).filter(DBSupportTicket.id == ticket_id).first()
    if not ticket:
        fail("Ticket not found", 404)
    ticket.status = "open"
    ticket.resolved_at = None
    db.commit()
    db.refresh(ticket)
    return ok(ticket_dict(ticket))
