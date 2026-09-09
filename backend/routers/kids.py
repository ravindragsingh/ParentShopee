from collections import Counter
from datetime import date, datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session

from content_filter import check_content
from database import get_db
from deps import require_auth, require_guardian
from helpers import generate_inert_credentials, get_family_id, now, safe_user
from models import DBChore, DBTransaction, DBUser, DBWallet
from responses import fail, ok
from schemas import AddKidBody, BehaviourBody, BonusPointsBody, UpdateKidBirthdateBody, UpdatePinBody, WalletAdjustBody
from security import check_pin_complexity

router = APIRouter()


@router.get("/api/users/kids")
def list_kids(db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    family_id = get_family_id(user)
    kids = db.query(DBUser).filter(DBUser.role == "kid", DBUser.guardian_id == family_id).all()
    return ok([safe_user(k) for k in kids])


@router.get("/api/users/guardians")
def list_guardians(db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    guardians = db.query(DBUser).filter(DBUser.role == "guardian").all()
    return ok([safe_user(p) for p in guardians])


@router.post("/api/kids")
def add_kid(body: AddKidBody, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    family_id = get_family_id(user)
    count = db.query(DBUser).filter(DBUser.role == "kid", DBUser.guardian_id == family_id).count()
    if count >= 10:
        fail("You can add a maximum of 10 children")
    if len(body.name.strip()) < 2:
        fail("Name must be at least 2 characters")
    check_pin_complexity(body.pin)
    if not (1 <= body.birthMonth <= 12):
        fail("Birth month must be between 1 and 12")
    current_year = date.today().year
    if not (current_year - 25 <= body.birthYear <= current_year):
        fail("Please enter a valid birth year")

    username, password = generate_inert_credentials()
    kid = DBUser(
        id=str(uuid4()),
        name=body.name.strip(),
        username=username,
        password=password,
        role="kid",
        guardian_id=family_id,
        avatar=body.avatar or "🐶",
        birth_month=body.birthMonth,
        birth_year=body.birthYear,
        pin=body.pin,
        pin_auto_generated="0",
        created_at=now(),
    )
    db.add(kid)
    db.flush()   # get kid.id before commit
    db.add(DBWallet(kid_id=kid.id, balance=0))
    db.commit()
    db.refresh(kid)
    return ok(safe_user(kid), 201)


@router.post("/api/kids/{kid_id}/bonus")
def award_bonus(kid_id: str, body: BonusPointsBody, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid", DBUser.guardian_id == family_id).first()
    if not kid:
        fail("Child not found or not in your family", 404)
    if body.points <= 0:
        fail("Points must be greater than 0")

    wallet = db.query(DBWallet).filter(DBWallet.kid_id == kid_id).first()
    if not wallet:
        wallet = DBWallet(kid_id=kid_id, balance=0)
        db.add(wallet)
        db.flush()

    wallet.balance += body.points
    db.add(DBTransaction(
        id=str(uuid4()), kid_id=kid_id, type="bonus",
        amount=body.points,
        description=body.reason.strip() if body.reason and body.reason.strip() else "Bonus points",
        timestamp=now(),
    ))
    db.commit()
    db.refresh(wallet)
    return ok({"kidName": kid.name, "pointsAwarded": body.points, "newBalance": wallet.balance})


@router.post("/api/kids/{kid_id}/wallet/adjust")
def adjust_wallet(kid_id: str, body: WalletAdjustBody, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    if body.amount == 0:
        fail("Amount cannot be zero")
    if body.reason and len(body.reason.strip()) > 15:
        fail("Message must be 15 characters or fewer")
    check_content(body.reason or "")
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid", DBUser.guardian_id == family_id).first()
    if not kid:
        fail("Child not found or not in your family", 404)
    wallet = db.query(DBWallet).filter(DBWallet.kid_id == kid_id).first()
    if not wallet:
        wallet = DBWallet(kid_id=kid_id, balance=0)
        db.add(wallet)
        db.flush()
    new_balance = wallet.balance + body.amount
    if new_balance < 0:
        fail(f"Cannot deduct more than current balance ({int(wallet.balance)} pts)")
    wallet.balance = new_balance
    tx_type = "bonus" if body.amount > 0 else "deduct"
    desc = body.reason.strip() if body.reason and body.reason.strip() else ("Bonus points" if body.amount > 0 else "Points adjusted")
    db.add(DBTransaction(id=str(uuid4()), kid_id=kid_id, type=tx_type, amount=abs(body.amount),
                         description=desc, timestamp=now()))
    db.commit()
    db.refresh(wallet)
    return ok({"kidName": kid.name, "adjustment": body.amount, "newBalance": wallet.balance})


@router.post("/api/kids/{kid_id}/behaviour")
def award_behaviour(kid_id: str, body: BehaviourBody, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    if body.points == 0:
        fail("Points cannot be zero")
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid", DBUser.guardian_id == family_id).first()
    if not kid:
        fail("Child not found or not in your family", 404)
    wallet = db.query(DBWallet).filter(DBWallet.kid_id == kid_id).first()
    if not wallet:
        wallet = DBWallet(kid_id=kid_id, balance=0)
        db.add(wallet)
        db.flush()
    if body.points < 0 and wallet.balance + body.points < 0:
        fail(f"Cannot remove more than current balance ({int(wallet.balance)} pts)")
    wallet.balance += body.points
    tx_type = "behaviour" if body.points > 0 else "behaviour_deduct"
    desc = "Bonus received for good behaviour" if body.points > 0 else "Good behaviour points removed"
    db.add(DBTransaction(
        id=str(uuid4()), kid_id=kid_id, type=tx_type,
        amount=abs(body.points), description=desc, timestamp=now(),
    ))
    db.commit()
    db.refresh(wallet)
    return ok({"kidName": kid.name, "points": body.points, "newBalance": wallet.balance})


@router.put("/api/kids/{kid_id}/pin")
def update_kid_pin(kid_id: str, body: UpdatePinBody, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid", DBUser.guardian_id == family_id).first()
    if not kid:
        fail("Child not found or not in your family", 404)
    check_pin_complexity(body.pin)
    kid.pin = body.pin
    kid.pin_auto_generated = "0"
    kid.pin_attempts = 0
    kid.pin_locked_until = None
    db.commit()
    return ok({"message": f"PIN updated for {kid.name}"})


@router.put("/api/kids/{kid_id}/birthdate")
def update_kid_birthdate(kid_id: str, body: UpdateKidBirthdateBody, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    """Birth month/year are required when a kid is first added, but older
    accounts (created before that requirement, or via an admin path) can
    still be missing one -- without it, age-matched content like
    Future-Ready has no way to know which age band to show that kid."""
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid", DBUser.guardian_id == family_id).first()
    if not kid:
        fail("Child not found or not in your family", 404)
    if not (1 <= body.birthMonth <= 12):
        fail("Birth month must be between 1 and 12")
    current_year = date.today().year
    if not (current_year - 25 <= body.birthYear <= current_year):
        fail("Please enter a valid birth year")

    kid.birth_month = body.birthMonth
    kid.birth_year = body.birthYear
    db.commit()
    db.refresh(kid)
    return ok(safe_user(kid))


@router.get("/api/kids/{kid_id}/report")
def get_kid_report(kid_id: str, period: str = "weekly", db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    if period not in ("weekly", "monthly"):
        fail("period must be 'weekly' or 'monthly'")
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid", DBUser.guardian_id == family_id).first()
    if not kid:
        fail("Child not found or not in your family", 404)

    days = 7 if period == "weekly" else 30
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    chores = db.query(DBChore).filter(
        DBChore.status == "complete",
        DBChore.completed_at.isnot(None),
        DBChore.completed_at >= cutoff,
        or_(DBChore.assigned_kid_id == kid_id, DBChore.completed_by_kid_id == kid_id),
    ).all()

    txns = db.query(DBTransaction).filter(
        DBTransaction.kid_id == kid_id,
        DBTransaction.timestamp >= cutoff,
    ).order_by(DBTransaction.timestamp.desc()).all()

    daily_completions = [t for t in txns if t.type == "earned" and t.description.startswith("Daily chore")]
    spent_txns = [t for t in txns if t.type == "spent"]
    earned_total = sum(t.amount for t in txns if t.type in ("earned", "bonus"))
    spent_total = sum(t.amount for t in spent_txns)

    tasks = []
    for c in chores:
        tasks.append({"title": c.title, "imageEmoji": c.image_emoji, "points": c.points,
                      "completedAt": c.completed_at, "kind": "chore"})
    for t in daily_completions:
        title = t.description.split(": ", 1)[1] if ": " in t.description else t.description
        tasks.append({"title": title, "imageEmoji": "📅", "points": t.amount,
                      "completedAt": t.timestamp, "kind": "daily"})
    tasks.sort(key=lambda x: x["completedAt"], reverse=True)

    # "Bought: <item name>" -> the item name -- same description format the
    # shop router writes for both immediate and approval-required purchases.
    purchases = []
    for t in spent_txns:
        title = t.description.split(": ", 1)[1] if ": " in t.description else t.description
        purchases.append({"title": title, "points": t.amount, "purchasedAt": t.timestamp})

    wallet = db.query(DBWallet).filter(DBWallet.kid_id == kid_id).first()

    weekly_summary = _build_weekly_summary(db, kid_id)

    return ok({
        "kidId": kid_id,
        "kidName": kid.name,
        "period": period,
        "since": cutoff,
        "tasksCompleted": len(tasks),
        "pointsEarned": earned_total,
        "pointsSpent": spent_total,
        "currentBalance": wallet.balance if wallet else 0,
        "tasks": tasks[:100],
        "purchases": purchases[:100],
        "weeklySummary": weekly_summary,
    })


def _build_weekly_summary(db: Session, kid_id: str) -> dict:
    """Which chores a kid keeps doing vs. keeps missing, always over the
    trailing 7 days regardless of the report's own weekly/monthly toggle --
    a monthly report should still answer "how's this week going", not just
    "how's this month going".

    "Missed" covers two different mechanisms: a daily chore that rolled over
    still unchecked (daily_chore_logic.py writes a "Missed daily chore: X"
    deduction transaction for those), and a one-off chore that passed its due
    date untouched (chore_logic.py flips it to status="expired"). Both read
    as the same thing to a guardian -- "assigned but didn't happen" -- so
    they're merged into one list here.
    """
    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

    done_chores = db.query(DBChore).filter(
        DBChore.status == "complete",
        DBChore.completed_at.isnot(None),
        DBChore.completed_at >= cutoff,
        or_(DBChore.assigned_kid_id == kid_id, DBChore.completed_by_kid_id == kid_id),
    ).all()
    week_txns = db.query(DBTransaction).filter(
        DBTransaction.kid_id == kid_id,
        DBTransaction.timestamp >= cutoff,
    ).all()
    done_daily = [t for t in week_txns if t.type == "earned" and t.description.startswith("Daily chore")]
    missed_daily = [t for t in week_txns if t.type == "deduct" and t.description.startswith("Missed daily chore:")]
    expired_chores = db.query(DBChore).filter(
        DBChore.status == "expired",
        DBChore.expired_at.isnot(None),
        DBChore.expired_at >= cutoff,
        DBChore.assigned_kid_id == kid_id,
    ).all()

    regular_counts, regular_emoji = Counter(), {}
    for c in done_chores:
        regular_counts[c.title] += 1
        regular_emoji[c.title] = c.image_emoji
    for t in done_daily:
        title = t.description.split(": ", 1)[1] if ": " in t.description else t.description
        regular_counts[title] += 1
        regular_emoji.setdefault(title, "📅")

    missed_counts, missed_emoji, missed_kind = Counter(), {}, {}
    for t in missed_daily:
        title = t.description.split(": ", 1)[1] if ": " in t.description else t.description
        missed_counts[title] += 1
        missed_emoji.setdefault(title, "📅")
        missed_kind[title] = "daily"
    for c in expired_chores:
        missed_counts[c.title] += 1
        missed_emoji.setdefault(c.title, c.image_emoji)
        missed_kind.setdefault(c.title, "expired")

    return {
        "regularChores": [
            {"title": title, "imageEmoji": regular_emoji[title], "count": count}
            for title, count in regular_counts.most_common(3)
        ],
        "missedChores": [
            {"title": title, "imageEmoji": missed_emoji[title], "count": count, "kind": missed_kind[title]}
            for title, count in missed_counts.most_common(3)
        ],
    }
