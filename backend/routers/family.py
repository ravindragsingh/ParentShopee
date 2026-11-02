from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from config import COGUARDIAN_INVITE_TTL_HOURS, EMAIL_RE
from database import get_db
from deps import create_session, require_guardian
from email_utils import send_coguardian_invite_email, send_coguardian_recovery_email
from firebase_app import verify_firebase_token
from helpers import generate_inert_credentials, get_family_id, now, safe_user
from models import DBCoGuardianInvite, DBUser
from responses import fail, ok
from schemas import (
    CoGuardianBody, CoGuardianInviteAcceptBody, CoGuardianInviteBody,
    ProfileEnterBody, RecoverPinBody,
    ResendCoGuardianAccessBody, UpdatePinBody,
)
from security import check_pin_complexity

router = APIRouter()

PIN_MAX_ATTEMPTS = 5
PIN_LOCKOUT_MINUTES = 15

# The public "Try Demo" family on the login page -- this id is permanently
# reserved by the seed script and can never be assigned to a real guardian
# (self-registration always generates a fresh UUID), so it's safe to give it
# a standing PIN bypass rather than relying on the frontend's hardcoded demo
# PINs staying in sync with whatever a kid's actual `pin` column currently
# holds. That sync kept drifting (someone testing the "Change PIN" flow, a
# PIN reset, etc.), repeatedly breaking the demo with a false "Incorrect PIN".
DEMO_FAMILY_ID = "parent1"


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
    if _pending_invite_for(db, user.id):
        fail("You have a pending co-guardian invite — cancel it before adding one directly.")
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


# ── Co-guardian invite-by-email ──────────────────────────────────────────────
# An alternative to add_co_guardian above for when the co-parent isn't
# physically at this device: the guardian sends an email instead of typing in
# a name+PIN themselves, the co-parent fills that in on their own device, and
# ends up with the exact same kind of profile either way. Accepting also logs
# that device in (see accept_coguardian_invite) so the co-parent never needs
# to know the family's own username/password to use their own phone.

def _pending_invite_for(db: Session, family_id: str) -> DBCoGuardianInvite | None:
    return db.query(DBCoGuardianInvite).filter(DBCoGuardianInvite.family_id == family_id).first()


