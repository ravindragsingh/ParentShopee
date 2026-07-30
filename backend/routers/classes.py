import random
import string
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import get_db
from deps import require_guardian, require_teacher
from helpers import class_dict, get_family_id, get_teacher_student, membership_dict, now
from models import (
    DBClass, DBClassMembership, DBMaterialSubmission, DBMathAssignment, DBMathTopic,
    DBReadingMaterial, DBUser,
)
from responses import fail, ok
from schemas import ClassCreateBody, ClassJoinBody

ACTIVITY_LOG_DAYS = 10

router = APIRouter()


def _generate_join_code(db: Session) -> str:
    alphabet = string.ascii_uppercase + string.digits
    for _ in range(20):
        code = "".join(random.choices(alphabet, k=6))
        if not db.query(DBClass).filter(DBClass.join_code == code).first():
            return code
    fail("Could not generate a unique join code — please try again", 500)


def _get_teacher_class(db: Session, teacher_id: str, class_id: str) -> DBClass:
    cls = db.query(DBClass).filter(DBClass.id == class_id, DBClass.teacher_id == teacher_id).first()
    if not cls:
        fail("Class not found", 404)
    return cls


@router.post("/api/classes")
def create_class(body: ClassCreateBody, db: Session = Depends(get_db), user: DBUser = Depends(require_teacher)):
    if len(body.name.strip()) < 2:
        fail("Class name must be at least 2 characters")
    cls = DBClass(
        id=str(uuid4()), teacher_id=user.id, name=body.name.strip(),
        join_code=_generate_join_code(db), created_at=now(),
    )
    db.add(cls)
    db.commit()
    db.refresh(cls)
    return ok(class_dict(cls), 201)


@router.get("/api/classes")
def list_classes(db: Session = Depends(get_db), user: DBUser = Depends(require_teacher)):
    classes = db.query(DBClass).filter(DBClass.teacher_id == user.id).order_by(DBClass.created_at).all()
    result = []
    for cls in classes:
        memberships = db.query(DBClassMembership).filter(DBClassMembership.class_id == cls.id).all()
        approved = [m for m in memberships if m.status == "approved"]
        pending = [m for m in memberships if m.status == "pending"]
        pending_out = []
        for m in pending:
            kid = db.query(DBUser).filter(DBUser.id == m.kid_id).first()
            guardian = db.query(DBUser).filter(DBUser.id == m.guardian_id).first()
            pending_out.append(membership_dict(m, kid=kid, guardian=guardian))
        result.append({
            **class_dict(cls),
            "approvedCount": len(approved),
            "pendingCount": len(pending),
            "pendingRequests": pending_out,
        })
    return ok(result)


@router.get("/api/classes/{class_id}/roster")
def get_class_roster(class_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_teacher)):
    _get_teacher_class(db, user.id, class_id)
    memberships = db.query(DBClassMembership).filter(
        DBClassMembership.class_id == class_id, DBClassMembership.status == "approved"
    ).all()
    roster = []
    for m in memberships:
        kid = db.query(DBUser).filter(DBUser.id == m.kid_id).first()
        if kid:
            roster.append({"id": kid.id, "name": kid.name, "avatar": kid.avatar, "membershipId": m.id})
    return ok(roster)


@router.get("/api/classes/students")
def list_all_students(db: Session = Depends(get_db), user: DBUser = Depends(require_teacher)):
    classes = db.query(DBClass).filter(DBClass.teacher_id == user.id).all()
    students_by_kid = {}
    for cls in classes:
        memberships = db.query(DBClassMembership).filter(
            DBClassMembership.class_id == cls.id, DBClassMembership.status == "approved"
        ).all()
        for m in memberships:
            kid = db.query(DBUser).filter(DBUser.id == m.kid_id).first()
            if not kid:
                continue
            entry = students_by_kid.setdefault(kid.id, {"id": kid.id, "name": kid.name, "avatar": kid.avatar, "classes": []})
            entry["classes"].append({"id": cls.id, "name": cls.name})
    result = sorted(students_by_kid.values(), key=lambda s: s["name"])
    return ok(result)


