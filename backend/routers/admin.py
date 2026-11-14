from datetime import date
from uuid import uuid4
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from config import EMAIL_RE, FRONTEND_URL, LIMIT_EXTRA_CHORES, LIMIT_EXTRA_SHOP_ITEMS
from content_filter import check_content
from database import get_db
from deps import require_full_admin
from email_utils import send_email, send_reset_email
from firebase_app import get_firebase_app
from helpers import (
    chore_dict, delete_family, delete_kid, delete_lone_user, effective_add_limit, generate_inert_credentials,
    generate_temp_pin, get_ticket_notification_email, get_ticket_replies, notify_user_via_ticket, now,
    purchase_dict, referral_payout_dict, safe_user, shop_dict, ticket_dict,
)
from models import (
    DBChore, DBLearningCompletion, DBLearningModule, DBQuestLog, DBReadingLog, DBRecurringTemplate,
    DBReferralPayout, DBShopItem, DBShopPurchase, DBSupportTicket, DBSupportTicketReply, DBTransaction, DBUser,
    DBWallet,
)
from responses import fail, ok
from schemas import (
    AddKidBody, AdminChoreUpdate, AdminContentAdminCreate, AdminContentAdminUpdate, AdminLimitsUpdate,
    AdminMessageUserBody, AdminUserUpdate, CoGuardianBody, ReferralPayoutActionBody, TicketReplyBody, WalletAdjustBody,
)
from security import check_pin_complexity

router = APIRouter()


