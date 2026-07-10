from typing import Optional

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from config import SESSIONS
from database import get_db
from models import DBUser
from responses import fail


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
