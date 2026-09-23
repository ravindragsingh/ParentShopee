from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import uuid4

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from database import get_db
from helpers import now as now_iso
from models import DBSession, DBUser
from responses import fail

LAST_ACTIVE_THROTTLE = timedelta(minutes=5)

# A session with no activity for this long is treated as expired -- generous
# on purpose (sessions are DB-backed now, so they'd otherwise never expire on
# their own), just long enough that a stolen/old token doesn't stay valid
# forever. Refreshing last_used_at on every request would mean a DB write per
# request just to track a value nothing reads that precisely, so it's
# throttled the same way _touch_last_active is.
SESSION_TTL_DAYS = 90
SESSION_REFRESH_THROTTLE = timedelta(hours=24)


def _touch_last_active(db: Session, user: DBUser) -> None:
    """Update last_active_at at most once per throttle window to avoid a DB write on every request."""
    now = datetime.now(timezone.utc)
    stale = True
    if user.last_active_at:
        try:
            stale = (now - datetime.fromisoformat(user.last_active_at)) > LAST_ACTIVE_THROTTLE
        except ValueError:
            stale = True
    if stale:
        user.last_active_at = now.isoformat()
        db.commit()


def create_session(db: Session, user_id: str) -> str:
    """Issues a new Bearer token for user_id and persists it, so it survives
    a server restart (a redeploy) instead of forcing a fresh login every time."""
    token = str(uuid4())
    ts = now_iso()
    db.add(DBSession(token=token, user_id=user_id, created_at=ts, last_used_at=ts))
    db.commit()
    return token


def require_auth(db: Session = Depends(get_db), authorization: Optional[str] = Header(default=None)) -> DBUser:
    if not authorization or not authorization.startswith("Bearer "):
        fail("Unauthorized — valid Bearer token required", 401)
    token = authorization[7:]
    session = db.query(DBSession).filter(DBSession.token == token).first()
    if not session:
        fail("Unauthorized — valid Bearer token required", 401)
    try:
        last_used = datetime.fromisoformat(session.last_used_at)
    except ValueError:
        last_used = None
    now = datetime.now(timezone.utc)
    if last_used is None or (now - last_used) > timedelta(days=SESSION_TTL_DAYS):
        db.delete(session)
        db.commit()
        fail("Unauthorized — valid Bearer token required", 401)
    user = db.query(DBUser).filter(DBUser.id == session.user_id).first()
    if not user:
        fail("Unauthorized — valid Bearer token required", 401)
    if user.is_suspended == "1":
        fail("This account has been suspended. Contact support for help.", 403, code="account_suspended")
    if (now - last_used) > SESSION_REFRESH_THROTTLE:
        session.last_used_at = now.isoformat()
        db.commit()
    _touch_last_active(db, user)
    return user

def require_guardian(user: DBUser = Depends(require_auth)) -> DBUser:
    if user.role != "guardian":
        fail("Forbidden — guardians only", 403)
    return user

def require_kid(user: DBUser = Depends(require_auth)) -> DBUser:
    if user.role != "kid":
        fail("Forbidden — kids only", 403)
    return user

def require_admin(user: DBUser = Depends(require_auth)) -> DBUser:
    if user.role != "admin":
        fail("Forbidden — admin only", 403)
    return user
