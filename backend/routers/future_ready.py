from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from deps import require_auth, require_guardian, require_kid
from helpers import calculate_approx_age, get_family_id, now
from models import DBFamilyLearningSetting, DBLearningCompletion, DBLearningModule, DBTransaction, DBUser, DBWallet
from responses import fail, ok
from schemas import LearningCompleteBody, LearningVisibilityUpdate

router = APIRouter()

# A kid must score at least this fraction correct on a module's quiz before
# it's marked complete and points are paid out -- retaking it for a better
# score is free and unlimited, but a low score just doesn't pay.
PASS_RATIO = 0.6


def _family_id_for(user: DBUser) -> str:
    if user.role == "kid":
        return user.guardian_id
    return get_family_id(user)


def _enabled_module_ids(db: Session, family_id: str) -> set:
    rows = db.query(DBFamilyLearningSetting).filter(
        DBFamilyLearningSetting.family_id == family_id, DBFamilyLearningSetting.enabled == "1"
    ).all()
    return {r.module_id for r in rows}


def module_dict(m: DBLearningModule, enabled: bool = None, completed: bool = None) -> dict:
    d = {
        "id": m.id, "section": m.section, "sectionTitle": m.section_title, "sectionEmoji": m.section_emoji,
        "topic": m.topic, "topicTitle": m.topic_title, "topicEmoji": m.topic_emoji,
        "ageMin": m.age_min, "ageMax": m.age_max, "title": m.title, "points": m.points,
    }
    if enabled is not None:
        d["enabled"] = enabled
    if completed is not None:
        d["completed"] = completed
    return d


@router.get("/api/future-ready")
def get_learning_modules(db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    modules = db.query(DBLearningModule).filter(DBLearningModule.is_active == "1").order_by(DBLearningModule.order_index).all()
    family_id = _family_id_for(user)
    enabled_ids = _enabled_module_ids(db, family_id)
    if user.role == "kid":
        # Age bands are a guardian-only concept -- a kid sees exactly one
        # module per topic, whichever age band actually covers them, so the
        # UI can show "Investing for Kids" as a single thing to do rather
        # than four age options they'd have to pick between themselves.
        completed_ids = {
            c.module_id for c in db.query(DBLearningCompletion).filter(DBLearningCompletion.kid_id == user.id).all()
        }
        kid_age = calculate_approx_age(user.birth_month, user.birth_year) if (user.birth_month and user.birth_year) else None
        if kid_age is None:
            return ok([])
        by_topic = {}
        for m in modules:
            if m.id not in enabled_ids or not (m.age_min <= kid_age <= m.age_max):
                continue
            by_topic[m.topic] = m
        return ok([module_dict(m, completed=m.id in completed_ids) for m in by_topic.values()])
    # Guardians see the full catalog with every age band and its current
    # visibility, so they have something to toggle even for bands they
    # haven't enabled yet.
    return ok([module_dict(m, enabled=m.id in enabled_ids) for m in modules])


@router.put("/api/future-ready/{module_id}/visibility")
def set_learning_visibility(module_id: str, body: LearningVisibilityUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    module = db.query(DBLearningModule).filter(DBLearningModule.id == module_id).first()
    if not module: fail("Module not found", 404)

    family_id = get_family_id(user)
    setting = db.query(DBFamilyLearningSetting).filter(
        DBFamilyLearningSetting.family_id == family_id, DBFamilyLearningSetting.module_id == module_id
    ).first()
    if not setting:
        setting = DBFamilyLearningSetting(family_id=family_id, module_id=module_id)
        db.add(setting)
    setting.enabled = "1" if body.enabled else "0"
    db.commit()
    return ok(module_dict(module, enabled=body.enabled))


@router.post("/api/future-ready/{module_id}/complete")
def complete_learning_module(module_id: str, body: LearningCompleteBody, db: Session = Depends(get_db), user: DBUser = Depends(require_kid)):
    module = db.query(DBLearningModule).filter(DBLearningModule.id == module_id, DBLearningModule.is_active == "1").first()
    if not module: fail("Module not found", 404)
    if module.id not in _enabled_module_ids(db, _family_id_for(user)):
        fail("This isn't available yet -- ask your guardian to enable it", 403)
    if body.total <= 0 or body.score < 0 or body.score > body.total:
        fail("Invalid score")

    if (body.score / body.total) < PASS_RATIO:
        return ok({"passed": False, "alreadyCompleted": False, "pointsAwarded": 0})

    existing = db.query(DBLearningCompletion).filter(
        DBLearningCompletion.kid_id == user.id, DBLearningCompletion.module_id == module_id
    ).first()
    if existing:
        return ok({"passed": True, "alreadyCompleted": True, "pointsAwarded": 0})

    wallet = db.query(DBWallet).filter(DBWallet.kid_id == user.id).first()
    if not wallet:
        wallet = DBWallet(kid_id=user.id, balance=0)
        db.add(wallet)
        db.flush()

    wallet.balance += module.points
    db.add(DBLearningCompletion(
        kid_id=user.id, module_id=module_id, score=body.score, total=body.total,
        points_awarded=module.points, completed_at=now(),
    ))
    db.add(DBTransaction(id=str(uuid4()), kid_id=user.id, type="earned",
                         amount=module.points, description=f"Completed lesson: {module.topic_title} ({module.title})", timestamp=now()))
    db.commit()
    db.refresh(wallet)
    return ok({"passed": True, "alreadyCompleted": False, "pointsAwarded": module.points, "newBalance": wallet.balance})
