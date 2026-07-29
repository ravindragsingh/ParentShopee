from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from deps import require_auth, require_guardian, require_teacher
from helpers import get_family_id, material_dict, now
from models import DBClass, DBClassMembership, DBReadingMaterial, DBReadingMaterialShare, DBUser
from responses import fail, ok
from schemas import MaterialCreateBody, MaterialShareBody

router = APIRouter()


def _get_teacher_material(db: Session, teacher_id: str, material_id: str) -> DBReadingMaterial:
    m = db.query(DBReadingMaterial).filter(DBReadingMaterial.id == material_id, DBReadingMaterial.teacher_id == teacher_id).first()
    if not m:
        fail("Reading material not found", 404)
    return m


@router.post("/api/materials")
def create_material(body: MaterialCreateBody, db: Session = Depends(get_db), user: DBUser = Depends(require_teacher)):
    if len(body.title.strip()) < 2:
        fail("Title must be at least 2 characters")
    material = DBReadingMaterial(
        id=str(uuid4()), teacher_id=user.id, title=body.title.strip(),
        description=(body.description or "").strip(), url=(body.url or "").strip() or None,
        topic=(body.topic or "").strip() or None, created_at=now(),
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return ok(material_dict(material), 201)


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
    result = []
    for m in materials:
        shares = db.query(DBReadingMaterialShare).filter(DBReadingMaterialShare.material_id == m.id).all()
        result.append(material_dict(m, shared_class_ids=[s.class_id for s in shares]))
    return ok(result)


@router.delete("/api/materials/{material_id}")
def delete_material(material_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_teacher)):
    material = _get_teacher_material(db, user.id, material_id)
    db.query(DBReadingMaterialShare).filter(DBReadingMaterialShare.material_id == material_id).delete(synchronize_session=False)
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
    if not class_ids:
        return ok([])

    shares = db.query(DBReadingMaterialShare).filter(DBReadingMaterialShare.class_id.in_(class_ids)).all()
    material_ids = list({s.material_id for s in shares})
    if not material_ids:
        return ok([])
    materials = db.query(DBReadingMaterial).filter(DBReadingMaterial.id.in_(material_ids)).order_by(
        DBReadingMaterial.created_at.desc()
    ).all()
    return ok([material_dict(m) for m in materials])
