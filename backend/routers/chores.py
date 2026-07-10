from datetime import date
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from chore_logic import check_and_expire_chores, generate_instances, get_visible_chores
from config import CONTACT_EMAIL, LIMIT_EXTRA_CHORES, LIMIT_EXTRA_SHOP_ITEMS
from content_filter import check_content
from database import get_db
from deps import require_auth, require_kid, require_parent
from helpers import chore_dict, check_add_limit, get_family_id, get_family_owner, now, recurring_dict
from models import DBChore, DBRecurringTemplate, DBTransaction, DBUser, DBWallet
from responses import fail, ok
from sample_items import is_sample_chore
from schemas import ChoreCreate, ChoreUpdate, RecurringCreate

router = APIRouter()


@router.get("/api/limits")
def get_add_limits(db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    owner = get_family_owner(db, user)
    return ok({
        "choresUsed":       int(owner.chores_added_count or 0),
        "choresLimit":      LIMIT_EXTRA_CHORES,
        "shopItemsUsed":    int(owner.shop_items_added_count or 0),
        "shopItemsLimit":   LIMIT_EXTRA_SHOP_ITEMS,
        "supportEmail":     CONTACT_EMAIL,
    })


@router.get("/api/chores")
def get_chores(status: Optional[str] = None, kidId: Optional[str] = None,
               db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    check_and_expire_chores(db)
    # parents see their own family's chores; kids see chores from their parent's family
    fid = get_family_id(user) if user.role == "parent" else user.parent_id
    # Generate any missing instances for active recurring templates in this family
    for t in db.query(DBRecurringTemplate).filter(
        DBRecurringTemplate.family_id == fid,
        DBRecurringTemplate.is_active == "1",
    ).all():
        generate_instances(db, t)
    cutoff = 72 if user.role == "parent" else 48   # 3 days for parents, 2 days for kids
    chores = get_visible_chores(db, family_id=fid, cutoff_hours=cutoff)
    if status:
        chores = [c for c in chores if c.status == status]
    if kidId:
        chores = [c for c in chores if c.assigned_kid_id == kidId or c.completed_by_kid_id == kidId]
    return ok([chore_dict(c) for c in chores])


@router.post("/api/chores")
def create_chore(body: ChoreCreate, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    check_content(body.title, body.description or "")
    if body.points < 0:
        fail("points must be a non-negative number")
    family_id = get_family_id(user)
    if db.query(DBUser).filter(DBUser.role == "kid", DBUser.parent_id == family_id).count() == 0:
        fail("Please add a child first before creating chores.")
    # Resolve which kid IDs to assign — multi takes priority over single
    kid_ids: List[Optional[str]] = body.assignedKidIds if body.assignedKidIds else (
        [body.assignedKidId] if body.assignedKidId else [None]
    )
    # Validate every supplied kid ID
    for kid_id in kid_ids:
        if kid_id and not db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid").first():
            fail(f"Kid not found: {kid_id}", 404)
    from_sample = is_sample_chore(body.title)
    owner = get_family_owner(db, user)
    if not from_sample:
        owner = check_add_limit(db, user, "chores_added_count", len(kid_ids), LIMIT_EXTRA_CHORES, "chores")
    created = []
    for kid_id in kid_ids:
        chore = DBChore(
            id=str(uuid4()),
            title=body.title,
            description=body.description or "",
            points=body.points,
            image_emoji=body.imageEmoji or "📋",
            assigned_kid_id=kid_id,
            due_date=body.dueDate or None,
            created_at=now(),
            family_id=family_id,
        )
        db.add(chore)
        created.append(chore)
    if not from_sample:
        owner.chores_added_count = (owner.chores_added_count or 0) + len(kid_ids)
    db.commit()
    for c in created:
        db.refresh(c)
    return ok([chore_dict(c) for c in created], 201)


@router.put("/api/chores/{chore_id}")
def update_chore(chore_id: str, body: ChoreUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    chore = db.query(DBChore).filter(DBChore.id == chore_id).first()
    if not chore:
        fail("Chore not found", 404)
    if body.title       is not None: chore.title       = body.title
    if body.description is not None: chore.description = body.description
    if body.points is not None:
        if body.points < 0: fail("points must be a non-negative number")
        chore.points = body.points
    if body.assignedKidId is not None:
        if body.assignedKidId and not db.query(DBUser).filter(DBUser.id == body.assignedKidId, DBUser.role == "kid").first():
            fail("assignedKidId does not match any kid", 404)
        chore.assigned_kid_id = body.assignedKidId or None
    if body.status is not None:
        if body.status not in ("open", "pending", "complete", "expired"):
            fail("Invalid status")
        chore.status = body.status
    if body.dueDate is not None:
        chore.due_date = body.dueDate or None
        if chore.due_date: chore.expired_at = None
    if body.imageEmoji is not None: chore.image_emoji = body.imageEmoji
    db.commit()
    db.refresh(chore)
    return ok(chore_dict(chore))


@router.delete("/api/chores/{chore_id}")
def delete_chore(chore_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    chore = db.query(DBChore).filter(DBChore.id == chore_id).first()
    if not chore: fail("Chore not found", 404)
    if chore.status not in ("open", "expired"): fail("Only open or expired chores can be deleted")
    db.delete(chore)
    db.commit()
    return ok(chore_dict(chore))


@router.post("/api/chores/{chore_id}/complete")
def complete_chore(chore_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_kid)):
    chore = db.query(DBChore).filter(DBChore.id == chore_id).first()
    if not chore: fail("Chore not found", 404)
    if chore.status != "open": fail("Only open chores can be marked complete")
    if chore.assigned_kid_id and chore.assigned_kid_id != user.id:
        fail("This chore is assigned to a different kid", 403)
    chore.status = "pending"
    chore.completed_by_kid_id = user.id
    db.commit()
    db.refresh(chore)
    return ok(chore_dict(chore))


@router.post("/api/chores/{chore_id}/approve")
def approve_chore(chore_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    chore = db.query(DBChore).filter(DBChore.id == chore_id).first()
    if not chore: fail("Chore not found", 404)
    if chore.status != "pending": fail("Only pending chores can be approved")
    kid_id = chore.completed_by_kid_id
    if not kid_id: fail("No kid associated with this chore")

    wallet = db.query(DBWallet).filter(DBWallet.kid_id == kid_id).first()
    if not wallet:
        wallet = DBWallet(kid_id=kid_id, balance=0)
        db.add(wallet)
        db.flush()

    wallet.balance += chore.points
    db.add(DBTransaction(id=str(uuid4()), kid_id=kid_id, type="earned",
                         amount=chore.points, description=f"Earned: {chore.title}", timestamp=now()))
    chore.status = "complete"
    chore.completed_at = now()
    db.commit()
    db.refresh(chore)
    db.refresh(wallet)
    return ok({"chore": chore_dict(chore), "newBalance": wallet.balance})


@router.post("/api/chores/{chore_id}/reject")
def reject_chore(chore_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    chore = db.query(DBChore).filter(DBChore.id == chore_id).first()
    if not chore: fail("Chore not found", 404)
    if chore.status != "pending": fail("Only pending chores can be rejected")
    chore.status = "open"
    chore.completed_by_kid_id = None
    db.commit()
    db.refresh(chore)
    return ok(chore_dict(chore))


@router.post("/api/recurring")
def create_recurring(body: RecurringCreate, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    check_content(body.title, body.description or "")
    if body.points < 0:
        fail("points must be a non-negative number")
    if body.recurrenceType not in ('daily', 'weekly', 'monthly'):
        fail("recurrenceType must be daily, weekly, or monthly")
    if body.recurrenceType == 'weekly' and not body.recurrenceDays:
        fail("Select at least one day for weekly recurrence")
    if body.recurrenceType == 'monthly' and not body.recurrenceDom:
        fail("Specify a day of month for monthly recurrence")

    family_id = get_family_id(user)
    if db.query(DBUser).filter(DBUser.role == "kid", DBUser.parent_id == family_id).count() == 0:
        fail("Please add a child first before creating chores.")

    from_sample = is_sample_chore(body.title)
    owner = get_family_owner(db, user)
    if not from_sample:
        owner = check_add_limit(db, user, "chores_added_count", 1, LIMIT_EXTRA_CHORES, "chores")
    rec_days = ','.join(str(d) for d in body.recurrenceDays) if body.recurrenceDays else None
    rec_dom = str(body.recurrenceDom) if body.recurrenceDom else None

    template = DBRecurringTemplate(
        id=str(uuid4()),
        title=body.title,
        description=body.description or "",
        points=body.points,
        image_emoji=body.imageEmoji or "📋",
        assigned_kid_id=body.assignedKidId or None,
        recurrence_type=body.recurrenceType,
        recurrence_days=rec_days,
        recurrence_dom=rec_dom,
        family_id=family_id,
        is_active="1",
        created_at=now(),
    )
    db.add(template)
    if not from_sample:
        owner.chores_added_count = (owner.chores_added_count or 0) + 1
    db.commit()
    db.refresh(template)
    generate_instances(db, template)
    return ok(recurring_dict(template), 201)


@router.get("/api/recurring")
def list_recurring(db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    family_id = get_family_id(user)
    templates = db.query(DBRecurringTemplate).filter(
        DBRecurringTemplate.family_id == family_id,
        DBRecurringTemplate.is_active == "1",
    ).all()
    return ok([recurring_dict(t) for t in templates])


@router.delete("/api/recurring/{template_id}")
def delete_recurring(template_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    family_id = get_family_id(user)
    template = db.query(DBRecurringTemplate).filter(
        DBRecurringTemplate.id == template_id,
        DBRecurringTemplate.family_id == family_id,
    ).first()
    if not template:
        fail("Template not found", 404)
    today_str = date.today().isoformat()
    db.query(DBChore).filter(
        DBChore.template_id == template_id,
        DBChore.status == "open",
        DBChore.scheduled_date >= today_str,
    ).delete(synchronize_session=False)
    db.commit()
    template.is_active = "0"
    db.commit()
    return ok(recurring_dict(template))
