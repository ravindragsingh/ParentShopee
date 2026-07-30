from datetime import date
from uuid import uuid4
import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from deps import require_auth, require_guardian, require_guardian_or_teacher, require_teacher
from helpers import get_family_id, get_teacher_student, grade_answers, math_assignment_dict, math_topic_dict, now
from models import DBClass, DBClassMembership, DBMathAssignment, DBMathTopic, DBTransaction, DBUser, DBWallet
from responses import fail, ok
from schemas import MathAssignBody, MathAssignClassBody, MathAssignStudentBody, MathSubmitBody

router = APIRouter()


def _get_family_kid(db: Session, family_id: str, kid_id: str) -> DBUser:
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid", DBUser.guardian_id == family_id).first()
    if not kid:
        fail("Child not found or not in your family", 404)
    return kid


def _resolve_target_kid(db: Session, user: DBUser, kid_id_param: str = None) -> DBUser:
    if user.role == "kid":
        return user
    if not kid_id_param:
        fail("kidId is required", 400)
    return _get_family_kid(db, get_family_id(user), kid_id_param)


@router.get("/api/maths/topics")
def list_math_topics(topic: str = None, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian_or_teacher)):
    topics = db.query(DBMathTopic).order_by(DBMathTopic.order_index).all()
    if topic:
        needle = topic.strip().lower()
        topics = [t for t in topics if needle in t.title.lower() or needle in t.explanation.lower()]
    return ok([math_topic_dict(t) for t in topics])


