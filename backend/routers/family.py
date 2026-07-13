from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from deps import require_parent
from helpers import now, safe_user
from models import DBUser
from responses import fail, ok
from schemas import CoParentBody, UpdateKidPasswordBody
from security import check_password_complexity

router = APIRouter()


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
    if db.query(DBUser).filter(DBUser.username == body.username.strip()).first():
        fail("Username already taken")
    if len(body.name.strip()) < 2:
        fail("Name must be at least 2 characters")
    check_password_complexity(body.password)

    co_parent = DBUser(
        id=str(uuid4()),
        name=body.name.strip(),
        username=body.username.strip(),
        password=body.password,
        role="parent",
        co_parent_of=user.id,
        created_at=now(),
    )
    db.add(co_parent)
    db.commit()
    db.refresh(co_parent)
    return ok(safe_user(co_parent), 201)


@router.put("/api/family/co-parent/password")
def update_co_parent_password(body: UpdateKidPasswordBody, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    if user.co_parent_of:
        fail("Co-parents cannot change passwords via this endpoint")
    co_parent = db.query(DBUser).filter(DBUser.co_parent_of == user.id, DBUser.role == "parent").first()
    if not co_parent:
        fail("No co-parent found")
    check_password_complexity(body.password)
    co_parent.password = body.password
    db.commit()
    return ok({"message": f"Password updated for {co_parent.name}"})


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
