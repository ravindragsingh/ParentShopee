from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from deps import require_auth, require_guardian, require_kid
from helpers import calculate_approx_age, get_family_id, now
from models import DBFamilyLearningSetting, DBLearningCompletion, DBLearningModule, DBTransaction, DBUser, DBWallet
from responses import fail, ok
from schemas import LearningCompleteBody, LearningPointsUpdate, LearningVisibilityUpdate

router = APIRouter()

# A kid must score at least this fraction correct on a module's quiz before
# it's marked complete and points are paid out -- retaking it for a better
# score is free and unlimited, but a low score just doesn't pay.
PASS_RATIO = 0.6


def _family_id_for(user: DBUser) -> str:
    if user.role == "kid":
        return user.guardian_id
    return get_family_id(user)


def _family_settings(db: Session, family_id: str) -> dict:
    """module_id -> that family's DBFamilyLearningSetting row, for every
    module they've either enabled or customized the points on."""
    rows = db.query(DBFamilyLearningSetting).filter(DBFamilyLearningSetting.family_id == family_id).all()
    return {r.module_id: r for r in rows}


def _effective_points(module: DBLearningModule, setting: DBFamilyLearningSetting = None) -> float:
    if setting is not None and setting.points_override is not None:
        return setting.points_override
    return module.points


def module_dict(m: DBLearningModule, points: float, enabled: bool = None, completed: bool = None) -> dict:
    d = {
        "id": m.id, "section": m.section, "sectionTitle": m.section_title, "sectionEmoji": m.section_emoji,
        "topic": m.topic, "topicTitle": m.topic_title, "topicEmoji": m.topic_emoji,
        "ageMin": m.age_min, "ageMax": m.age_max, "title": m.title, "points": points,
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
    settings = _family_settings(db, family_id)
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
            setting = settings.get(m.id)
            if not setting or setting.enabled != "1" or not (m.age_min <= kid_age <= m.age_max):
                continue
            by_topic[m.topic] = m
        return ok([
            module_dict(m, _effective_points(m, settings.get(m.id)), completed=m.id in completed_ids)
            for m in by_topic.values()
        ])
    # Guardians see the full catalog with every age band, its current
    # visibility, and its effective point value (their own override if set,
    # otherwise the catalog default) -- something to toggle and tune even
    # for bands they haven't enabled yet.
    return ok([
        module_dict(m, _effective_points(m, settings.get(m.id)), enabled=settings.get(m.id) is not None and settings[m.id].enabled == "1")
        for m in modules
    ])


def _get_or_create_setting(db: Session, family_id: str, module_id: str) -> DBFamilyLearningSetting:
    setting = db.query(DBFamilyLearningSetting).filter(
        DBFamilyLearningSetting.family_id == family_id, DBFamilyLearningSetting.module_id == module_id
    ).first()
    if not setting:
        setting = DBFamilyLearningSetting(family_id=family_id, module_id=module_id)
        db.add(setting)
    return setting


@router.put("/api/future-ready/{module_id}/visibility")
def set_learning_visibility(module_id: str, body: LearningVisibilityUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    module = db.query(DBLearningModule).filter(DBLearningModule.id == module_id).first()
    if not module: fail("Module not found", 404)

    family_id = get_family_id(user)
    setting = _get_or_create_setting(db, family_id, module_id)
    setting.enabled = "1" if body.enabled else "0"
    db.commit()
    return ok(module_dict(module, _effective_points(module, setting), enabled=body.enabled))


@router.put("/api/future-ready/{module_id}/points")
def set_learning_points(module_id: str, body: LearningPointsUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    module = db.query(DBLearningModule).filter(DBLearningModule.id == module_id).first()
    if not module: fail("Module not found", 404)
    if body.points <= 0: fail("Points must be greater than 0")

    family_id = get_family_id(user)
    setting = _get_or_create_setting(db, family_id, module_id)
    setting.points_override = body.points
    db.commit()
    return ok(module_dict(module, body.points, enabled=setting.enabled == "1"))


@router.post("/api/future-ready/{module_id}/complete")
def complete_learning_module(module_id: str, body: LearningCompleteBody, db: Session = Depends(get_db), user: DBUser = Depends(require_kid)):
    module = db.query(DBLearningModule).filter(DBLearningModule.id == module_id, DBLearningModule.is_active == "1").first()
    if not module: fail("Module not found", 404)
    family_id = _family_id_for(user)
    setting = db.query(DBFamilyLearningSetting).filter(
        DBFamilyLearningSetting.family_id == family_id, DBFamilyLearningSetting.module_id == module_id
    ).first()
    if not setting or setting.enabled != "1":
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

    points = _effective_points(module, setting)
    wallet = db.query(DBWallet).filter(DBWallet.kid_id == user.id).first()
    if not wallet:
        wallet = DBWallet(kid_id=user.id, balance=0)
        db.add(wallet)
        db.flush()

    wallet.balance += points
    db.add(DBLearningCompletion(
        kid_id=user.id, module_id=module_id, score=body.score, total=body.total,
        points_awarded=points, completed_at=now(),
    ))
    db.add(DBTransaction(id=str(uuid4()), kid_id=user.id, type="earned",
                         amount=points, description=f"Completed lesson: {module.topic_title} ({module.title})", timestamp=now()))
    db.commit()
    db.refresh(wallet)
    return ok({"passed": True, "alreadyCompleted": False, "pointsAwarded": points, "newBalance": wallet.balance})
