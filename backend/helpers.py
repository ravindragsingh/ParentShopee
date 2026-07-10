from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from config import CONTACT_EMAIL
from models import DBChore, DBRecurringTemplate, DBShopItem, DBUser
from responses import fail


def now() -> str:
    return datetime.now(timezone.utc).isoformat()

def calculate_age(dob_str: str) -> int:
    dob = date.fromisoformat(dob_str)
    t   = date.today()
    return t.year - dob.year - ((t.month, t.day) < (dob.month, dob.day))

def get_family_id(user: DBUser) -> str:
    return user.co_parent_of or user.id

def get_family_owner(db: Session, user: DBUser) -> DBUser:
    """The primary parent's row — where shared lifetime add-counters live."""
    return db.query(DBUser).filter(DBUser.id == get_family_id(user)).first()

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
            "email": u.email, "parentId": u.parent_id, "avatar": u.avatar,
            "gender": u.gender, "coParentOf": u.co_parent_of,
            "country": u.country, "city": u.city,
            "lastLoginCountry": u.last_login_country, "lastLoginCity": u.last_login_city}

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
