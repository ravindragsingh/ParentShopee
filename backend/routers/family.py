from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from config import SESSIONS
from database import get_db
from deps import require_parent
from helpers import generate_inert_credentials, get_family_id, now, safe_user
from models import DBUser
from responses import fail, ok
from schemas import CoParentBody, ProfileEnterBody, UpdatePinBody
from security import check_pin_complexity

router = APIRouter()

PIN_MAX_ATTEMPTS = 5
PIN_LOCKOUT_MINUTES = 15


@router.get("/api/family/co-parent")
def get_co_parent(db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    if user.co_parent_of:
        primary = db.query(DBUser).filter(DBUser.id == user.co_parent_of).first()
        return ok({"isCoParent": True, "coParent": None, "primaryParent": safe_user(primary) if primary else None})
    co_parent = db.query(DBUser).filter(DBUser.co_parent_of == user.id, DBUser.role == "parent").first()
    return ok({"isCoParent": False, "coParent": safe_user(co_parent) if co_parent else None, "primaryParent": None})


@router.post("/api/family/co-parent")
def add_co_parent(body: CoParentBody, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    if user.co_parent_of:
        fail("Co-parents cannot create other co-parents")
    if db.query(DBUser).filter(DBUser.co_parent_of == user.id, DBUser.role == "parent").first():
        fail("You already have a co-parent. Remove them first.")
    if len(body.name.strip()) < 2:
        fail("Name must be at least 2 characters")
    check_pin_complexity(body.pin)

    username, password = generate_inert_credentials()
    co_parent = DBUser(
        id=str(uuid4()),
        name=body.name.strip(),
        username=username,
        password=password,
        role="parent",
        co_parent_of=user.id,
        avatar=body.avatar or "🧑",
        pin=body.pin,
        pin_auto_generated="0",
        created_at=now(),
    )
    db.add(co_parent)
    db.commit()
    db.refresh(co_parent)
    return ok(safe_user(co_parent), 201)


@router.put("/api/family/co-parent/pin")
def update_co_parent_pin(body: UpdatePinBody, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    if user.co_parent_of:
        fail("Co-parents cannot change their own PIN via this endpoint")
    co_parent = db.query(DBUser).filter(DBUser.co_parent_of == user.id, DBUser.role == "parent").first()
    if not co_parent:
        fail("No co-parent found")
    check_pin_complexity(body.pin)
    co_parent.pin = body.pin
    co_parent.pin_auto_generated = "0"
    co_parent.pin_attempts = 0
    co_parent.pin_locked_until = None
    db.commit()
    return ok({"message": f"PIN updated for {co_parent.name}"})


@router.delete("/api/family/co-parent")
def remove_co_parent(db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    if user.co_parent_of:
        fail("Co-parents cannot revoke access themselves")
    co_parent = db.query(DBUser).filter(DBUser.co_parent_of == user.id, DBUser.role == "parent").first()
    if not co_parent:
        fail("No co-parent found")
    db.delete(co_parent)
    db.commit()
    return ok({"message": "Co-parent account removed"})


# ── Netflix-style profile picker ────────────────────────────────────────────────
# `user` on both endpoints below is always the primary parent's own "device"
# session — the one established by the real username+password login. Kids and
# co-parents no longer get an independent login token from /api/auth/login, so
# there's no ambiguity about whose family this is.

@router.get("/api/family/profiles")
def list_family_profiles(db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    family_id = get_family_id(user)
    parent = db.query(DBUser).filter(DBUser.id == family_id).first()
    co_parent = db.query(DBUser).filter(DBUser.co_parent_of == family_id, DBUser.role == "parent").first()
    kids = db.query(DBUser).filter(DBUser.role == "kid", DBUser.parent_id == family_id).order_by(DBUser.created_at).all()

    def profile_dict(u: DBUser, requires_pin: bool) -> dict:
        needs_setup = u.pin_auto_generated == "1"
        return {
            "id": u.id, "name": u.name, "avatar": u.avatar, "role": u.role,
            "requiresPin": requires_pin,
            "needsPinSetup": needs_setup,
            # PINs are otherwise write-only, but a still-auto-generated one is
            # surfaced here so the parent — the only person who can ever see
            # this endpoint for their own family — can actually learn and
            # share it. Never included once the parent has set their own.
            "tempPin": u.pin if needs_setup else None,
        }

    profiles = [profile_dict(parent, False)]
    if co_parent:
        profiles.append(profile_dict(co_parent, True))
    for kid in kids:
        profiles.append(profile_dict(kid, True))

    return ok({"profiles": profiles, "kidsCount": len(kids), "hasCoParent": co_parent is not None})


@router.post("/api/family/profiles/{profile_id}/enter")
def enter_profile(profile_id: str, body: ProfileEnterBody, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    family_id = get_family_id(user)

    if profile_id == family_id:
        # Continuing as the primary parent themselves — they already proved who
        # they are with their real password, no PIN needed.
        token = str(uuid4())
        SESSIONS[token] = user.id
        return ok({"token": token, "user": safe_user(user)})

    profile = db.query(DBUser).filter(
        DBUser.id == profile_id,
        or_(
            and_(DBUser.role == "kid", DBUser.parent_id == family_id),
            DBUser.co_parent_of == family_id,
        ),
    ).first()
    if not profile:
        fail("Profile not found", 404)

    if profile.pin_locked_until:
        try:
            if datetime.fromisoformat(profile.pin_locked_until) > datetime.now(timezone.utc):
                fail(f"Too many incorrect attempts. Try again in a few minutes.", 429, code="pin_locked")
        except ValueError:
            pass

    if not body.pin or body.pin != profile.pin:
        profile.pin_attempts = (profile.pin_attempts or 0) + 1
        if profile.pin_attempts >= PIN_MAX_ATTEMPTS:
            profile.pin_locked_until = (datetime.now(timezone.utc) + timedelta(minutes=PIN_LOCKOUT_MINUTES)).isoformat()
            db.commit()
            fail(f"Too many incorrect attempts. Try again in {PIN_LOCKOUT_MINUTES} minutes.", 429, code="pin_locked")
        db.commit()
        fail("Incorrect PIN", 401)

    profile.pin_attempts = 0
    profile.pin_locked_until = None
    db.commit()
    db.refresh(profile)

    token = str(uuid4())
    SESSIONS[token] = profile.id
    return ok({"token": token, "user": safe_user(profile)})
