from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from deps import require_auth, require_guardian, require_kid
from helpers import get_family_id, now
from models import DBActivityLog, DBFamilyLearningSetting, DBLearningCompletion, DBLearningModule, DBTransaction, DBUser, DBWallet
from push_utils import notify_guardians_of_kid, notify_kid
from responses import fail, ok
from schemas import ActivityLogBody, LearningPointsUpdate, LearningVisibilityUpdate

router = APIRouter()

SECTION = "activity-ideas"

# Same "New" badge window as Future-Ready -- see future_ready.py's
# NEW_BADGE_DAYS for why 14 days.
NEW_BADGE_DAYS = 14

# Shares DBLearningModule / DBFamilyLearningSetting / DBLearningCompletion
# with Future-Ready (see models.py) -- same catalog/visibility shape, just a
# different `section` value. Unlike Future-Ready's instant quiz-based payout,
# a completion here is only ever created by a guardian approving a
# DBActivityLog (see submit_activity_log/approve_activity_log below) -- a
# kid self-reporting a tap with nothing to verify felt too easy to spam, so
# this borrows Chores' review-queue model instead. score/total stay fixed at
# 1/1 as a "done" sentinel: there's nothing to actually score.
ACTIVITY_SCORE = 1
ACTIVITY_TOTAL = 1


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
    rows = db.query(DBFamilyLearningSetting).filter(DBFamilyLearningSetting.family_id == family_id).all()
    return {r.module_id: r for r in rows}


def _effective_points(module: DBLearningModule, setting: DBFamilyLearningSetting = None) -> float:
    if setting is not None and setting.points_override is not None:
        return setting.points_override
    return module.points


def _kid_allowed(setting: DBFamilyLearningSetting, kid_id: str) -> bool:
    if not setting or setting.enabled != "1":
        return False
    if setting.enabled_kid_ids:
        return kid_id in setting.enabled_kid_ids.split(",")
    return True


def module_dict(m: DBLearningModule, points: float, enabled: bool = None, completed: bool = None,
                 enabled_kid_ids: list = None, completions: list = None, pending_logs: list = None,
                 my_pending_log: dict = None) -> dict:
    d = {
        "id": m.id, "section": m.section, "sectionTitle": m.section_title, "sectionEmoji": m.section_emoji,
        "category": m.topic, "categoryTitle": m.topic_title, "categoryEmoji": m.topic_emoji,
        "ageMin": m.age_min, "ageMax": m.age_max, "title": m.title, "points": points,
        "isNew": _is_new(m),
    }
    if enabled is not None:
        d["enabled"] = enabled
        d["enabledKidIds"] = enabled_kid_ids
        d["completions"] = completions or []
        d["pendingLogs"] = pending_logs or []  # awaiting this guardian's review
    if completed is not None:
        d["completed"] = completed
        d["pendingLog"] = my_pending_log  # this kid's own pending/rejected log, if any
    return d


def _log_dict(log: DBActivityLog, kid_name: str = None) -> dict:
    d = {"id": log.id, "moduleId": log.module_id, "note": log.note, "status": log.status, "submittedAt": log.submitted_at}
    if kid_name is not None:
        d["kidId"] = log.kid_id
        d["kidName"] = kid_name
    return d


