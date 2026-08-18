import re
from datetime import date, datetime, timezone
from uuid import uuid4

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from config import CONTACT_EMAIL
from models import (
    DBChore, DBDailyChoreItem, DBMessage, DBRecurringTemplate, DBShopItem,
    DBShopPurchase, DBSupportTicket, DBTransaction, DBUser, DBWallet,
)
from responses import fail


def now() -> str:
    return datetime.now(timezone.utc).isoformat()

def calculate_age(dob_str: str) -> int:
    dob = date.fromisoformat(dob_str)
    t   = date.today()
    return t.year - dob.year - ((t.month, t.day) < (dob.month, dob.day))

def calculate_approx_age(birth_month: int, birth_year: int) -> int:
    """Approximate age from birth month/year only (kids don't give an exact day)."""
    t = date.today()
    return t.year - birth_year - (t.month < birth_month)

def get_family_id(user: DBUser) -> str:
    return user.co_guardian_of or user.id

def get_family_owner(db: Session, user: DBUser) -> DBUser:
    """The primary guardian's row — where shared lifetime add-counters live."""
    family_id = user.guardian_id if user.role == "kid" else get_family_id(user)
    return db.query(DBUser).filter(DBUser.id == family_id).first()

def generate_username_from_email(db: Session, email: str) -> str:
    """First-time Google sign-in has no chosen username — derive a reasonable
    default from the email's local part so signup stays one-click; the guardian
    can change it later from Settings same as any other username."""
    base = re.sub(r'[^a-z0-9]', '', email.split("@")[0].lower()) or "guardian"
    candidate = base
    suffix = 0
    while db.query(DBUser).filter(func.lower(DBUser.username) == candidate).first():
        suffix += 1
        candidate = f"{base}{suffix}"
    return candidate

def generate_inert_credentials() -> tuple:
    """Kid/co-guardian profiles no longer log in with a username+password — they're
    entered via PIN under the family's device session. `username`/`password`
    stay NOT NULL/unique columns though, so give them harmless, never-shown,
    never-usable placeholder values rather than risking a schema rebuild."""
    return f"profile-{uuid4().hex[:12]}", str(uuid4())

def delete_kid(db: Session, kid: DBUser):
    db.query(DBWallet).filter(DBWallet.kid_id == kid.id).delete(synchronize_session=False)
    db.query(DBTransaction).filter(DBTransaction.kid_id == kid.id).delete(synchronize_session=False)
    db.query(DBMessage).filter(or_(DBMessage.sender_id == kid.id, DBMessage.receiver_id == kid.id)).delete(synchronize_session=False)
    db.query(DBChore).filter(DBChore.assigned_kid_id == kid.id).update({"assigned_kid_id": None}, synchronize_session=False)
    db.query(DBChore).filter(DBChore.completed_by_kid_id == kid.id).update({"completed_by_kid_id": None}, synchronize_session=False)
    db.query(DBRecurringTemplate).filter(DBRecurringTemplate.assigned_kid_id == kid.id).update({"assigned_kid_id": None}, synchronize_session=False)
    db.delete(kid)

def delete_lone_user(db: Session, u: DBUser):
    db.query(DBMessage).filter(or_(DBMessage.sender_id == u.id, DBMessage.receiver_id == u.id)).delete(synchronize_session=False)
    db.delete(u)

def delete_family(db: Session, guardian: DBUser):
    """Deleting the primary guardian removes the whole family — every kid, the
    co-guardian (if any), and all chores/recurring templates/shop items they own."""
    family_id = guardian.id
    for kid in db.query(DBUser).filter(DBUser.role == "kid", DBUser.guardian_id == family_id).all():
        delete_kid(db, kid)
    co_guardian = db.query(DBUser).filter(DBUser.co_guardian_of == family_id).first()
    if co_guardian:
        delete_lone_user(db, co_guardian)
    db.query(DBChore).filter(DBChore.family_id == family_id).delete(synchronize_session=False)
    db.query(DBRecurringTemplate).filter(DBRecurringTemplate.family_id == family_id).delete(synchronize_session=False)
    db.query(DBShopItem).filter(DBShopItem.family_id == family_id).delete(synchronize_session=False)
    delete_lone_user(db, guardian)

