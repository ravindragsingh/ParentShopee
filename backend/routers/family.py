from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from config import SESSIONS
from database import get_db
from deps import require_guardian
from helpers import generate_inert_credentials, get_family_id, now, safe_user
from models import DBUser
from responses import fail, ok
from schemas import CoGuardianBody, ProfileEnterBody, RecoverPinBody, UpdatePinBody
from security import check_pin_complexity

router = APIRouter()

PIN_MAX_ATTEMPTS = 5
PIN_LOCKOUT_MINUTES = 15


@router.get("/api/family/co-guardian")
def get_co_guardian(db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    if user.co_guardian_of:
        primary = db.query(DBUser).filter(DBUser.id == user.co_guardian_of).first()
        return ok({"isCoGuardian": True, "coGuardian": None, "primaryGuardian": safe_user(primary) if primary else None})
    co_guardian = db.query(DBUser).filter(DBUser.co_guardian_of == user.id, DBUser.role == "guardian").first()
    return ok({"isCoGuardian": False, "coGuardian": safe_user(co_guardian) if co_guardian else None, "primaryGuardian": None})


@router.post("/api/family/co-guardian")
def add_co_guardian(body: CoGuardianBody, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    if user.co_guardian_of:
        fail("Co-guardians cannot create other co-guardians")
    if db.query(DBUser).filter(DBUser.co_guardian_of == user.id, DBUser.role == "guardian").first():
        fail("You already have a co-guardian. Remove them first.")
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
        co_guardian_of=user.id,
        avatar=body.avatar or "🧑",
        pin=body.pin,
        pin_auto_generated="0",
        created_at=now(),
    )
    db.add(co_guardian)
    db.commit()
    db.refresh(co_guardian)
    return ok(safe_user(co_guardian), 201)


@router.put("/api/family/co-guardian/pin")
def update_co_guardian_pin(body: UpdatePinBody, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    if user.co_guardian_of:
        fail("Co-guardians cannot change their own PIN via this endpoint")
    co_guardian = db.query(DBUser).filter(DBUser.co_guardian_of == user.id, DBUser.role == "guardian").first()
    if not co_guardian:
        fail("No co-guardian found")
    check_pin_complexity(body.pin)
    co_guardian.pin = body.pin
    co_guardian.pin_auto_generated = "0"
    co_guardian.pin_attempts = 0
    co_guardian.pin_locked_until = None
    db.commit()
    return ok({"message": f"PIN updated for {co_guardian.name}"})


@router.delete("/api/family/co-guardian")
def remove_co_guardian(db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    if user.co_guardian_of:
        fail("Co-guardians cannot revoke access themselves")
    co_guardian = db.query(DBUser).filter(DBUser.co_guardian_of == user.id, DBUser.role == "guardian").first()
    if not co_guardian:
        fail("No co-guardian found")
    db.delete(co_guardian)
    db.commit()
    return ok({"message": "Co-guardian account removed"})


# ── Netflix-style profile picker ────────────────────────────────────────────────
# `user` on both endpoints below is always the primary guardian's own "device"
# session — the one established by the real username+password login. Kids and
# co-guardians no longer get an independent login token from /api/auth/login, so
# there's no ambiguity about whose family this is. Every profile — including the
# primary guardian's own — is PIN-gated, so picking any tile always asks for a PIN.

@router.get("/api/family/profiles")
def list_family_profiles(db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    family_id = get_family_id(user)
    guardian = db.query(DBUser).filter(DBUser.id == family_id).first()
    co_guardian = db.query(DBUser).filter(DBUser.co_guardian_of == family_id, DBUser.role == "guardian").first()
    kids = db.query(DBUser).filter(DBUser.role == "kid", DBUser.guardian_id == family_id).order_by(DBUser.created_at).all()

    def profile_dict(u: DBUser, requires_pin: bool) -> dict:
        needs_setup = u.pin_auto_generated == "1"
        return {
            "id": u.id, "name": u.name, "avatar": u.avatar, "role": u.role,
            "requiresPin": requires_pin,
            "needsPinSetup": needs_setup,
            # PINs are otherwise write-only, but a still-auto-generated one is
            # surfaced here so the guardian — the only person who can ever see
            # this endpoint for their own family — can actually learn and
            # share it. Never included once the guardian has set their own.
            "tempPin": u.pin if needs_setup else None,
        }

    profiles = [profile_dict(guardian, guardian.pin is not None)]
    if co_guardian:
        profiles.append(profile_dict(co_guardian, True))
    for kid in kids:
        profiles.append(profile_dict(kid, True))

    return ok({"profiles": profiles, "kidsCount": len(kids), "hasCoGuardian": co_guardian is not None})


@router.post("/api/family/profiles/{profile_id}/enter")
def enter_profile(profile_id: str, body: ProfileEnterBody, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    family_id = get_family_id(user)

    if profile_id == family_id:
        profile = db.query(DBUser).filter(DBUser.id == family_id).first()
    else:
        profile = db.query(DBUser).filter(
            DBUser.id == profile_id,
            or_(
                and_(DBUser.role == "kid", DBUser.guardian_id == family_id),
                DBUser.co_guardian_of == family_id,
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

    if not profile.pin or not body.pin or body.pin != profile.pin:
        profile.pin_attempts = (profile.pin_attempts or 0) + 1
        if profile.pin_attempts >= PIN_MAX_ATTEMPTS:
            profile.pin_locked_until = (datetime.now(timezone.utc) + timedelta(minutes=PIN_LOCKOUT_MINUTES)).isoformat()
            db.commit()
            fail(f"Too many incorrect attempts. Try again in {PIN_LOCKOUT_MINUTES} minutes.", 429, code="pin_locked")
        db.commit()
        # 400, not 401 -- the caller's own device token is perfectly valid here,
        # only the PIN they typed for this profile was wrong. The frontend treats
        # any 401 as "your session expired" and force-logs-out the whole device,
        # which would be wrong for a simple mistyped PIN.
        fail("Incorrect PIN", 400)

    profile.pin_attempts = 0
    profile.pin_locked_until = None
    db.commit()
    db.refresh(profile)

    token = str(uuid4())
    SESSIONS[token] = profile.id
    return ok({"token": token, "user": safe_user(profile)})


@router.post("/api/family/profiles/recover-pin")
def recover_own_pin(body: RecoverPinBody, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    # Recovery for a forgotten PIN, primary guardian only — kids and the co-guardian
    # get their PIN reset by the primary guardian instead (Kids tab / Admin Panel),
    # same as before. Re-proving the real account password is what makes this
    # safe to skip the PIN for: it's the one secret only the primary guardian
    # knows, so it can't be used to bypass another profile's PIN on a shared
    # device the way just clicking "forgot PIN" without a check could.
    if user.co_guardian_of:
        fail("Only the primary guardian can recover their PIN this way", 403)
    if body.password != user.password:
        # 400, not 401 -- same reasoning as the wrong-PIN case in enter_profile:
        # this is a mistyped secret, not an invalid/expired device session.
        fail("Incorrect password", 400)
    check_pin_complexity(body.newPin)

    user.pin = body.newPin
    user.pin_auto_generated = "0"
    user.pin_attempts = 0
    user.pin_locked_until = None
    db.commit()
    db.refresh(user)

    token = str(uuid4())
    SESSIONS[token] = user.id
    return ok({"token": token, "user": safe_user(user)})
