from datetime import date
from uuid import uuid4

from sqlalchemy.orm import Session

from daily_chore_samples import MAX_DAILY_CHORE_ITEMS, get_daily_chore_bank
from helpers import calculate_approx_age, now
from models import DBDailyChoreItem, DBTransaction, DBUser, DBWallet


def ensure_daily_chores_seeded(db: Session, kid: DBUser) -> None:
    """First time a kid's Daily Chores list is touched, auto-populate it from an
    age-appropriate bank. Never re-seeds afterwards, even if the parent deletes
    everything — that's a deliberate choice, not "no chores generated yet"."""
    has_any = db.query(DBDailyChoreItem).filter(DBDailyChoreItem.kid_id == kid.id).first()
    if has_any:
        return
    age = calculate_approx_age(kid.birth_month, kid.birth_year) if (kid.birth_month and kid.birth_year) else None
    bank = get_daily_chore_bank(age)
    for i, sample in enumerate(bank[:MAX_DAILY_CHORE_ITEMS]):
        db.add(DBDailyChoreItem(
            id=str(uuid4()), kid_id=kid.id, title=sample["title"],
            image_emoji=sample["imageEmoji"], points=2, order_index=i,
            is_active="1", status="open", reset_date=None, created_at=now(),
        ))
    db.commit()


def resolve_daily_chores(db: Session, kid: DBUser) -> None:
    """Lazily rolls over to a new day. Three cases per item still on a stale
    reset_date: "open" (never attempted) loses its points if enabled; "pending"
    (kid submitted, awaiting approval) is left untouched — it carries over
    until a parent approves or rejects it, same as regular chores never time
    out; "complete" (already approved) just clears back to "open" for the new
    day without any further point change."""
    today_str = date.today().isoformat()
    items = db.query(DBDailyChoreItem).filter(
        DBDailyChoreItem.kid_id == kid.id,
        DBDailyChoreItem.is_active == "1",
        DBDailyChoreItem.reset_date != today_str,
    ).all()
    if not items:
        return

    deduction_enabled = kid.daily_deduction_enabled != "0"
    missed = [i for i in items if i.reset_date is not None and i.status == "open"]
    if missed and deduction_enabled:
        wallet = db.query(DBWallet).filter(DBWallet.kid_id == kid.id).first()
        if not wallet:
            wallet = DBWallet(kid_id=kid.id, balance=0)
            db.add(wallet)
            db.flush()
        for item in missed:
            deduct = min(item.points, wallet.balance)
            if deduct <= 0:
                continue
            wallet.balance -= deduct
            db.add(DBTransaction(
                id=str(uuid4()), kid_id=kid.id, type="deduct", amount=deduct,
                description=f"Missed daily chore: {item.title}", timestamp=now(),
            ))

    for item in items:
        if item.status == "pending":
            continue  # awaiting parent action — don't touch until they act
        item.status = "open"
        item.reset_date = today_str
    db.commit()