@router.get("/api/admin/families")
def admin_list_families(db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
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

        kid_ids_for_family = [k.id for k in kids]
        learn_grow_counts = {
            "readingPendingApproval": db.query(DBReadingLog).filter(
                DBReadingLog.family_id == family_id, DBReadingLog.status == "pending_approval",
            ).count(),
            "readingApproved": db.query(DBReadingLog).filter(
                DBReadingLog.family_id == family_id, DBReadingLog.status == "approved",
            ).count(),
            "questPendingApproval": db.query(DBQuestLog).filter(
                DBQuestLog.kid_id.in_(kid_ids_for_family), DBQuestLog.status == "pending",
            ).count() if kid_ids_for_family else 0,
            "lessonsCompleted": db.query(DBLearningCompletion).filter(
                DBLearningCompletion.kid_id.in_(kid_ids_for_family),
            ).count() if kid_ids_for_family else 0,
        }

        kid_data = []
        for kid in kids:
            wallet = db.query(DBWallet).filter(DBWallet.kid_id == kid.id).first()
            kid_data.append({**safe_user(kid), "balance": wallet.balance if wallet else 0})

        # Referred-by is just an id on the row (safe_user's referredBy) --
        # resolve it to a display name here, where a DB session is already
        # in hand, rather than burdening every other safe_user() call site
        # with an extra query most of them never need.
        referred_by_name = None
        if guardian.referred_by:
            referrer = db.query(DBUser).filter(DBUser.id == guardian.referred_by).first()
            if referrer:
                referred_by_name = referrer.name

        result.append({
            "familyId": family_id,
            "guardian": {**safe_user(guardian), "referredByName": referred_by_name},
            "coGuardian": safe_user(co_guardian) if co_guardian else None,
            "kids": kid_data,
            "choreCounts": chore_counts,
            "recurringCount": recurring_count,
            "learnGrowCounts": learn_grow_counts,
            "choresAddedCount":       int(guardian.chores_added_count or 0),
            "choresLimit":            effective_add_limit(guardian, LIMIT_EXTRA_CHORES, "chores_limit_override"),
            "choresLimitOverride":    guardian.chores_limit_override,
            "shopItemsAddedCount":    int(guardian.shop_items_added_count or 0),
            "shopItemsLimit":         effective_add_limit(guardian, LIMIT_EXTRA_SHOP_ITEMS, "shop_items_limit_override"),
            "shopItemsLimitOverride": guardian.shop_items_limit_override,
        })

    return ok(result)


@router.get("/api/admin/family/{family_id}/chores")
def admin_family_chores(family_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    chores = db.query(DBChore).filter(
        DBChore.family_id == family_id,
    ).order_by(DBChore.created_at.desc()).limit(100).all()
    return ok([chore_dict(c) for c in chores])


@router.put("/api/admin/family/{family_id}/limits")
def admin_update_family_limits(family_id: str, body: AdminLimitsUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    """Raise (or clear back to the site-wide default) a family's custom
    chores/shop-items cap. Set a field to null to remove the override."""
    guardian = db.query(DBUser).filter(DBUser.id == family_id, DBUser.role == "guardian", DBUser.co_guardian_of == None).first()
    if not guardian:
        fail("Family not found", 404)
    if body.choresLimit is not None:
        if body.choresLimit < 0:
            fail("choresLimit must be a non-negative number")
        guardian.chores_limit_override = body.choresLimit
    elif "choresLimit" in body.model_fields_set:
        guardian.chores_limit_override = None
    if body.shopItemsLimit is not None:
        if body.shopItemsLimit < 0:
            fail("shopItemsLimit must be a non-negative number")
        guardian.shop_items_limit_override = body.shopItemsLimit
    elif "shopItemsLimit" in body.model_fields_set:
        guardian.shop_items_limit_override = None
    db.commit()
    db.refresh(guardian)
    return ok({
        "familyId": family_id,
        "choresLimit":            effective_add_limit(guardian, LIMIT_EXTRA_CHORES, "chores_limit_override"),
        "choresLimitOverride":    guardian.chores_limit_override,
        "shopItemsLimit":         effective_add_limit(guardian, LIMIT_EXTRA_SHOP_ITEMS, "shop_items_limit_override"),
        "shopItemsLimitOverride": guardian.shop_items_limit_override,
    })


@router.put("/api/admin/user/{user_id}")
def admin_update_user(user_id: str, body: AdminUserUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
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
    if body.avatar is not None:
        target.avatar = body.avatar
    if body.birthMonth is not None or body.birthYear is not None:
        if body.birthMonth is None or body.birthYear is None:
            fail("Birth month and year must both be provided together")
        if not (1 <= body.birthMonth <= 12):
            fail("Birth month must be between 1 and 12")
        current_year = date.today().year
        if not (current_year - 120 <= body.birthYear <= current_year):
            fail("Please enter a valid birth year")
        target.birth_month = body.birthMonth
        target.birth_year = body.birthYear
    db.commit()
    db.refresh(target)
    return ok(safe_user(target))


@router.post("/api/admin/user/{user_id}/issue-temp-pin")
def admin_issue_temp_pin(user_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    """Resets a user's PIN to a fresh random one and flags it the same way the
    one-time PIN migration does (`pin_auto_generated`), so the family sees the
    existing "here's your temporary PIN" notice on their profile picker next
    time they sign in -- same recovery path, just admin-triggered for cases
    the guardian can't do it themselves (locked out, lost access, etc.)."""
    target = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not target:
        fail("User not found", 404)
    if target.role == "admin":
        fail("Admin accounts don't use a PIN", 403)
    target.pin = generate_temp_pin()
    target.pin_auto_generated = "1"
    target.pin_attempts = 0
    target.pin_locked_until = None
    db.commit()
    db.refresh(target)
    return ok({"pin": target.pin, "user": safe_user(target)})


@router.post("/api/admin/user/{user_id}/send-password-reset")
def admin_send_password_reset(user_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    """Guardian equivalent of issue-temp-pin above, now that Firebase owns
    guardian credentials: an admin can no longer set a guardian's password
    directly (there's nothing local left to overwrite, and the admin should
    never handle a plaintext password anyway) -- instead this emails the same
    Firebase-generated reset link forgot_password sends, for cases where the
    guardian is locked out and can't request it themselves."""
    target = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not target:
        fail("User not found", 404)
    is_profile = target.role == "kid" or target.co_guardian_of
    if is_profile or target.role == "admin":
        fail("This account doesn't sign in with a password", 403)
    if not target.firebase_uid or not target.email:
        fail("This account isn't set up for password reset yet", 400)
    app = get_firebase_app()
    if not app:
        fail("Password reset is not configured on this server.", 503)
    try:
        from firebase_admin import auth as firebase_auth
        link = firebase_auth.generate_password_reset_link(
            target.email,
            action_code_settings=firebase_auth.ActionCodeSettings(url=f"{FRONTEND_URL}/reset-password", handle_code_in_app=True),
            app=app,
        )
    except Exception as e:
        print(f"[admin] WARNING: failed to generate Firebase password reset link: {e}")
        fail("Couldn't generate a reset link. Please try again shortly.", 500)
    if not send_reset_email(target, link):
        fail("Couldn't send the reset email. Please try again shortly.", 500)
    return ok({"message": f"Password reset link sent to {target.email}."})


@router.post("/api/admin/user/{user_id}/suspend")
def admin_suspend_user(user_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
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
def admin_unsuspend_user(user_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    target = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not target:
        fail("User not found", 404)
    target.is_suspended = "0"
    db.commit()
    db.refresh(target)
    return ok(safe_user(target))


@router.post("/api/admin/user/{user_id}/message")
def admin_message_user(user_id: str, body: AdminMessageUserBody, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    """Proactive admin -> user message, for anything that doesn't start from
    the user's own ticket (a referral reward, a policy heads-up, a one-off
    question) -- delivered as a new ticket so it shows in their My Tickets
    exactly like a support reply would, and works for kids too (no email)."""
    target = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not target:
        fail("User not found", 404)
    if not body.subject.strip():
        fail("Subject is required")
    if not body.message.strip():
        fail("Message is required")
    ticket = notify_user_via_ticket(db, target, body.subject.strip(), body.message.strip())
    return ok(ticket_dict(ticket, []), 201)


@router.delete("/api/admin/user/{user_id}")
def admin_delete_user(user_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
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


@router.post("/api/admin/family/{family_id}/kids")
def admin_add_kid(family_id: str, body: AddKidBody, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    """Mirrors POST /api/kids (the guardian's own "add a child" endpoint) but
    targets any family by id instead of the logged-in guardian's own."""
    guardian = db.query(DBUser).filter(DBUser.id == family_id, DBUser.role == "guardian", DBUser.co_guardian_of == None).first()
    if not guardian:
        fail("Family not found", 404)
    count = db.query(DBUser).filter(DBUser.role == "kid", DBUser.guardian_id == family_id).count()
    if count >= 10:
        fail("This family already has the maximum of 10 children")
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
    db.flush()
    db.add(DBWallet(kid_id=kid.id, balance=0))
    db.commit()
    db.refresh(kid)
    return ok(safe_user(kid), 201)


@router.post("/api/admin/family/{family_id}/co-guardian")
def admin_add_co_guardian(family_id: str, body: CoGuardianBody, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    """Mirrors POST /api/family/co-guardian but targets any family by id."""
    guardian = db.query(DBUser).filter(DBUser.id == family_id, DBUser.role == "guardian", DBUser.co_guardian_of == None).first()
    if not guardian:
        fail("Family not found", 404)
    if db.query(DBUser).filter(DBUser.co_guardian_of == family_id, DBUser.role == "guardian").first():
        fail("This family already has a co-guardian. Remove them first.")
    if len(body.name.strip()) < 2:
        fail("Name must be at least 2 characters")
    check_pin_complexity(body.pin)

    username, password = generate_inert_credentials()
    co_guardian = DBUser(
        id=str(uuid4()),
        name=body.name.strip(),
        username=username,
        password=password,
        role="guardian",
        co_guardian_of=family_id,
        avatar=body.avatar or "🧑",
        pin=body.pin,
        pin_auto_generated="0",
        created_at=now(),
    )
    db.add(co_guardian)
    db.commit()
    db.refresh(co_guardian)
    return ok(safe_user(co_guardian), 201)


@router.post("/api/admin/kid/{kid_id}/wallet/adjust")
def admin_adjust_wallet(kid_id: str, body: WalletAdjustBody, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    """Mirrors POST /api/kids/{kid_id}/wallet/adjust (the guardian's own points
    adjustment endpoint) but isn't restricted to the logged-in guardian's
    family -- an admin can target any kid directly."""
    if body.amount == 0:
        fail("Amount cannot be zero")
    if body.reason and len(body.reason.strip()) > 15:
        fail("Message must be 15 characters or fewer")
    check_content(body.reason or "")
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid").first()
    if not kid:
        fail("Child not found", 404)
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
    desc = body.reason.strip() if body.reason and body.reason.strip() else ("Bonus points (admin)" if body.amount > 0 else "Points adjusted (admin)")
    db.add(DBTransaction(id=str(uuid4()), kid_id=kid_id, type=tx_type, amount=abs(body.amount),
                         description=desc, timestamp=now()))
    db.commit()
    db.refresh(wallet)
    return ok({"kidName": kid.name, "adjustment": body.amount, "newBalance": wallet.balance})


@router.put("/api/admin/chore/{chore_id}")
def admin_update_chore(chore_id: str, body: AdminChoreUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
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
def admin_family_transactions(family_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
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


@router.get("/api/admin/family/{family_id}/shop")
def admin_family_shop(family_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    """What a family has set up in their Shop, plus every purchase request
    against it -- pending ones a guardian hasn't acted on yet included, not
    just realized spending (which already shows up generically in the
    Transactions tab once approved/instant-bought)."""
    items = db.query(DBShopItem).filter(
        DBShopItem.family_id == family_id,
    ).order_by(DBShopItem.created_at.desc()).all()

    kids = db.query(DBUser).filter(DBUser.role == "kid", DBUser.guardian_id == family_id).all()
    kid_map = {k.id: k for k in kids}
    kid_ids = list(kid_map.keys())
    purchases = db.query(DBShopPurchase).filter(
        DBShopPurchase.kid_id.in_(kid_ids),
    ).order_by(DBShopPurchase.created_at.desc()).limit(100).all() if kid_ids else []

    purchase_result = []
    for p in purchases:
        kid = kid_map.get(p.kid_id)
        purchase_result.append({
            **purchase_dict(p),
            "kidName": kid.name if kid else "Unknown",
            "kidAvatar": kid.avatar if kid else "👤",
        })
    return ok({"items": [shop_dict(i) for i in items], "purchases": purchase_result})


@router.get("/api/admin/family/{family_id}/learn-grow")
def admin_family_learn_grow(family_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    """Merged Future-Ready / Quests / Reading Log activity feed for one
    family -- the three Learn & Grow sub-features write to three unrelated
    tables (only DBReadingLog carries family_id directly; the other two are
    per-kid and need the kid_id -> guardian_id hop, same join style as
    admin_family_transactions above), so this stitches them into one
    chronological list for the admin detail panel."""
    kids = db.query(DBUser).filter(DBUser.role == "kid", DBUser.guardian_id == family_id).all()
    kid_map = {k.id: k for k in kids}
    kid_ids = list(kid_map.keys())

    reading_logs = db.query(DBReadingLog).filter(
        DBReadingLog.family_id == family_id,
    ).order_by(DBReadingLog.created_at.desc()).limit(100).all()

    quest_logs = db.query(DBQuestLog).filter(
        DBQuestLog.kid_id.in_(kid_ids),
    ).order_by(DBQuestLog.submitted_at.desc()).limit(100).all() if kid_ids else []

    # Approving a quest log also writes a DBLearningCompletion row (see
    # quest_logs.py) -- only surface Future-Ready's own completions here so a
    # finished quest doesn't show up twice.
    completions = db.query(DBLearningCompletion).filter(
        DBLearningCompletion.kid_id.in_(kid_ids),
    ).order_by(DBLearningCompletion.completed_at.desc()).limit(100).all() if kid_ids else []

    module_ids = {q.module_id for q in quest_logs} | {c.module_id for c in completions}
    modules = db.query(DBLearningModule).filter(DBLearningModule.id.in_(module_ids)).all() if module_ids else []
    module_map = {m.id: m for m in modules}

    activity = []
    for log in reading_logs:
        kid = kid_map.get(log.kid_id)
        activity.append({
            "type": "reading",
            "kidId": log.kid_id,
            "kidName": kid.name if kid else "Unknown",
            "title": log.title,
            "status": log.status,
            "points": log.points,
            "at": log.resolved_at or log.submitted_at or log.created_at,
        })
    for q in quest_logs:
        kid = kid_map.get(q.kid_id)
        mod = module_map.get(q.module_id)
        activities = (mod.content or {}).get("activities", []) if mod and mod.content else []
        activity_title = (
            activities[q.activity_index].get("title")
            if q.activity_index is not None and q.activity_index < len(activities)
            else None
        )
        activity.append({
            "type": "quest",
            "kidId": q.kid_id,
            "kidName": kid.name if kid else "Unknown",
            "title": f"{activity_title} ({mod.topic_title})" if activity_title and mod else (mod.topic_title if mod else q.module_id),
            "status": q.status,
            "points": mod.points if mod else None,
            "at": q.reviewed_at or q.submitted_at,
        })
    for c in completions:
        mod = module_map.get(c.module_id)
        if mod and mod.section != "future-ready":
            continue
        kid = kid_map.get(c.kid_id)
        activity.append({
            "type": "lesson",
            "kidId": c.kid_id,
            "kidName": kid.name if kid else "Unknown",
            "title": mod.topic_title if mod else c.module_id,
            "status": "completed",
            "scoreLabel": f"{c.score}/{c.total}",
            "points": c.points_awarded,
            "at": c.completed_at,
        })

    activity.sort(key=lambda a: a["at"] or "", reverse=True)
    return ok(activity[:150])


@router.get("/api/admin/tickets")
def admin_list_tickets(status: Optional[str] = None, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    q = db.query(DBSupportTicket)
    if status:
        if status not in ("open", "resolved"):
            fail("status must be 'open' or 'resolved'")
        q = q.filter(DBSupportTicket.status == status)
    tickets = q.order_by(DBSupportTicket.created_at.desc()).limit(200).all()
    return ok([ticket_dict(t, get_ticket_replies(db, t.id)) for t in tickets])


@router.post("/api/admin/tickets/{ticket_id}/resolve")
def admin_resolve_ticket(ticket_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    ticket = db.query(DBSupportTicket).filter(DBSupportTicket.id == ticket_id).first()
    if not ticket:
        fail("Ticket not found", 404)
    ticket.status = "resolved"
    ticket.resolved_at = now()
    db.commit()
    db.refresh(ticket)
    return ok(ticket_dict(ticket, get_ticket_replies(db, ticket.id)))


@router.post("/api/admin/tickets/{ticket_id}/reopen")
def admin_reopen_ticket(ticket_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    ticket = db.query(DBSupportTicket).filter(DBSupportTicket.id == ticket_id).first()
    if not ticket:
        fail("Ticket not found", 404)
    ticket.status = "open"
    ticket.resolved_at = None
    db.commit()
    db.refresh(ticket)
    return ok(ticket_dict(ticket, get_ticket_replies(db, ticket.id)))


@router.post("/api/admin/tickets/{ticket_id}/reply")
def admin_reply_ticket(ticket_id: str, body: TicketReplyBody, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
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


@router.get("/api/admin/referral-payouts")
def admin_list_referral_payouts(status: Optional[str] = None, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    q = db.query(DBReferralPayout)
    if status:
        if status not in ("pending", "fulfilled", "rejected"):
            fail("status must be 'pending', 'fulfilled', or 'rejected'")
        q = q.filter(DBReferralPayout.status == status)
    payouts = q.order_by(DBReferralPayout.created_at.desc()).limit(200).all()
    return ok([referral_payout_dict(p) for p in payouts])


@router.post("/api/admin/referral-payouts/{payout_id}/fulfill")
def admin_fulfill_referral_payout(payout_id: str, body: ReferralPayoutActionBody, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    payout = db.query(DBReferralPayout).filter(DBReferralPayout.id == payout_id).first()
    if not payout:
        fail("Payout request not found", 404)
    if payout.status != "pending":
        fail(f"This request is already {payout.status}.")
    payout.status = "fulfilled"
    payout.admin_note = (body.note or "").strip() or None
    payout.resolved_at = now()
    db.commit()
    db.refresh(payout)

    # Delivered as a My Tickets message, not a bare email -- it's the one place
    # every role can actually read, and matches what cash_out_referrals already
    # told the guardian to expect (see routers/referrals.py).
    guardian = db.query(DBUser).filter(DBUser.id == payout.guardian_id).first()
    if guardian:
        notify_user_via_ticket(
            db, guardian,
            subject=f"Your ${payout.amount} referral reward is here! 🎉",
            message=(
                f"Thanks for spreading the word about Reward Ur Kids! Your ${payout.amount} "
                f"Amazon gift card is ready:\n\n"
                + (payout.admin_note or "Contact support if you don't see a code below.") + "\n"
            ),
        )

    return ok(referral_payout_dict(payout))


@router.post("/api/admin/referral-payouts/{payout_id}/reject")
def admin_reject_referral_payout(payout_id: str, body: ReferralPayoutActionBody, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    payout = db.query(DBReferralPayout).filter(DBReferralPayout.id == payout_id).first()
    if not payout:
        fail("Payout request not found", 404)
    if payout.status != "pending":
        fail(f"This request is already {payout.status}.")
    # Rejecting (e.g. fraud, duplicate accounts) gives the credits back rather
    # than just discarding them -- the guardian can still request a legitimate
    # cash-out later once the dispute is sorted out.
    guardian = db.query(DBUser).filter(DBUser.id == payout.guardian_id).first()
    if guardian:
        guardian.referral_credits_redeemed = max(0, (guardian.referral_credits_redeemed or 0) - payout.amount)
    payout.status = "rejected"
    payout.admin_note = (body.note or "").strip() or None
    payout.resolved_at = now()
    db.commit()
    db.refresh(payout)
    return ok(referral_payout_dict(payout))


# ── Content-admin accounts (restricted to Future-Ready/Quests only) ────────────
# A content-admin is a DBUser with role="admin", admin_scope="content" (see
# deps.require_full_admin) -- it signs in exactly like a guardian/full admin,
# through Firebase, but every endpoint here is scoped so it can never touch
# a full admin's row. All of these sit behind require_full_admin already
# (this whole router is), so only a full admin can reach any of them.

def _content_admin_dict(u: DBUser) -> dict:
    return {
        "id": u.id, "name": u.name, "username": u.username, "email": u.email,
        "isSuspended": u.is_suspended == "1", "createdAt": u.created_at,
    }


@router.get("/api/admin/content-admins")
def admin_list_content_admins(db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    admins = db.query(DBUser).filter(DBUser.role == "admin", DBUser.admin_scope == "content").all()
    return ok([_content_admin_dict(a) for a in admins])


@router.post("/api/admin/content-admins")
def admin_create_content_admin(body: AdminContentAdminCreate, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    if len(body.name.strip()) < 2:
        fail("Name must be at least 2 characters")
    username = body.username.strip().lower()
    if not username:
        fail("Username is required")
    email = body.email.strip().lower()
    if not EMAIL_RE.match(email):
        fail("Please enter a valid email address")
    if db.query(DBUser).filter(func.lower(DBUser.username) == username).first():
        fail("Username already taken")
    if db.query(DBUser).filter(DBUser.email == email).first():
        fail("Email address already registered")

    app = get_firebase_app()
    if not app:
        fail("This isn't configured on this server.", 503)
    from firebase_admin import auth as firebase_auth
    try:
        # Firebase requires some password at creation time even though this
        # account will only ever sign in via the reset link emailed below --
        # same "inert, never actually used" convention as a Google-only
        # guardian's local password column (see auth.py's google_complete).
        fb_user = firebase_auth.create_user(email=email, password=str(uuid4()), email_verified=True, app=app)
    except firebase_auth.EmailAlreadyExistsError:
        fail("That email is already in use by another account.", 409)
    except Exception as e:
        print(f"[admin] WARNING: failed to create Firebase user for content-admin: {e}")
        fail("Couldn't create the account. Please try again shortly.", 500)

    try:
        admin_user = DBUser(
            id=str(uuid4()), name=body.name.strip(), username=username, password=str(uuid4()),
            role="admin", admin_scope="content", email=email, firebase_uid=fb_user.uid,
            is_active="1", is_suspended="0", created_at=now(),
        )
        db.add(admin_user)
        db.commit()
    except Exception as e:
        db.rollback()
        # Never leave a Firebase credential behind with no matching app
        # account -- same orphan-prevention pattern as auth.py's
        # _firebase_delete_orphan, inlined here since it's the only caller.
        try:
            firebase_auth.delete_user(fb_user.uid, app=app)
        except Exception as cleanup_err:
            print(f"[admin] WARNING: failed to delete orphaned Firebase user {fb_user.uid}: {cleanup_err}")
        print(f"[admin] WARNING: failed to create content-admin DBUser row: {e}")
        fail("Couldn't create the account. Please try again shortly.", 500)

    _send_content_admin_reset_email(admin_user, app)
    return ok(_content_admin_dict(admin_user), 201)


def _send_content_admin_reset_email(target: DBUser, app) -> None:
    """Shared by create and the resend endpoint below -- same link-generation
    pattern as admin_send_password_reset above, just not refusing admin
    targets (that refusal exists for the generic endpoint, not this one)."""
    from firebase_admin import auth as firebase_auth
    try:
        link = firebase_auth.generate_password_reset_link(
            target.email,
            action_code_settings=firebase_auth.ActionCodeSettings(url=f"{FRONTEND_URL}/reset-password", handle_code_in_app=True),
            app=app,
        )
    except Exception as e:
        print(f"[admin] WARNING: failed to generate Firebase password reset link: {e}")
        fail("Account created, but couldn't generate a reset link. Use \"Resend setup email\" to try again.", 500)
    if not send_reset_email(target, link):
        fail("Account created, but couldn't send the setup email. Use \"Resend setup email\" to try again.", 500)


@router.post("/api/admin/content-admins/{user_id}/send-password-reset")
def admin_resend_content_admin_reset(user_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    target = db.query(DBUser).filter(DBUser.id == user_id, DBUser.role == "admin", DBUser.admin_scope == "content").first()
    if not target:
        fail("Content admin not found", 404)
    app = get_firebase_app()
    if not app:
        fail("This isn't configured on this server.", 503)
    _send_content_admin_reset_email(target, app)
    return ok({"message": f"Setup email sent to {target.email}."})


@router.put("/api/admin/content-admins/{user_id}")
def admin_update_content_admin(user_id: str, body: AdminContentAdminUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    target = db.query(DBUser).filter(DBUser.id == user_id, DBUser.role == "admin", DBUser.admin_scope == "content").first()
    if not target:
        fail("Content admin not found", 404)
    if body.name is not None:
        if len(body.name.strip()) < 2:
            fail("Name must be at least 2 characters")
        target.name = body.name.strip()
    if body.username is not None:
        username = body.username.strip().lower()
        if not username:
            fail("Username is required")
        existing = db.query(DBUser).filter(func.lower(DBUser.username) == username, DBUser.id != user_id).first()
        if existing:
            fail("Username already taken")
        target.username = username
    db.commit()
    return ok(_content_admin_dict(target))


@router.post("/api/admin/content-admins/{user_id}/suspend")
def admin_suspend_content_admin(user_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    target = db.query(DBUser).filter(DBUser.id == user_id, DBUser.role == "admin", DBUser.admin_scope == "content").first()
    if not target:
        fail("Content admin not found", 404)
    target.is_suspended = "1"
    db.commit()
    return ok(_content_admin_dict(target))


@router.post("/api/admin/content-admins/{user_id}/unsuspend")
def admin_unsuspend_content_admin(user_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    target = db.query(DBUser).filter(DBUser.id == user_id, DBUser.role == "admin", DBUser.admin_scope == "content").first()
    if not target:
        fail("Content admin not found", 404)
    target.is_suspended = "0"
    db.commit()
    return ok(_content_admin_dict(target))


@router.delete("/api/admin/content-admins/{user_id}")
def admin_delete_content_admin(user_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_full_admin)):
    target = db.query(DBUser).filter(DBUser.id == user_id, DBUser.role == "admin", DBUser.admin_scope == "content").first()
    if not target:
        fail("Content admin not found", 404)
    if target.firebase_uid:
        app = get_firebase_app()
        if app:
            from firebase_admin import auth as firebase_auth
            try:
                firebase_auth.delete_user(target.firebase_uid, app=app)
            except Exception as e:
                print(f"[admin] WARNING: failed to delete Firebase user {target.firebase_uid}: {e}")
    db.delete(target)
    db.commit()
    return ok({"deleted": True})
