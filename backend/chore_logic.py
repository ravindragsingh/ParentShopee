import time
from datetime import date, datetime, timedelta, timezone
from typing import List
from uuid import uuid4

from sqlalchemy import and_
from sqlalchemy.orm import Session

from helpers import now
from models import DBChore, DBRecurringTemplate

# GET /api/chores used to run expiry + recurring-instance generation on every
# single call. Under load that meant every read also did several writes/commits,
# holding its DB connection far longer than a read needs to. Throttle it per
# family instead — at most once per window, same idea as deps.py's
# _touch_last_active — so a burst of reads only pays this cost once. In-memory
# and per-process, which is fine: SESSIONS (config.py) already assumes a single
# process, and a stale-by-at-most-one-window read here is harmless.
_last_maintenance_at: dict = {}
MAINTENANCE_THROTTLE_SECONDS = 120


def maybe_run_maintenance(db: Session, family_id: str) -> None:
    last_run = _last_maintenance_at.get(family_id)
    if last_run is not None and time.monotonic() - last_run < MAINTENANCE_THROTTLE_SECONDS:
        return
    _last_maintenance_at[family_id] = time.monotonic()
    check_and_expire_chores(db)
    for t in db.query(DBRecurringTemplate).filter(
        DBRecurringTemplate.family_id == family_id,
        DBRecurringTemplate.is_active == "1",
    ).all():
        generate_instances(db, t)


def check_and_expire_chores(db: Session):
    today = date.today().isoformat()
    db.query(DBChore).filter(
        DBChore.status.in_(["open", "pending"]),
        DBChore.due_date.isnot(None),
        DBChore.due_date < today,
    ).update({"status": "expired", "expired_at": now()}, synchronize_session=False)
    db.commit()

def get_visible_chores(db: Session, family_id: str = None, cutoff_hours: int = 72):
    today_str = date.today().isoformat()
    ts = (datetime.now(timezone.utc) - timedelta(hours=cutoff_hours)).isoformat()
    q = db.query(DBChore).filter(
        # Hide expired chores older than cutoff
        ~and_(DBChore.status == "expired",
              DBChore.expired_at.isnot(None),
              DBChore.expired_at < ts),
        # Hide completed chores older than cutoff
        ~and_(DBChore.status == "complete",
              DBChore.completed_at.isnot(None),
              DBChore.completed_at < ts),
        # Hide recurring instances scheduled for a future date
        ~and_(DBChore.template_id.isnot(None),
              DBChore.scheduled_date > today_str),
    )
    if family_id:
        q = q.filter(DBChore.family_id == family_id)
    return q.all()

def generate_instances(db: Session, template: DBRecurringTemplate):
    today = date.today()
    today_str = today.isoformat()
    # Remove any stale open instances scheduled beyond today
    db.query(DBChore).filter(
        DBChore.template_id == template.id,
        DBChore.status == "open",
        DBChore.scheduled_date > today_str,
    ).delete(synchronize_session=False)
    db.commit()
    weekly_days: List[int] = []
    if template.recurrence_days:
        try:
            weekly_days = [int(x) for x in template.recurrence_days.split(',') if x.strip()]
        except Exception:
            weekly_days = []

    for delta in range(1):  # only today — tomorrow's instance is created when tomorrow arrives
        target = today + timedelta(days=delta)
        date_str = target.isoformat()

        if template.recurrence_type == 'daily':
            matches = True
        elif template.recurrence_type == 'weekly':
            matches = target.weekday() in weekly_days
        elif template.recurrence_type == 'monthly':
            dom = int(template.recurrence_dom) if template.recurrence_dom else 1
            matches = target.day == dom
        else:
            matches = False

        if not matches:
            continue

        existing = db.query(DBChore).filter(
            DBChore.template_id == template.id,
            DBChore.scheduled_date == date_str,
        ).first()
        if existing:
            continue

        chore = DBChore(
            id=str(uuid4()),
            title=template.title,
            description=template.description or "",
            points=template.points,
            image_emoji=template.image_emoji or "📋",
            status="open",
            assigned_kid_id=template.assigned_kid_id,
            due_date=date_str,
            created_at=now(),
            family_id=template.family_id,
            template_id=template.id,
            scheduled_date=date_str,
        )
        db.add(chore)
    db.commit()