@router.get("/api/maths")
def get_maths(kidId: str = None, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    kid = _resolve_target_kid(db, user, kidId)
    assignments = db.query(DBMathAssignment).filter(DBMathAssignment.kid_id == kid.id).order_by(
        DBMathAssignment.assigned_date.desc(), DBMathAssignment.created_at.desc()
    ).all()
    results = []
    for a in assignments:
        topic = db.query(DBMathTopic).filter(DBMathTopic.id == a.topic_id).first()
        if not topic:
            continue
        class_name = None
        if a.class_id:
            cls = db.query(DBClass).filter(DBClass.id == a.class_id).first()
            class_name = cls.name if cls else None
        results.append(math_assignment_dict(a, topic, class_name=class_name))
    today = date.today().isoformat()
    can_add_today = not any(a.assigned_date == today and (a.source or "guardian") == "guardian" for a in assignments)
    return ok({"kidId": kid.id, "assignments": results, "canAddToday": can_add_today})


@router.post("/api/maths/assign")
def assign_math_topic(body: MathAssignBody, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    kid = _get_family_kid(db, get_family_id(user), body.kidId)
    topic = db.query(DBMathTopic).filter(DBMathTopic.id == body.topicId).first()
    if not topic:
        fail("Math topic not found", 404)
    today = date.today().isoformat()
    existing = db.query(DBMathAssignment).filter(
        DBMathAssignment.kid_id == kid.id, DBMathAssignment.assigned_date == today,
        DBMathAssignment.source == "guardian",
    ).first()
    if existing:
        fail(f"You've already added a Math topic for {kid.name} today. Try again tomorrow.", 400)
    assignment = DBMathAssignment(
        id=str(uuid4()), kid_id=kid.id, topic_id=topic.id, family_id=get_family_id(user),
        assigned_date=today, added_by=user.id, created_at=now(), source="guardian",
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return ok(math_assignment_dict(assignment, topic), 201)


@router.post("/api/maths/assign-class")
def assign_math_topic_to_class(body: MathAssignClassBody, db: Session = Depends(get_db), user: DBUser = Depends(require_teacher)):
    cls = db.query(DBClass).filter(DBClass.id == body.classId, DBClass.teacher_id == user.id).first()
    if not cls:
        fail("Class not found", 404)
    topic = db.query(DBMathTopic).filter(DBMathTopic.id == body.topicId).first()
    if not topic:
        fail("Math topic not found", 404)

    memberships = db.query(DBClassMembership).filter(
        DBClassMembership.class_id == cls.id, DBClassMembership.status == "approved"
    ).all()
    if not memberships:
        fail("This class has no students yet — approve a join request first", 400)

    today = date.today().isoformat()
    assigned_count = 0
    skipped_count = 0
    for m in memberships:
        kid = db.query(DBUser).filter(DBUser.id == m.kid_id, DBUser.role == "kid").first()
        if not kid:
            continue
        dup = db.query(DBMathAssignment).filter(
            DBMathAssignment.kid_id == kid.id, DBMathAssignment.class_id == cls.id,
            DBMathAssignment.topic_id == topic.id,
        ).first()
        if dup:
            skipped_count += 1
            continue
        db.add(DBMathAssignment(
            id=str(uuid4()), kid_id=kid.id, topic_id=topic.id, family_id=kid.guardian_id,
            assigned_date=today, added_by=user.id, created_at=now(), source="teacher",
            class_id=cls.id, due_date=body.dueDate or None,
        ))
        assigned_count += 1
    db.commit()
    return ok({"assignedCount": assigned_count, "skippedCount": skipped_count, "classId": cls.id, "className": cls.name})


@router.post("/api/maths/assign-student")
def assign_math_topic_to_student(body: MathAssignStudentBody, db: Session = Depends(get_db), user: DBUser = Depends(require_teacher)):
    kid = get_teacher_student(db, user.id, body.kidId)
    topic = db.query(DBMathTopic).filter(DBMathTopic.id == body.topicId).first()
    if not topic:
        fail("Math topic not found", 404)

    dup = db.query(DBMathAssignment).filter(
        DBMathAssignment.kid_id == kid.id, DBMathAssignment.topic_id == topic.id,
        DBMathAssignment.added_by == user.id, DBMathAssignment.class_id.is_(None),
    ).first()
    if dup:
        fail(f"You've already assigned this topic to {kid.name}")

    assignment = DBMathAssignment(
        id=str(uuid4()), kid_id=kid.id, topic_id=topic.id, family_id=kid.guardian_id,
        assigned_date=date.today().isoformat(), added_by=user.id, created_at=now(),
        source="teacher", due_date=body.dueDate or None,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return ok(math_assignment_dict(assignment, topic), 201)


@router.delete("/api/maths/{assignment_id}")
def delete_math_assignment(assignment_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian_or_teacher)):
    assignment = db.query(DBMathAssignment).filter(DBMathAssignment.id == assignment_id).first()
    if not assignment:
        fail("Math assignment not found", 404)
    if (assignment.source or "guardian") == "teacher":
        if user.role != "teacher" or assignment.added_by != user.id:
            fail("Only the assigning teacher can remove this assignment", 403)
    else:
        kid = db.query(DBUser).filter(DBUser.id == assignment.kid_id).first()
        if user.role != "guardian" or not kid or kid.guardian_id != get_family_id(user):
            fail("Not allowed to modify this item", 403)
    if assignment.submitted_at:
        fail("Can't remove a topic your child has already completed")
    db.delete(assignment)
    db.commit()
    return ok({"deleted": True})


@router.post("/api/maths/{assignment_id}/submit")
def submit_math_assignment(assignment_id: str, body: MathSubmitBody, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    if user.role != "kid":
        fail("Only kids can submit Math answers", 403)
    assignment = db.query(DBMathAssignment).filter(DBMathAssignment.id == assignment_id).first()
    if not assignment:
        fail("Math assignment not found", 404)
    if assignment.kid_id != user.id:
        fail("Not allowed to submit this assignment", 403)
    if assignment.submitted_at:
        fail("This topic has already been submitted")
    topic = db.query(DBMathTopic).filter(DBMathTopic.id == assignment.topic_id).first()
    if not topic:
        fail("Math topic not found", 404)

    questions = json.loads(topic.questions)
    answers = body.answers or []
    if len(answers) != len(questions):
        fail(f"Expected {len(questions)} answers")

    score, points = grade_answers(questions, answers)

    wallet = db.query(DBWallet).filter(DBWallet.kid_id == user.id).first()
    if not wallet:
        wallet = DBWallet(kid_id=user.id, balance=0)
        db.add(wallet)
        db.flush()
    if points > 0:
        wallet.balance += points
        db.add(DBTransaction(
            id=str(uuid4()), kid_id=user.id, type="earned", amount=points,
            description=f"Maths: {topic.title} ({score}/{len(questions)} correct)", timestamp=now(),
        ))

    assignment.answers = json.dumps(answers)
    assignment.score = score
    assignment.points_earned = points
    assignment.submitted_at = now()
    db.commit()
    db.refresh(assignment)
    db.refresh(wallet)
    return ok({"assignment": math_assignment_dict(assignment, topic), "newBalance": wallet.balance})
