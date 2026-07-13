from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from content_filter import check_content
from daily_chore_logic import ensure_daily_chores_seeded, resolve_daily_chores
from daily_chore_samples import MAX_DAILY_CHORE_ITEMS, get_all_daily_chore_templates, get_daily_chore_bank
from database import get_db
from deps import require_auth, require_parent
from helpers import calculate_approx_age, daily_chore_dict, get_family_id, now
from models import DBDailyChoreItem, DBTransaction, DBUser, DBWallet
from responses import fail, ok
from schemas import DailyChoreItemCreate, DailyChoreItemUpdate, DailyChoreSettingsUpdate

router = APIRouter()


def _get_family_kid(db: Session, family_id: str, kid_id: str) -> DBUser:
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid", DBUser.parent_id == family_id).first()
    if not kid:
        fail("Child not found or not in your family", 404)
    return kid


def _resolve_target_kid(db: Session, user: DBUser, kid_id_param: str = None) -> DBUser:
    """Kids may only ever act on themselves; parents must specify a kid in their family."""
    if user.role == "kid":
        return user
    if not kid_id_param:
        fail("kidId is required", 400)
    return _get_family_kid(db, get_family_id(user), kid_id_param)


def _owning_kid_for_item(db: Session, user: DBUser, item: DBDailyChoreItem) -> DBUser:
    if user.role == "kid":
        if item.kid_id != user.id:
            fail("Not allowed to modify this item", 403)
        return user
    kid = db.query(DBUser).filter(DBUser.id == item.kid_id).first()
    if not kid or kid.parent_id != get_family_id(user):
        fail("Not allowed to modify this item", 403)
    return kid


def _award(db: Session, kid: DBUser, item: DBDailyChoreItem, desc_prefix: str) -> DBWallet:
    wallet = db.query(DBWallet).filter(DBWallet.kid_id == kid.id).first()
    if not wallet:
        wallet = DBWallet(kid_id=kid.id, balance=0)
        db.add(wallet)
        db.flush()
    wallet.balance += item.points
    db.add(DBTransaction(id=str(uuid4()), kid_id=kid.id, type="earned",
                         amount=item.points, description=f"{desc_prefix}: {item.title}", timestamp=now()))
    item.status = "complete"
    return wallet


@router.get("/api/daily-chores/templates")
def get_daily_chore_templates(user: DBUser = Depends(require_parent)):
    return ok(get_all_daily_chore_templates())