@router.get("/api/activity-ideas")
def get_activity_modules(db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    modules = db.query(DBLearningModule).filter(
        DBLearningModule.is_active == "1", DBLearningModule.section == SECTION
    ).order_by(DBLearningModule.order_index).all()
    family_id = _family_id_for(user)
    settings = _family_settings(db, family_id)
    if user.role == "kid":
        completed_ids = {
            c.module_id for c in db.query(DBLearningCompletion).filter(DBLearningCompletion.kid_id == user.id).all()
        }
        # Most recent log per module, so a rejected-then-resubmitted log
        # doesn't leave a stale rejection showing after the new one lands.
        my_logs_by_module = {}
        for log in db.query(DBActivityLog).filter(DBActivityLog.kid_id == user.id).order_by(DBActivityLog.submitted_at).all():
            my_logs_by_module[log.module_id] = log
        return ok([
            module_dict(
                m, _effective_points(m, settings.get(m.id)), completed=m.id in completed_ids,
                my_pending_log=(
                    _log_dict(my_logs_by_module[m.id])
                    if m.id in my_logs_by_module and my_logs_by_module[m.id].status != "approved"
                    else None
                ),
            )
            for m in modules
            if _kid_allowed(settings.get(m.id), user.id)
        ])
    kids = db.query(DBUser).filter(DBUser.role == "kid", DBUser.guardian_id == family_id).all()
    kid_names = {k.id: k.name for k in kids}
    completions_by_module = {}
    pending_by_module = {}
    if kids:
        for c in db.query(DBLearningCompletion).filter(DBLearningCompletion.kid_id.in_(kid_names.keys())).all():
            completions_by_module.setdefault(c.module_id, []).append({
                "kidId": c.kid_id, "kidName": kid_names.get(c.kid_id, "?"),
                "completedAt": c.completed_at,
            })
        for log in db.query(DBActivityLog).filter(
            DBActivityLog.kid_id.in_(kid_names.keys()), DBActivityLog.status == "pending"
        ).order_by(DBActivityLog.submitted_at).all():
            pending_by_module.setdefault(log.module_id, []).append(_log_dict(log, kid_names.get(log.kid_id, "?")))
    return ok([
        module_dict(
            m, _effective_points(m, settings.get(m.id)),
            enabled=settings.get(m.id) is not None and settings[m.id].enabled == "1",
            enabled_kid_ids=settings[m.id].enabled_kid_ids.split(",") if (settings.get(m.id) and settings[m.id].enabled_kid_ids) else None,
            completions=completions_by_module.get(m.id),
            pending_logs=pending_by_module.get(m.id),
        )
        for m in modules
    ])


@router.get("/api/activity-ideas/{module_id}/content")
def get_activity_content(module_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    module = db.query(DBLearningModule).filter(
        DBLearningModule.id == module_id, DBLearningModule.is_active == "1", DBLearningModule.section == SECTION
    ).first()
    if not module: fail("Quest not found", 404)
    if not module.content: fail("This quest isn't ready yet.", 404)
    if user.role == "kid":
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


@router.put("/api/activity-ideas/{module_id}/visibility")
def set_activity_visibility(module_id: str, body: LearningVisibilityUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    module = db.query(DBLearningModule).filter(DBLearningModule.id == module_id, DBLearningModule.section == SECTION).first()
    if not module: fail("Quest not found", 404)

    family_id = get_family_id(user)
    setting = _get_or_create_setting(db, family_id, module_id)
    setting.enabled = "1" if body.enabled else "0"
    setting.enabled_kid_ids = ",".join(body.kidIds) if body.kidIds else None
    db.commit()
    return ok(module_dict(module, _effective_points(module, setting), enabled=body.enabled, enabled_kid_ids=body.kidIds or None))


@router.put("/api/activity-ideas/{module_id}/points")
def set_activity_points(module_id: str, body: LearningPointsUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    module = db.query(DBLearningModule).filter(DBLearningModule.id == module_id, DBLearningModule.section == SECTION).first()
    if not module: fail("Quest not found", 404)
    if body.points <= 0: fail("Points must be greater than 0")

    family_id = get_family_id(user)
    setting = _get_or_create_setting(db, family_id, module_id)
    setting.points_override = body.points
    db.commit()
    return ok(module_dict(module, body.points, enabled=setting.enabled == "1"))


@router.delete("/api/activity-ideas/{module_id}/completion/{kid_id}")
def reset_activity_completion(module_id: str, kid_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid", DBUser.guardian_id == family_id).first()
    if not kid: fail("Kid not found", 404)

    completion = db.query(DBLearningCompletion).filter(
        DBLearningCompletion.kid_id == kid_id, DBLearningCompletion.module_id == module_id
    ).first()
    if not completion: fail("This kid hasn't completed that quest", 404)

    db.delete(completion)
    db.commit()
    return ok({"reset": True})


@router.post("/api/activity-ideas/{module_id}/log")
def submit_activity_log(module_id: str, body: ActivityLogBody, db: Session = Depends(get_db), user: DBUser = Depends(require_kid)):
    module = db.query(DBLearningModule).filter(
        DBLearningModule.id == module_id, DBLearningModule.is_active == "1", DBLearningModule.section == SECTION
    ).first()
    if not module: fail("Quest not found", 404)
    family_id = _family_id_for(user)
    setting = db.query(DBFamilyLearningSetting).filter(
        DBFamilyLearningSetting.family_id == family_id, DBFamilyLearningSetting.module_id == module_id
    ).first()
    if not _kid_allowed(setting, user.id):
        fail("This isn't available yet -- ask your guardian to enable it", 403)

    note = body.note.strip()
    if len(note) < 3:
        fail("Tell your guardian a bit about what you did.")

    already = db.query(DBLearningCompletion).filter(
        DBLearningCompletion.kid_id == user.id, DBLearningCompletion.module_id == module_id
    ).first()
    if already:
        fail("You've already completed this one.")
    pending = db.query(DBActivityLog).filter(
        DBActivityLog.kid_id == user.id, DBActivityLog.module_id == module_id, DBActivityLog.status == "pending"
    ).first()
    if pending:
        fail("You've already sent this one to your guardian -- wait for them to review it.")

    log = DBActivityLog(id=str(uuid4()), kid_id=user.id, module_id=module_id, note=note, status="pending", submitted_at=now())
    db.add(log)
    db.commit()
    notify_guardians_of_kid(
        db, user,
        title="🧸 Quest logged!",
        body=f"{user.name} tried \"{module.title}\" ({module.topic_title}) -- tap to review.",
        data={"type": "activity_log_submitted", "logId": log.id},
    )
    return ok(_log_dict(log))


@router.post("/api/activity-ideas/logs/{log_id}/approve")
def approve_activity_log(log_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    log = db.query(DBActivityLog).filter(DBActivityLog.id == log_id).first()
    if not log: fail("Log not found", 404)
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == log.kid_id, DBUser.role == "kid", DBUser.guardian_id == family_id).first()
    if not kid: fail("Log not found", 404)
    if log.status != "pending": fail("Only pending logs can be approved")

    module = db.query(DBLearningModule).filter(DBLearningModule.id == log.module_id).first()
    if not module: fail("Quest not found", 404)
    setting = db.query(DBFamilyLearningSetting).filter(
        DBFamilyLearningSetting.family_id == family_id, DBFamilyLearningSetting.module_id == log.module_id
    ).first()
    points = _effective_points(module, setting)

    wallet = db.query(DBWallet).filter(DBWallet.kid_id == log.kid_id).first()
    if not wallet:
        wallet = DBWallet(kid_id=log.kid_id, balance=0)
        db.add(wallet)
        db.flush()

    wallet.balance += points
    db.add(DBLearningCompletion(
        kid_id=log.kid_id, module_id=log.module_id, score=ACTIVITY_SCORE, total=ACTIVITY_TOTAL,
        points_awarded=points, completed_at=now(),
    ))
    db.add(DBTransaction(id=str(uuid4()), kid_id=log.kid_id, type="earned",
                         amount=points, description=f"Completed quest: {module.topic_title} ({module.title})", timestamp=now()))
    log.status = "approved"
    log.reviewed_at = now()
    db.commit()
    db.refresh(wallet)
    notify_kid(
        db, log.kid_id,
        title="✅ Quest approved!",
        body=f"\"{module.title}\" was approved -- you earned {points:g} pts!",
        data={"type": "activity_log_approved", "moduleId": module.id},
    )
    return ok({"pointsAwarded": points, "newBalance": wallet.balance})


@router.post("/api/activity-ideas/logs/{log_id}/reject")
def reject_activity_log(log_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    log = db.query(DBActivityLog).filter(DBActivityLog.id == log_id).first()
    if not log: fail("Log not found", 404)
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == log.kid_id, DBUser.role == "kid", DBUser.guardian_id == family_id).first()
    if not kid: fail("Log not found", 404)
    if log.status != "pending": fail("Only pending logs can be rejected")

    log.status = "rejected"
    log.reviewed_at = now()
    db.commit()
    module = db.query(DBLearningModule).filter(DBLearningModule.id == log.module_id).first()
    notify_kid(
        db, log.kid_id,
        title="Quest needs another try",
        body=f"Your guardian asked you to try \"{module.title if module else log.module_id}\" again before it counts.",
        data={"type": "activity_log_rejected", "moduleId": log.module_id},
    )
    return ok({"rejected": True})