@router.get("/api/classes/students/{kid_id}/activity")
def get_student_activity(kid_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_teacher)):
    kid = get_teacher_student(db, user.id, kid_id)
    class_ids = [c.id for c in db.query(DBClass).filter(DBClass.teacher_id == user.id).all()]
    cutoff = (datetime.now(timezone.utc) - timedelta(days=ACTIVITY_LOG_DAYS)).isoformat()

    events = []

    source_conditions = [DBMathAssignment.added_by == user.id]
    if class_ids:
        source_conditions.append(DBMathAssignment.class_id.in_(class_ids))
    assignments = db.query(DBMathAssignment).filter(
        DBMathAssignment.kid_id == kid.id, DBMathAssignment.source == "teacher",
        or_(*source_conditions),
    ).all()
    for a in assignments:
        topic = db.query(DBMathTopic).filter(DBMathTopic.id == a.topic_id).first()
        title = topic.title if topic else "a Math topic"
        if a.created_at and a.created_at >= cutoff:
            events.append({"type": "math_assigned", "timestamp": a.created_at, "text": f"Assigned \"{title}\""})
        if a.submitted_at and a.submitted_at >= cutoff:
            events.append({
                "type": "math_submitted", "timestamp": a.submitted_at,
                "text": f"Completed \"{title}\" — {a.score} correct, +{a.points_earned} pts",
            })

    materials = db.query(DBReadingMaterial).filter(DBReadingMaterial.teacher_id == user.id).all()
    material_by_id = {m.id: m for m in materials}
    submissions = db.query(DBMaterialSubmission).filter(
        DBMaterialSubmission.kid_id == kid.id, DBMaterialSubmission.material_id.in_(list(material_by_id.keys())),
    ).all() if material_by_id else []
    for s in submissions:
        if s.submitted_at and s.submitted_at >= cutoff:
            material = material_by_id.get(s.material_id)
            title = material.title if material else "reading material"
            events.append({
                "type": "material_submitted", "timestamp": s.submitted_at,
                "text": f"Completed \"{title}\" — {s.score} correct, +{s.points_earned} pts",
            })

    events.sort(key=lambda e: e["timestamp"], reverse=True)
    return ok({"kidId": kid.id, "kidName": kid.name, "kidAvatar": kid.avatar, "days": ACTIVITY_LOG_DAYS, "events": events[:50]})


@router.delete("/api/classes/{class_id}")
def delete_class(class_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_teacher)):
    cls = _get_teacher_class(db, user.id, class_id)
    db.query(DBClassMembership).filter(DBClassMembership.class_id == class_id).delete(synchronize_session=False)
    db.delete(cls)
    db.commit()
    return ok({"deleted": True})


@router.post("/api/classes/join")
def join_class(body: ClassJoinBody, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    cls = db.query(DBClass).filter(DBClass.join_code == body.joinCode.strip().upper()).first()
    if not cls:
        fail("No class found with that code — check with your child's teacher.", 404)
    kid = db.query(DBUser).filter(
        DBUser.id == body.kidId, DBUser.role == "kid", DBUser.guardian_id == get_family_id(user)
    ).first()
    if not kid:
        fail("Child not found or not in your family", 404)

    existing = db.query(DBClassMembership).filter(
        DBClassMembership.class_id == cls.id, DBClassMembership.kid_id == kid.id
    ).first()
    if existing and existing.status == "approved":
        fail(f"{kid.name} is already a member of this class")
    if existing and existing.status == "pending":
        fail(f"{kid.name} already has a pending request for this class")
    if existing:
        existing.status = "pending"
        existing.guardian_id = user.id
        existing.requested_at = now()
        existing.resolved_at = None
        membership = existing
    else:
        membership = DBClassMembership(
            id=str(uuid4()), class_id=cls.id, kid_id=kid.id, guardian_id=user.id,
            status="pending", requested_at=now(),
        )
        db.add(membership)
    db.commit()
    db.refresh(membership)
    return ok(membership_dict(membership, kid=kid, class_=cls), 201)


@router.get("/api/classes/mine")
def list_my_class_memberships(db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    kid_ids = [k.id for k in db.query(DBUser).filter(DBUser.role == "kid", DBUser.guardian_id == get_family_id(user)).all()]
    memberships = db.query(DBClassMembership).filter(DBClassMembership.kid_id.in_(kid_ids)).order_by(
        DBClassMembership.requested_at.desc()
    ).all() if kid_ids else []
    result = []
    for m in memberships:
        kid = db.query(DBUser).filter(DBUser.id == m.kid_id).first()
        cls = db.query(DBClass).filter(DBClass.id == m.class_id).first()
        if kid and cls:
            teacher = db.query(DBUser).filter(DBUser.id == cls.teacher_id).first()
            d = membership_dict(m, kid=kid, class_=cls)
            d["teacherName"] = teacher.name if teacher else None
            result.append(d)
    return ok(result)


@router.post("/api/classes/memberships/{membership_id}/approve")
def approve_membership(membership_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_teacher)):
    m = db.query(DBClassMembership).filter(DBClassMembership.id == membership_id).first()
    if not m:
        fail("Join request not found", 404)
    _get_teacher_class(db, user.id, m.class_id)
    if m.status != "pending":
        fail("Only pending requests can be approved")
    m.status = "approved"
    m.resolved_at = now()
    db.commit()
    db.refresh(m)
    return ok(membership_dict(m))


@router.post("/api/classes/memberships/{membership_id}/reject")
def reject_membership(membership_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_teacher)):
    m = db.query(DBClassMembership).filter(DBClassMembership.id == membership_id).first()
    if not m:
        fail("Join request not found", 404)
    _get_teacher_class(db, user.id, m.class_id)
    if m.status != "pending":
        fail("Only pending requests can be rejected")
    m.status = "rejected"
    m.resolved_at = now()
    db.commit()
    db.refresh(m)
    return ok(membership_dict(m))
