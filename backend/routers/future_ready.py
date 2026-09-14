from datetime import datetime, timedelta, timezone
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

# How long a module keeps showing a "New" badge after it's first added to
# the catalog (see created_at on DBLearningModule).
NEW_BADGE_DAYS = 14


def _is_new(m: DBLearningModule) -> bool:
    if not m.created_at:
        return False
    try:
        created = datetime.fromisoformat(m.created_at)
    except ValueError:
        return False
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - created) < timedelta(days=NEW_BADGE_DAYS)


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


def _kid_allowed(setting: DBFamilyLearningSetting, kid_id: str) -> bool:
    """Whether this specific kid can see/use a module their family has a
    setting row for -- enabled at the family level is necessary but not
    sufficient if the guardian narrowed it down to specific kids."""
    if not setting or setting.enabled != "1":
        return False
    if setting.enabled_kid_ids:
        return kid_id in setting.enabled_kid_ids.split(",")
    return True


def _age_gap(m: DBLearningModule, kid_age: int) -> int:
    """0 if the kid's actual age falls within this module's band, otherwise
    how many years outside it they are. Age bands are just a starting
    default, not a hard gate -- a guardian can enable a band meant for a
    different age (e.g. more advanced content for a younger kid), and that
    explicit choice should win over the automatic age match."""
    if m.age_min <= kid_age <= m.age_max:
        return 0
    return min(abs(kid_age - m.age_min), abs(kid_age - m.age_max))


def module_dict(m: DBLearningModule, points: float, enabled: bool = None, completed: bool = None,
                 enabled_kid_ids: list = None, completions: list = None) -> dict:
    d = {
        "id": m.id, "section": m.section, "sectionTitle": m.section_title, "sectionEmoji": m.section_emoji,
        "topic": m.topic, "topicTitle": m.topic_title, "topicEmoji": m.topic_emoji,
        "ageMin": m.age_min, "ageMax": m.age_max, "title": m.title, "points": points,
        "isNew": _is_new(m),
    }
    if enabled is not None:
        d["enabled"] = enabled
        d["enabledKidIds"] = enabled_kid_ids  # None = every kid in the family
        d["completions"] = completions or []  # which kids have completed this, for the guardian's "redo" control
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
        # module per topic, so the UI can show "Investing for Kids" as a
        # single thing to do rather than four age options they'd have to
        # pick between themselves. Among the bands a guardian has actually
        # enabled for this kid, prefer whichever one matches their real age
        # -- but a guardian enabling a band for a different age (deliberately
        # giving a younger kid more advanced content, say) is a real choice
        # that should be respected, not silently hidden, so it's the
        # fallback rather than being filtered out entirely.
        completed_ids = {
            c.module_id for c in db.query(DBLearningCompletion).filter(DBLearningCompletion.kid_id == user.id).all()
        }
        kid_age = calculate_approx_age(user.birth_month, user.birth_year) if (user.birth_month and user.birth_year) else None
        if kid_age is None:
            return ok([])
        by_topic = {}
        for m in modules:
            setting = settings.get(m.id)
            if not _kid_allowed(setting, user.id):
                continue
            current = by_topic.get(m.topic)
            if current is None or _age_gap(m, kid_age) < _age_gap(current, kid_age):
                by_topic[m.topic] = m
        return ok([
            module_dict(m, _effective_points(m, settings.get(m.id)), completed=m.id in completed_ids)
            for m in by_topic.values()
        ])
    # Guardians see the full catalog with every age band, its current
    # visibility, and its effective point value (their own override if set,
    # otherwise the catalog default) -- something to toggle and tune even
    # for bands they haven't enabled yet. They also see who's already
    # completed each one, so they can offer a redo.
    kids = db.query(DBUser).filter(DBUser.role == "kid", DBUser.guardian_id == family_id).all()
    kid_names = {k.id: k.name for k in kids}
    completions_by_module = {}
    if kids:
        for c in db.query(DBLearningCompletion).filter(DBLearningCompletion.kid_id.in_(kid_names.keys())).all():
            completions_by_module.setdefault(c.module_id, []).append({
                "kidId": c.kid_id, "kidName": kid_names.get(c.kid_id, "?"),
                "score": c.score, "total": c.total, "pointsAwarded": c.points_awarded, "completedAt": c.completed_at,
            })
    return ok([
        module_dict(
            m, _effective_points(m, settings.get(m.id)),
            enabled=settings.get(m.id) is not None and settings[m.id].enabled == "1",
            enabled_kid_ids=settings[m.id].enabled_kid_ids.split(",") if (settings.get(m.id) and settings[m.id].enabled_kid_ids) else None,
            completions=completions_by_module.get(m.id),
        )
        for m in modules
    ])


@router.get("/api/future-ready/{module_id}/content")
def get_learning_content(module_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    module = db.query(DBLearningModule).filter(DBLearningModule.id == module_id, DBLearningModule.is_active == "1").first()
    if not module: fail("Module not found", 404)
    if not module.content: fail("This lesson isn't ready yet.", 404)
    if user.role == "kid":
        # Guardians can preview any module's content before enabling it, but a
        # kid should only ever be able to fetch content for something their
        # family has actually turned on -- same rule as /complete enforces.
        family_id = _family_id_for(user)
        setting = db.query(DBFamilyLearningSetting).filter(
            DBFamilyLearningSetting.family_id == family_id, DBFamilyLearningSetting.module_id == module_id
        ).first()
        if not _kid_allowed(setting, user.id):
            fail("This isn't available yet -- ask your guardian to enable it", 403)
    return ok(module.content)


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
    # None/empty kidIds means "every kid in the family" -- stored as NULL so a
    # kid added later is automatically included, rather than needing the
    # guardian to come back and add them to a stale explicit list.
    setting.enabled_kid_ids = ",".join(body.kidIds) if body.kidIds else None
    db.commit()
    return ok(module_dict(module, _effective_points(module, setting), enabled=body.enabled, enabled_kid_ids=body.kidIds or None))


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


@router.delete("/api/future-ready/{module_id}/completion/{kid_id}")
def reset_learning_completion(module_id: str, kid_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    """Lets a guardian clear a kid's completion of a module so they can redo
    it -- the points already earned the first time stay in the kid's
    wallet; passing again just earns a fresh payout, the same as if they'd
    never completed it. Doesn't touch enabled/visibility at all."""
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid", DBUser.guardian_id == family_id).first()
    if not kid: fail("Kid not found", 404)

    completion = db.query(DBLearningCompletion).filter(
        DBLearningCompletion.kid_id == kid_id, DBLearningCompletion.module_id == module_id
    ).first()
    if not completion: fail("This kid hasn't completed that module", 404)

    db.delete(completion)
    db.commit()
    return ok({"reset": True})


@router.post("/api/future-ready/{module_id}/complete")
def complete_learning_module(module_id: str, body: LearningCompleteBody, db: Session = Depends(get_db), user: DBUser = Depends(require_kid)):
    module = db.query(DBLearningModule).filter(DBLearningModule.id == module_id, DBLearningModule.is_active == "1").first()
    if not module: fail("Module not found", 404)
    family_id = _family_id_for(user)
    setting = db.query(DBFamilyLearningSetting).filter(
        DBFamilyLearningSetting.family_id == family_id, DBFamilyLearningSetting.module_id == module_id
    ).first()
    if not _kid_allowed(setting, user.id):
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