def check_add_limit(db: Session, user: DBUser, field: str, extra: int, limit: int, item_label: str) -> DBUser:
    """Raises 400 if adding `extra` more items would exceed the family's lifetime limit."""
    owner = get_family_owner(db, user)
    current = getattr(owner, field) or 0
    if current + extra > limit:
        fail(
            f"You've reached the limit of {limit} custom {item_label} for your family. "
            f"To add more, please contact our support team at {CONTACT_EMAIL}.",
            403,
        )
    return owner

def safe_user(u: DBUser) -> dict:
    return {"id": u.id, "name": u.name, "username": u.username, "role": u.role,
            "email": u.email, "guardianId": u.guardian_id, "avatar": u.avatar,
            "gender": u.gender, "coGuardianOf": u.co_guardian_of,
            "country": u.country, "city": u.city,
            "lastLoginCountry": u.last_login_country, "lastLoginCity": u.last_login_city,
            "lastLoginAt": u.last_login_at,
            "birthMonth": u.birth_month, "birthYear": u.birth_year,
            "age": calculate_approx_age(u.birth_month, u.birth_year) if (u.birth_month and u.birth_year) else None,
            "createdAt": u.created_at, "lastActiveAt": u.last_active_at,
            "isSuspended": u.is_suspended == "1",
            "requiresPin": u.pin is not None, "pinAutoGenerated": u.pin_auto_generated == "1"}

def chore_dict(c: DBChore) -> dict:
    return {"id": c.id, "title": c.title, "description": c.description,
            "points": c.points, "imageEmoji": c.image_emoji, "status": c.status,
            "assignedKidId": c.assigned_kid_id, "completedByKidId": c.completed_by_kid_id,
            "dueDate": c.due_date, "expiredAt": c.expired_at,
            "completedAt": c.completed_at, "createdAt": c.created_at,
            "templateId": c.template_id, "scheduledDate": c.scheduled_date}

def recurring_dict(t: DBRecurringTemplate) -> dict:
    days = [int(x) for x in t.recurrence_days.split(',') if x.strip()] if t.recurrence_days else []
    return {
        "id": t.id, "title": t.title, "description": t.description,
        "points": t.points, "imageEmoji": t.image_emoji,
        "assignedKidId": t.assigned_kid_id,
        "recurrenceType": t.recurrence_type,
        "recurrenceDays": days,
        "recurrenceDom": int(t.recurrence_dom) if t.recurrence_dom else None,
        "createdAt": t.created_at,
    }

def shop_dict(s: DBShopItem) -> dict:
    return {"id": s.id, "name": s.name, "description": s.description,
            "cost": s.cost, "imageEmoji": s.image_emoji, "createdAt": s.created_at}

def daily_chore_dict(item: DBDailyChoreItem) -> dict:
    return {"id": item.id, "kidId": item.kid_id, "title": item.title,
            "imageEmoji": item.image_emoji, "points": item.points,
            "orderIndex": item.order_index, "status": item.status}

def purchase_dict(p: DBShopPurchase) -> dict:
    return {"id": p.id, "kidId": p.kid_id, "shopItemId": p.shop_item_id,
            "itemName": p.item_name, "imageEmoji": p.image_emoji, "cost": p.cost,
            "status": p.status, "createdAt": p.created_at, "resolvedAt": p.resolved_at}

def ticket_dict(t: DBSupportTicket) -> dict:
    return {"id": t.id, "userId": t.user_id, "userName": t.user_name, "username": t.username,
            "userRole": t.user_role, "category": t.category, "subject": t.subject,
            "message": t.message, "status": t.status,
            "createdAt": t.created_at, "resolvedAt": t.resolved_at}
