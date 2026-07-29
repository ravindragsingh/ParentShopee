import json
import re
from datetime import date
from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from deps import require_auth, require_guardian
from helpers import get_family_id, math_assignment_dict, math_topic_dict, now
from models import DBMathAssignment, DBMathTopic, DBTransaction, DBUser, DBWallet
from responses import fail, ok
from schemas import MathAssignBody, MathSubmitBody

router = APIRouter()

POINTS_PER_CORRECT = 3


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


def _normalize(s: str) -> str:
    s = (s or "").strip().lower().replace(",", "")
    return re.sub(r"\s+", " ", s)


def _is_correct(kid_answer: str, accepted_answers: list) -> bool:
    given = _normalize(kid_answer)
    given_tokens = set(given.split())
    for accepted in accepted_answers:
        norm = _normalize(accepted)
        if given == norm:
            return True
        if given_tokens and given_tokens == set(norm.split()):
            return True
    return False


@router.get("/api/maths/topics")
def list_math_topics(db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    topics = db.query(DBMathTopic).order_by(DBMathTopic.order_index).all()
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
        if topic:
            results.append(math_assignment_dict(a, topic))
    today = date.today().isoformat()
    can_add_today = not any(a.assigned_date == today for a in assignments)
    return ok({"kidId": kid.id, "assignments": results, "canAddToday": can_add_today})


@router.post("/api/maths/assign")
def assign_math_topic(body: MathAssignBody, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    kid = _get_family_kid(db, get_family_id(user), body.kidId)
    topic = db.query(DBMathTopic).filter(DBMathTopic.id == body.topicId).first()
    if not topic:
        fail("Math topic not found", 404)
    today = date.today().isoformat()
    existing = db.query(DBMathAssignment).filter(
        DBMathAssignment.kid_id == kid.id, DBMathAssignment.assigned_date == today
    ).first()
    if existing:
        fail(f"You've already added a Math topic for {kid.name} today. Try again tomorrow.", 400)
    assignment = DBMathAssignment(
        id=str(uuid4()), kid_id=kid.id, topic_id=topic.id, family_id=get_family_id(user),
        assigned_date=today, added_by=user.id, created_at=now(),
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return ok(math_assignment_dict(assignment, topic), 201)


@router.delete("/api/maths/{assignment_id}")
def delete_math_assignment(assignment_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    assignment = db.query(DBMathAssignment).filter(DBMathAssignment.id == assignment_id).first()
    if not assignment:
        fail("Math assignment not found", 404)
    kid = db.query(DBUser).filter(DBUser.id == assignment.kid_id).first()
    if not kid or kid.guardian_id != get_family_id(user):
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

    score = sum(1 for q, a in zip(questions, answers) if _is_correct(a, q["answers"]))
    points = score * POINTS_PER_CORRECT

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