@router.get("/api/family/co-guardian/invite")
def get_coguardian_invite(db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    if user.co_guardian_of:
        return ok({"pending": None})
    invite = _pending_invite_for(db, user.id)
    if not invite:
        return ok({"pending": None})
    kind = "recovery" if invite.existing_user_id else "new"
    return ok({"pending": {"email": invite.email, "expiresAt": invite.expires_at, "kind": kind}})


@router.post("/api/family/co-guardian/invite")
def send_coguardian_invite(body: CoGuardianInviteBody, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    if user.co_guardian_of:
        fail("Co-guardians cannot invite another co-guardian")
    if db.query(DBUser).filter(DBUser.co_guardian_of == user.id, DBUser.role == "guardian").first():
        fail("You already have a co-guardian. Remove them first.")
    if _pending_invite_for(db, user.id):
        fail("You already have a pending invite. Cancel it before sending another.")
    email = body.email.strip().lower()
    if not EMAIL_RE.match(email):
        fail("Please enter a valid email address")
    # Prevent the confusing case where this email could also just register its
    # own independent account while an invite is outstanding for it.
    if db.query(DBUser).filter(DBUser.email == email).first():
        fail("An account with this email already exists.")

    invite = DBCoGuardianInvite(
        id=str(uuid4()),
        family_id=user.id,
        email=email,
        token=str(uuid4()),
        created_at=now(),
        expires_at=(datetime.now(timezone.utc) + timedelta(hours=COGUARDIAN_INVITE_TTL_HOURS)).isoformat(),
    )
    db.add(invite)
    db.commit()

    if not send_coguardian_invite_email(email, user.name, invite.token):
        db.delete(invite)
        db.commit()
        fail("Couldn't send the invite email. Please try again shortly.", 500)
    return ok({"email": email, "expiresAt": invite.expires_at}, 201)


@router.delete("/api/family/co-guardian/invite")
def cancel_coguardian_invite(db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    if user.co_guardian_of:
        fail("Co-guardians cannot manage invites")
    invite = _pending_invite_for(db, user.id)
    if not invite:
        fail("No pending invite found")
    db.delete(invite)
    db.commit()
    return ok({"message": "Invite cancelled"})


@router.get("/api/family/co-guardian/invite/preview")
def preview_coguardian_invite(token: str, db: Session = Depends(get_db)):
    """Public (no auth) -- lets the accept page show whose family this is,
    and whether this is a fresh invite (needs a name/PIN form) or a recovery
    link for an existing profile (just needs a confirm button)."""
    invite = db.query(DBCoGuardianInvite).filter(DBCoGuardianInvite.token == token).first()
    if not invite:
        fail("This invite link is invalid or has already been used.", 404)
    if datetime.fromisoformat(invite.expires_at) < datetime.now(timezone.utc):
        fail("This invite link has expired. Ask your co-parent to send a new one.", 410)
    guardian = db.query(DBUser).filter(DBUser.id == invite.family_id).first()
    kind = "recovery" if invite.existing_user_id else "new"
    return ok({"guardianName": guardian.name if guardian else "your co-parent", "kind": kind})


@router.post("/api/family/co-guardian/invite/accept")
def accept_coguardian_invite(body: CoGuardianInviteAcceptBody, db: Session = Depends(get_db)):
    """Public (no auth) -- the co-parent has no session yet. For a fresh
    invite, creates the same kind of profile add_co_guardian does; for a
    recovery link, re-logs in the existing profile unchanged. Either way
    this logs the device in (mints a session the same way /api/auth/login
    does) so it works going forward exactly like the guardian's own device,
    without ever needing the family's username/password."""
    invite = db.query(DBCoGuardianInvite).filter(DBCoGuardianInvite.token == body.token).first()
    if not invite:
        fail("This invite link is invalid or has already been used.", 404)
    if datetime.fromisoformat(invite.expires_at) < datetime.now(timezone.utc):
        fail("This invite link has expired. Ask your co-parent to send a new one.", 410)

    if invite.existing_user_id:
        co_guardian = db.query(DBUser).filter(
            DBUser.id == invite.existing_user_id, DBUser.co_guardian_of == invite.family_id,
        ).first()
        if not co_guardian:
            db.delete(invite)
            db.commit()
            fail("This co-guardian profile no longer exists.", 404)
        db.delete(invite)
        db.commit()
        token = create_session(db, co_guardian.id)
        return ok({"token": token, "user": safe_user(co_guardian)})

    if db.query(DBUser).filter(DBUser.co_guardian_of == invite.family_id, DBUser.role == "guardian").first():
        db.delete(invite)
        db.commit()
        fail("This family already has a co-guardian.")
    if not body.name or len(body.name.strip()) < 2:
        fail("Name must be at least 2 characters")
    check_pin_complexity(body.pin or "")

    username, password = generate_inert_credentials()
    co_guardian = DBUser(
        id=str(uuid4()),
        name=body.name.strip(),
        username=username,
        password=password,
        role="guardian",
        email=invite.email,  # kept so a future "resend device access" has somewhere to send it
        co_guardian_of=invite.family_id,
        avatar=body.avatar or "🧑",
        pin=body.pin,
        pin_auto_generated="0",
        created_at=now(),
    )
    db.add(co_guardian)
    db.delete(invite)
    db.commit()
    db.refresh(co_guardian)

    token = create_session(db, co_guardian.id)
    return ok({"token": token, "user": safe_user(co_guardian)}, 201)


@router.post("/api/family/co-guardian/resend-access")
def resend_coguardian_access(body: ResendCoGuardianAccessBody, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    """For when an EXISTING co-guardian loses their device or clears their
    browser -- they have no password to log back in with (same as any
    kid/co-guardian profile, this was always PIN-only), so this sends a
    fresh one-time link that re-establishes their session unchanged,
    instead of the guardian having to remove and re-add them from scratch."""
    if user.co_guardian_of:
        fail("Co-guardians cannot manage their own access recovery")
    co_guardian = db.query(DBUser).filter(DBUser.co_guardian_of == user.id, DBUser.role == "guardian").first()
    if not co_guardian:
        fail("No co-guardian found")
    if _pending_invite_for(db, user.id):
        fail("You already have a pending invite or recovery link. Cancel it before sending another.")

    email = (body.email or co_guardian.email or "").strip().lower()
    if not email or not EMAIL_RE.match(email):
        fail("Please provide a valid email to send the recovery link to")
    if email != co_guardian.email:
        co_guardian.email = email

    invite = DBCoGuardianInvite(
        id=str(uuid4()),
        family_id=user.id,
        email=email,
        existing_user_id=co_guardian.id,
        token=str(uuid4()),
        created_at=now(),
        expires_at=(datetime.now(timezone.utc) + timedelta(hours=COGUARDIAN_INVITE_TTL_HOURS)).isoformat(),
    )
    db.add(invite)
    db.commit()

    if not send_coguardian_recovery_email(email, user.name, invite.token):
        db.delete(invite)
        db.commit()
        fail("Couldn't send the recovery email. Please try again shortly.", 500)
    return ok({"email": email, "expiresAt": invite.expires_at}, 201)


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
            # Lets the profile picker offer "confirm with Google" instead of a
            # password field when recovering a forgotten PIN -- a Google-only
            # guardian's `password` column is an inert random placeholder they
            # never saw (see google_complete), so asking for it would be a dead end.
            "isGoogleAccount": bool(u.google_id),
        }

    guardian_profile = profile_dict(guardian, guardian.pin is not None)
    # Needed client-side to re-authenticate with Firebase for PIN recovery
    # (signInWithEmailAndPassword needs an email) -- zero risk to surface,
    # since it's the guardian's own email on their own authenticated family
    # session, same scope as tempPin/isGoogleAccount above.
    guardian_profile["email"] = guardian.email
    profiles = [guardian_profile]
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

    if family_id == DEMO_FAMILY_ID:
        profile.pin_attempts = 0
        profile.pin_locked_until = None
        db.commit()
        db.refresh(profile)
        token = create_session(db, profile.id)
        return ok({"token": token, "user": safe_user(profile)})

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

    token = create_session(db, profile.id)
    return ok({"token": token, "user": safe_user(profile)})


@router.post("/api/family/profiles/recover-pin")
def recover_own_pin(body: RecoverPinBody, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    # Recovery for a forgotten PIN, primary guardian only — kids and the co-guardian
    # get their PIN reset by the primary guardian instead (Kids tab / Admin Panel),
    # same as before. This used to branch on how the guardian signed up (a local
    # password check vs. a Google credential check); now that every guardian
    # authenticates through Firebase, proving a *fresh* Firebase ID token (the
    # frontend re-prompts for a password or re-runs Google sign-in to get one,
    # same UX as before) is identity proof regardless of which provider it came
    # from -- so this one endpoint covers both cases where two used to exist.
    if user.co_guardian_of:
        fail("Only the primary guardian can recover their PIN this way", 403)
    decoded = verify_firebase_token(body.idToken)
    if decoded["uid"] != user.firebase_uid:
        fail("That sign-in doesn't match this family's account.", 401)
    check_pin_complexity(body.newPin)

    user.pin = body.newPin
    user.pin_auto_generated = "0"
    user.pin_attempts = 0
    user.pin_locked_until = None
    db.commit()
    db.refresh(user)

    token = create_session(db, user.id)
    return ok({"token": token, "user": safe_user(user)})
