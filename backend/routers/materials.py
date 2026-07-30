import json
from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from deps import require_auth, require_teacher
from helpers import get_family_id, get_teacher_student, grade_answers, material_dict, material_for_kid_dict, now
from models import (
    DBClass, DBClassMembership, DBMaterialSubmission, DBReadingMaterial,
    DBReadingMaterialKidShare, DBReadingMaterialShare, DBTransaction, DBUser, DBWallet,
)
from responses import fail, ok
from schemas import MaterialCreateBody, MaterialShareBody, MaterialShareStudentBody, MaterialSubmitBody

router = APIRouter()


def _get_teacher_material(db: Session, teacher_id: str, material_id: str) -> DBReadingMaterial:
    m = db.query(DBReadingMaterial).filter(DBReadingMaterial.id == material_id, DBReadingMaterial.teacher_id == teacher_id).first()
    if not m:
        fail("Reading material not found", 404)
    return m


def _validate_questions(questions) -> str:
    """Every question needs text AND at least one accepted answer — returns the
    JSON string to store, or None if no questions were given."""
    if not questions:
        return None
    cleaned = []
    for q in questions:
        qtext = q.question.strip()
        answers = [a.strip() for a in (q.answers or []) if a.strip()]
        if not qtext:
            fail("Every question needs question text")
        if not answers:
            fail(f"Question \"{qtext}\" needs at least one accepted answer")
        cleaned.append({"question": qtext, "answers": answers})
    return json.dumps(cleaned)


def _material_shares(db: Session, material_id: str) -> dict:
    class_shares = db.query(DBReadingMaterialShare).filter(DBReadingMaterialShare.material_id == material_id).all()
    kid_shares = db.query(DBReadingMaterialKidShare).filter(DBReadingMaterialKidShare.material_id == material_id).all()
    return {"shared_class_ids": [s.class_id for s in class_shares], "shared_kid_ids": [s.kid_id for s in kid_shares]}


@router.post("/api/materials")
def create_material(body: MaterialCreateBody, db: Session = Depends(get_db), user: DBUser = Depends(require_teacher)):
    if len(body.title.strip()) < 2:
        fail("Title must be at least 2 characters")
    if body.questions and body.grade is None:
        fail("Class is required when adding practice questions")
    questions = _validate_questions(body.questions)
    material = DBReadingMaterial(
        id=str(uuid4()), teacher_id=user.id, title=body.title.strip(),
        description=(body.description or "").strip(), url=(body.url or "").strip() or None,
        topic=(body.topic or "").strip() or None, grade=body.grade, questions=questions, created_at=now(),
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return ok(material_dict(material), 201)


@router.put("/api/materials/{material_id}")
def update_material(material_id: str, body: MaterialCreateBody, db: Session = Depends(get_db), user: DBUser = Depends(require_teacher)):
    material = _get_teacher_material(db, user.id, material_id)
    if len(body.title.strip()) < 2:
        fail("Title must be at least 2 characters")
    if body.questions and body.grade is None:
        fail("Class is required when adding practice questions")
    material.questions = _validate_questions(body.questions)
    material.title = body.title.strip()
    material.description = (body.description or "").strip()
    material.url = (body.url or "").strip() or None
    material.topic = (body.topic or "").strip() or None
    material.grade = body.grade
    db.commit()
    db.refresh(material)
    return ok(material_dict(material, **_material_shares(db, material.id)))


@router.get("/api/materials")
def list_materials(topic: str = None, db: Session = Depends(get_db), user: DBUser = Depends(require_teacher)):
    q = db.query(DBReadingMaterial).filter(DBReadingMaterial.teacher_id == user.id)
    materials = q.order_by(DBReadingMaterial.created_at.desc()).all()
    if topic:
        needle = topic.strip().lower()
        materials = [
            m for m in materials
            if needle in (m.topic or "").lower() or needle in m.title.lower() or needle in (m.description or "").lower()
        ]
    result = [material_dict(m, **_material_shares(db, m.id)) for m in materials]
    return ok(result)


@router.delete("/api/materials/{material_id}")
def delete_material(material_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_teacher)):
    material = _get_teacher_material(db, user.id, material_id)
    db.query(DBReadingMaterialShare).filter(DBReadingMaterialShare.material_id == material_id).delete(synchronize_session=False)
    db.query(DBReadingMaterialKidShare).filter(DBReadingMaterialKidShare.material_id == material_id).delete(synchronize_session=False)
    db.query(DBMaterialSubmission).filter(DBMaterialSubmission.material_id == material_id).delete(synchronize_session=False)
    db.delete(material)
    db.commit()
    return ok({"deleted": True})