@router.get("/api/daily-chores")
def get_daily_chores(kidId: str = None, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    kid = _resolve_target_kid(db, user, kidId)
    ensure_daily_chores_seeded(db, kid)
    resolve_daily_chores(db, kid)
    items = db.query(DBDailyChoreItem).filter(
        DBDailyChoreItem.kid_id == kid.id,
        DBDailyChoreItem.is_active == "1",
    ).order_by(DBDailyChoreItem.order_index).all()
    return ok({
        "kidId": kid.id,
        "deductionEnabled": kid.daily_deduction_enabled != "0",
        "items": [daily_chore_dict(i) for i in items],
    })


@router.post("/api/daily-chores")
def create_daily_chore(body: DailyChoreItemCreate, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    kid = _get_family_kid(db, get_family_id(user), body.kidId)
    check_content(body.title)
    if body.points is not None and body.points < 0:
        fail("points must be a non-negative number")
    ensure_daily_chores_seeded(db, kid)
    count = db.query(DBDailyChoreItem).filter(DBDailyChoreItem.kid_id == kid.id, DBDailyChoreItem.is_active == "1").count()
    if count >= MAX_DAILY_CHORE_ITEMS:
        fail(f"You can add a maximum of {MAX_DAILY_CHORE_ITEMS} daily chores")
    max_order = db.query(DBDailyChoreItem).filter(DBDailyChoreItem.kid_id == kid.id).count()
    item = DBDailyChoreItem(
        id=str(uuid4()), kid_id=kid.id, title=body.title.strip(),
        image_emoji=body.imageEmoji or "✅", points=body.points if body.points is not None else 2,
        order_index=max_order, is_active="1", status="open", reset_date=None, created_at=now(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return ok(daily_chore_dict(item), 201)


@router.put("/api/daily-chores/settings")
def update_daily_chore_settings(body: DailyChoreSettingsUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    kid = _get_family_kid(db, get_family_id(user), body.kidId)
    kid.daily_deduction_enabled = "1" if body.deductionEnabled else "0"
    db.commit()
    return ok({"kidId": kid.id, "deductionEnabled": body.deductionEnabled})


@router.put("/api/daily-chores/{item_id}")
def update_daily_chore(item_id: str, body: DailyChoreItemUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    item = db.query(DBDailyChoreItem).filter(DBDailyChoreItem.id == item_id).first()
    if not item:
        fail("Daily chore not found", 404)
    _owning_kid_for_item(db, user, item)
    if body.title is not None:
        if not body.title.strip():
            fail("Title cannot be empty")
        check_content(body.title)
        item.title = body.title.strip()
    if body.points is not None:
        if body.points < 0:
            fail("points must be a non-negative number")
        item.points = body.points
    if body.imageEmoji is not None:
        item.image_emoji = body.imageEmoji
    db.commit()
    db.refresh(item)
    return ok(daily_chore_dict(item))


@router.delete("/api/daily-chores/{item_id}")
def delete_daily_chore(item_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    item = db.query(DBDailyChoreItem).filter(DBDailyChoreItem.id == item_id).first()
    if not item:
        fail("Daily chore not found", 404)
    _owning_kid_for_item(db, user, item)
    db.delete(item)
    db.commit()
    return ok({"deleted": True})


@router.post("/api/daily-chores/{kid_id}/regenerate")
def regenerate_daily_chores(kid_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    kid = _get_family_kid(db, get_family_id(user), kid_id)
    db.query(DBDailyChoreItem).filter(DBDailyChoreItem.kid_id == kid.id).delete(synchronize_session=False)
    db.commit()
    age = calculate_approx_age(kid.birth_month, kid.birth_year) if (kid.birth_month and kid.birth_year) else None
    bank = get_daily_chore_bank(age)
    for i, sample in enumerate(bank[:MAX_DAILY_CHORE_ITEMS]):
        db.add(DBDailyChoreItem(
            id=str(uuid4()), kid_id=kid.id, title=sample["title"],
            image_emoji=sample["imageEmoji"], points=2, order_index=i,
            is_active="1", status="open", reset_date=None, created_at=now(),
        ))
    db.commit()
    items = db.query(DBDailyChoreItem).filter(DBDailyChoreItem.kid_id == kid.id).order_by(DBDailyChoreItem.order_index).all()
    return ok([daily_chore_dict(i) for i in items])


@router.post("/api/daily-chores/{item_id}/toggle")
def toggle_daily_chore(item_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    """Kids submit/withdraw (open <-> pending), no points move yet. Parents get a
    one-click shortcut that skips the approval step entirely (their own check
    already IS the approval), and can undo it the same way regular chores work."""
    item = db.query(DBDailyChoreItem).filter(DBDailyChoreItem.id == item_id).first()
    if not item:
        fail("Daily chore not found", 404)
    kid = _owning_kid_for_item(db, user, item)
    resolve_daily_chores(db, kid)
    db.refresh(item)

    if user.role == "kid":
        if item.status == "open":
            item.status = "pending"
        elif item.status == "pending":
            item.status = "open"
        else:
            fail("This chore has already been approved.")
        db.commit()
        db.refresh(item)
        return ok({"item": daily_chore_dict(item)})

    # Parent quick toggle
    if item.status in ("open", "pending"):
        wallet = _award(db, kid, item, "Daily chore")
    else:
        wallet = db.query(DBWallet).filter(DBWallet.kid_id == kid.id).first()
        if not wallet or wallet.balance - item.points < 0:
            fail("Can't undo — these points have already been spent.")
        wallet.balance -= item.points
        db.add(DBTransaction(id=str(uuid4()), kid_id=kid.id, type="deduct",
                             amount=item.points, description=f"Unchecked: {item.title}", timestamp=now()))
        item.status = "open"
    db.commit()
    db.refresh(item)
    db.refresh(wallet)
    return ok({"item": daily_chore_dict(item), "newBalance": wallet.balance})


@router.post("/api/daily-chores/{item_id}/approve")
def approve_daily_chore(item_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    item = db.query(DBDailyChoreItem).filter(DBDailyChoreItem.id == item_id).first()
    if not item:
        fail("Daily chore not found", 404)
    kid = _owning_kid_for_item(db, user, item)
    if item.status != "pending":
        fail("Only pending daily chores can be approved")
    wallet = _award(db, kid, item, "Daily chore approved")
    db.commit()
    db.refresh(item)
    db.refresh(wallet)
    return ok({"item": daily_chore_dict(item), "newBalance": wallet.balance})


@router.post("/api/daily-chores/{item_id}/reject")
def reject_daily_chore(item_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    item = db.query(DBDailyChoreItem).filter(DBDailyChoreItem.id == item_id).first()
    if not item:
        fail("Daily chore not found", 404)
    _owning_kid_for_item(db, user, item)
    if item.status != "pending":
        fail("Only pending daily chores can be rejected")
    item.status = "open"
    db.commit()
    db.refresh(item)
    return ok({"item": daily_chore_dict(item)})
