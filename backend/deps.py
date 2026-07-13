from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from config import SESSIONS
from database import get_db
from models import DBUser
from responses import fail

LAST_ACTIVE_THROTTLE = timedelta(minutes=5)


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


def require_auth(db: Session = Depends(get_db), authorization: Optional[str] = Header(default=None)) -> DBUser:
    if not authorization or not authorization.startswith("Bearer "):
        fail("Unauthorized — valid Bearer token required", 401)
    token = authorization[7:]
    user_id = SESSIONS.get(token)
    if not user_id:
        fail("Unauthorized — valid Bearer token required", 401)
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        fail("Unauthorized — valid Bearer token required", 401)
    if user.is_suspended == "1":
        fail("This account has been suspended. Contact support for help.", 403, code="account_suspended")
    _touch_last_active(db, user)
    return user

def require_parent(user: DBUser = Depends(require_auth)) -> DBUser:
    if user.role != "parent":
        fail("Forbidden — parents only", 403)
    return user

def require_kid(user: DBUser = Depends(require_auth)) -> DBUser:
    if user.role != "kid":
        fail("Forbidden — kids only", 403)
    return user

def require_admin(user: DBUser = Depends(require_auth)) -> DBUser:
    if user.role != "admin":
        fail("Forbidden — admin only", 403)
    return user