@router.post("/api/materials/{material_id}/share")
def share_material(material_id: str, body: MaterialShareBody, db: Session = Depends(get_db), user: DBUser = Depends(require_teacher)):
    _get_teacher_material(db, user.id, material_id)
    cls = db.query(DBClass).filter(DBClass.id == body.classId, DBClass.teacher_id == user.id).first()
    if not cls:
        fail("Class not found", 404)
    existing = db.query(DBReadingMaterialShare).filter(
        DBReadingMaterialShare.material_id == material_id, DBReadingMaterialShare.class_id == body.classId
    ).first()
    if not existing:
        db.add(DBReadingMaterialShare(id=str(uuid4()), material_id=material_id, class_id=body.classId, shared_at=now()))
        db.commit()
    return ok({"shared": True})


@router.delete("/api/materials/{material_id}/share/{class_id}")
def unshare_material(material_id: str, class_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_teacher)):
    _get_teacher_material(db, user.id, material_id)
    db.query(DBReadingMaterialShare).filter(
        DBReadingMaterialShare.material_id == material_id, DBReadingMaterialShare.class_id == class_id
    ).delete(synchronize_session=False)
    db.commit()
    return ok({"unshared": True})


@router.post("/api/materials/{material_id}/share-student")
def share_material_with_student(material_id: str, body: MaterialShareStudentBody, db: Session = Depends(get_db), user: DBUser = Depends(require_teacher)):
    _get_teacher_material(db, user.id, material_id)
    get_teacher_student(db, user.id, body.kidId)
    existing = db.query(DBReadingMaterialKidShare).filter(
        DBReadingMaterialKidShare.material_id == material_id, DBReadingMaterialKidShare.kid_id == body.kidId
    ).first()
    if not existing:
        db.add(DBReadingMaterialKidShare(id=str(uuid4()), material_id=material_id, kid_id=body.kidId, shared_at=now()))
        db.commit()
    return ok({"shared": True})


@router.delete("/api/materials/{material_id}/share-student/{kid_id}")
def unshare_material_from_student(material_id: str, kid_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_teacher)):
    _get_teacher_material(db, user.id, material_id)
    db.query(DBReadingMaterialKidShare).filter(
        DBReadingMaterialKidShare.material_id == material_id, DBReadingMaterialKidShare.kid_id == kid_id
    ).delete(synchronize_session=False)
    db.commit()
    return ok({"unshared": True})


@router.get("/api/materials/shared")
def list_shared_materials(kidId: str = None, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    if user.role == "kid":
        kid = user
    elif user.role == "guardian":
        if not kidId:
            fail("kidId is required", 400)
        kid = db.query(DBUser).filter(
            DBUser.id == kidId, DBUser.role == "kid", DBUser.guardian_id == get_family_id(user)
        ).first()
        if not kid:
            fail("Child not found or not in your family", 404)
    else:
        fail("Forbidden", 403)

    class_ids = [
        m.class_id for m in db.query(DBClassMembership).filter(
            DBClassMembership.kid_id == kid.id, DBClassMembership.status == "approved"
        ).all()
    ]
    material_ids = set()
    if class_ids:
        material_ids.update(
            s.material_id for s in db.query(DBReadingMaterialShare).filter(DBReadingMaterialShare.class_id.in_(class_ids)).all()
        )
    material_ids.update(
        s.material_id for s in db.query(DBReadingMaterialKidShare).filter(DBReadingMaterialKidShare.kid_id == kid.id).all()
    )
    if not material_ids:
        return ok([])
    materials = db.query(DBReadingMaterial).filter(DBReadingMaterial.id.in_(material_ids)).order_by(
        DBReadingMaterial.created_at.desc()
    ).all()
    result = []
    for m in materials:
        submission = db.query(DBMaterialSubmission).filter(
            DBMaterialSubmission.material_id == m.id, DBMaterialSubmission.kid_id == kid.id
        ).first()
        result.append(material_for_kid_dict(m, submission=submission))
    return ok(result)


@router.post("/api/materials/{material_id}/submit")
def submit_material(material_id: str, body: MaterialSubmitBody, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    if user.role != "kid":
        fail("Only kids can submit answers", 403)
    material = db.query(DBReadingMaterial).filter(DBReadingMaterial.id == material_id).first()
    if not material:
        fail("Reading material not found", 404)
    if not material.questions:
        fail("This material has no questions to answer")
    existing = db.query(DBMaterialSubmission).filter(
        DBMaterialSubmission.material_id == material_id, DBMaterialSubmission.kid_id == user.id
    ).first()
    if existing:
        fail("You've already submitted answers for this material")

    questions = json.loads(material.questions)
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
            description=f"Reading material: {material.title} ({score}/{len(questions)} correct)", timestamp=now(),
        ))

    submission = DBMaterialSubmission(
        id=str(uuid4()), material_id=material_id, kid_id=user.id,
        answers=json.dumps(answers), score=score, points_earned=points, submitted_at=now(),
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    db.refresh(wallet)
    return ok({"material": material_for_kid_dict(material, submission=submission), "newBalance": wallet.balance})
