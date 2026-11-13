from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from deps import require_auth, require_guardian, require_kid
from helpers import get_family_id, now
from models import (
    DBFamilyLearningSetting, DBLearningModule, DBQuestActivityCompletion, DBQuestLog, DBTransaction, DBUser, DBWallet,
)
from push_utils import notify_guardians_of_kid, notify_kid
from responses import fail, ok
from schemas import LearningPointsUpdate, LearningVisibilityUpdate, QuestLogBody

router = APIRouter()

SECTION = "quest"

# Same "New" badge window as Future-Ready -- see future_ready.py's
# NEW_BADGE_DAYS for why 14 days.
NEW_BADGE_DAYS = 14

# Shares DBLearningModule / DBFamilyLearningSetting with Future-Ready (see
# models.py) -- same catalog/visibility shape, just a different `section`
# value. Completions use their own DBQuestActivityCompletion table instead
# of Future-Ready's DBLearningCompletion, since each quest module bundles
# several independently-loggable activities (see module_dict/_activities)
# rather than one pass/fail outcome for the whole module. A completion here
# is only ever created by a guardian approving a DBQuestLog (see
# submit_quest_log/approve_quest_log below) -- a kid self-reporting a tap
# with nothing to verify felt too easy to spam, so this borrows Chores'
# review-queue model instead.


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


def _activities(m: DBLearningModule) -> list:
    return (m.content or {}).get("activities", []) if m.content else []


def _activity_points(m: DBLearningModule, setting: DBFamilyLearningSetting, activities: list, index: int) -> float:
    """An activity's own `points` (set via the admin content editor) wins if
    present; otherwise the module's effective points (its catalog default,
    or a guardian's override) are split evenly across however many
    activities it has -- so re-authoring an old single-payout module into
    several loggable activities doesn't silently change the total a kid can
    earn from it unless an admin deliberately sets per-activity values."""
    if index < len(activities):
        raw = activities[index].get("points")
        if raw is not None:
            try:
                return float(raw)
            except (TypeError, ValueError):
                pass
    base = _effective_points(m, setting)
    n = len(activities) or 1
    return round(base / n, 1)


def module_dict(m: DBLearningModule, points: float, setting: DBFamilyLearningSetting = None, enabled: bool = None,
                 enabled_kid_ids: list = None, completed_activity_indices: list = None,
                 pending_activity_logs: list = None, activity_completions: list = None,
                 activity_pending_logs: list = None) -> dict:
    activities = _activities(m)
    d = {
        "id": m.id, "section": m.section, "sectionTitle": m.section_title, "sectionEmoji": m.section_emoji,
        "category": m.topic, "categoryTitle": m.topic_title, "categoryEmoji": m.topic_emoji,
        "ageMin": m.age_min, "ageMax": m.age_max, "title": m.title, "points": points,
        "isNew": _is_new(m),
        "activityCount": len(activities),
        "activityPoints": [_activity_points(m, setting, activities, i) for i in range(len(activities))],
        "activityTitles": [a.get("title") or f"Activity {i + 1}" for i, a in enumerate(activities)],
    }
    if enabled is not None:
        d["enabled"] = enabled
        d["enabledKidIds"] = enabled_kid_ids
        # Index-aligned with activities[] -- activityCompletions[i] / activityPendingLogs[i]
        # is the list of kids who've completed / have a pending log for that one activity.
        d["activityCompletions"] = activity_completions if activity_completions is not None else [[] for _ in activities]
        d["activityPendingLogs"] = activity_pending_logs if activity_pending_logs is not None else [[] for _ in activities]
    if completed_activity_indices is not None:
        d["completedActivityIndices"] = completed_activity_indices
        # Index-aligned with activities[] -- this kid's own pending/rejected log for that activity, or null.
        d["pendingActivityLogs"] = pending_activity_logs if pending_activity_logs is not None else [None] * len(activities)
    return d


def _log_dict(log: DBQuestLog, kid_name: str = None) -> dict:
    d = {
        "id": log.id, "moduleId": log.module_id, "activityIndex": log.activity_index,
        "note": log.note, "status": log.status, "submittedAt": log.submitted_at,
    }
    if kid_name is not None:
        d["kidId"] = log.kid_id
        d["kidName"] = kid_name
    return d


@router.get("/api/quests")
def get_quests(db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    modules = db.query(DBLearningModule).filter(
        DBLearningModule.is_active == "1", DBLearningModule.status == "published", DBLearningModule.section == SECTION
    ).order_by(DBLearningModule.order_index).all()
    family_id = _family_id_for(user)
    settings = _family_settings(db, family_id)
    if user.role == "kid":
        completed_by_module = {}
        for c in db.query(DBQuestActivityCompletion).filter(DBQuestActivityCompletion.kid_id == user.id).all():
            completed_by_module.setdefault(c.module_id, []).append(c.activity_index)
        # Most recent log per (module, activity), so a rejected-then-resubmitted
        # log doesn't leave a stale rejection showing after the new one lands.
        my_logs_by_module = {}
        for log in db.query(DBQuestLog).filter(DBQuestLog.kid_id == user.id).order_by(DBQuestLog.submitted_at).all():
            if log.activity_index is None:
                continue  # predates per-activity tracking -- nothing to attribute it to
            my_logs_by_module.setdefault(log.module_id, {})[log.activity_index] = log
        result = []
        for m in modules:
            if not _kid_allowed(settings.get(m.id), user.id):
                continue
            activities = _activities(m)
            logs_for_module = my_logs_by_module.get(m.id, {})
            pending_logs = [
                _log_dict(logs_for_module[i]) if logs_for_module.get(i) and logs_for_module[i].status != "approved" else None
                for i in range(len(activities))
            ]
            result.append(module_dict(
                m, _effective_points(m, settings.get(m.id)), setting=settings.get(m.id),
                completed_activity_indices=completed_by_module.get(m.id, []),
                pending_activity_logs=pending_logs,
            ))
        return ok(result)
    kids = db.query(DBUser).filter(DBUser.role == "kid", DBUser.guardian_id == family_id).all()
    kid_names = {k.id: k.name for k in kids}
    activity_completions_by_module = {}
    activity_pending_by_module = {}
    if kids:
        for c in db.query(DBQuestActivityCompletion).filter(DBQuestActivityCompletion.kid_id.in_(kid_names.keys())).all():
            activity_completions_by_module.setdefault(c.module_id, {}).setdefault(c.activity_index, []).append({
                "kidId": c.kid_id, "kidName": kid_names.get(c.kid_id, "?"),
                "completedAt": c.completed_at, "pointsAwarded": c.points_awarded,
            })
        for log in db.query(DBQuestLog).filter(
            DBQuestLog.kid_id.in_(kid_names.keys()), DBQuestLog.status == "pending"
        ).order_by(DBQuestLog.submitted_at).all():
            if log.activity_index is None:
                continue
            activity_pending_by_module.setdefault(log.module_id, {}).setdefault(log.activity_index, []).append(
                _log_dict(log, kid_names.get(log.kid_id, "?"))
            )
    result = []
    for m in modules:
        activities = _activities(m)
        setting = settings.get(m.id)
        comp_map = activity_completions_by_module.get(m.id, {})
        pend_map = activity_pending_by_module.get(m.id, {})
        result.append(module_dict(
            m, _effective_points(m, setting), setting=setting,
            enabled=setting is not None and setting.enabled == "1",
            enabled_kid_ids=setting.enabled_kid_ids.split(",") if (setting and setting.enabled_kid_ids) else None,
            activity_completions=[comp_map.get(i, []) for i in range(len(activities))],
            activity_pending_logs=[pend_map.get(i, []) for i in range(len(activities))],
        ))
    return ok(result)


@router.get("/api/quests/{module_id}/content")
def get_quest_content(module_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    module = db.query(DBLearningModule).filter(
        DBLearningModule.id == module_id, DBLearningModule.is_active == "1", DBLearningModule.status == "published",
        DBLearningModule.section == SECTION
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


@router.put("/api/quests/{module_id}/visibility")
def set_quest_visibility(module_id: str, body: LearningVisibilityUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    module = db.query(DBLearningModule).filter(DBLearningModule.id == module_id, DBLearningModule.section == SECTION).first()
    if not module: fail("Quest not found", 404)

    family_id = get_family_id(user)
    setting = _get_or_create_setting(db, family_id, module_id)
    setting.enabled = "1" if body.enabled else "0"
    setting.enabled_kid_ids = ",".join(body.kidIds) if body.kidIds else None
    db.commit()
    return ok(module_dict(module, _effective_points(module, setting), setting=setting, enabled=body.enabled, enabled_kid_ids=body.kidIds or None))


@router.put("/api/quests/{module_id}/points")
def set_quest_points(module_id: str, body: LearningPointsUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    module = db.query(DBLearningModule).filter(DBLearningModule.id == module_id, DBLearningModule.section == SECTION).first()
    if not module: fail("Quest not found", 404)
    if body.points <= 0: fail("Points must be greater than 0")

    family_id = get_family_id(user)
    setting = _get_or_create_setting(db, family_id, module_id)
    setting.points_override = body.points
    db.commit()
    return ok(module_dict(module, body.points, setting=setting, enabled=setting.enabled == "1"))


@router.delete("/api/quests/{module_id}/completion/{kid_id}")
def reset_quest_completion(module_id: str, kid_id: str, activity_index: int, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid", DBUser.guardian_id == family_id).first()
    if not kid: fail("Kid not found", 404)

    completion = db.query(DBQuestActivityCompletion).filter(
        DBQuestActivityCompletion.kid_id == kid_id, DBQuestActivityCompletion.module_id == module_id,
        DBQuestActivityCompletion.activity_index == activity_index,
    ).first()
    if not completion: fail("This kid hasn't completed that activity", 404)

    db.delete(completion)
    db.commit()
    return ok({"reset": True})


@router.post("/api/quests/{module_id}/log")
def submit_quest_log(module_id: str, body: QuestLogBody, db: Session = Depends(get_db), user: DBUser = Depends(require_kid)):
    module = db.query(DBLearningModule).filter(
        DBLearningModule.id == module_id, DBLearningModule.is_active == "1", DBLearningModule.status == "published",
        DBLearningModule.section == SECTION
    ).first()
    if not module: fail("Quest not found", 404)
    activities = _activities(module)
    if body.activityIndex < 0 or body.activityIndex >= len(activities):
        fail("Invalid activity", 404)
    family_id = _family_id_for(user)
    setting = db.query(DBFamilyLearningSetting).filter(
        DBFamilyLearningSetting.family_id == family_id, DBFamilyLearningSetting.module_id == module_id
    ).first()
    if not _kid_allowed(setting, user.id):
        fail("This isn't available yet -- ask your guardian to enable it", 403)

    note = body.note.strip()
    if len(note) < 3:
        fail("Tell your guardian a bit about what you did.")

    already = db.query(DBQuestActivityCompletion).filter(
        DBQuestActivityCompletion.kid_id == user.id, DBQuestActivityCompletion.module_id == module_id,
        DBQuestActivityCompletion.activity_index == body.activityIndex,
    ).first()
    if already:
        fail("You've already completed this one.")
    pending = db.query(DBQuestLog).filter(
        DBQuestLog.kid_id == user.id, DBQuestLog.module_id == module_id,
        DBQuestLog.activity_index == body.activityIndex, DBQuestLog.status == "pending",
    ).first()
    if pending:
        fail("You've already sent this one to your guardian -- wait for them to review it.")

    log = DBQuestLog(
        id=str(uuid4()), kid_id=user.id, module_id=module_id, activity_index=body.activityIndex,
        note=note, status="pending", submitted_at=now(),
    )
    db.add(log)
    db.commit()
    activity_title = activities[body.activityIndex].get("title") or module.title
    notify_guardians_of_kid(
        db, user,
        title="🧸 Quest logged!",
        body=f"{user.name} tried \"{activity_title}\" ({module.topic_title}) -- tap to review.",
        data={"type": "quest_log_submitted", "logId": log.id},
    )
    return ok(_log_dict(log))


@router.post("/api/quests/logs/{log_id}/approve")
def approve_quest_log(log_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    log = db.query(DBQuestLog).filter(DBQuestLog.id == log_id).first()
    if not log: fail("Log not found", 404)
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == log.kid_id, DBUser.role == "kid", DBUser.guardian_id == family_id).first()
    if not kid: fail("Log not found", 404)
    if log.status != "pending": fail("Only pending logs can be approved")
    if log.activity_index is None:
        fail("This log predates per-activity tracking and can no longer be approved", 400)

    module = db.query(DBLearningModule).filter(DBLearningModule.id == log.module_id).first()
    if not module: fail("Quest not found", 404)
    activities = _activities(module)
    if log.activity_index >= len(activities):
        fail("This activity no longer exists", 404)
    setting = db.query(DBFamilyLearningSetting).filter(
        DBFamilyLearningSetting.family_id == family_id, DBFamilyLearningSetting.module_id == log.module_id
    ).first()
    points = _activity_points(module, setting, activities, log.activity_index)
    activity_title = activities[log.activity_index].get("title") or module.title

    wallet = db.query(DBWallet).filter(DBWallet.kid_id == log.kid_id).first()
    if not wallet:
        wallet = DBWallet(kid_id=log.kid_id, balance=0)
        db.add(wallet)
        db.flush()

    wallet.balance += points
    db.add(DBQuestActivityCompletion(
        kid_id=log.kid_id, module_id=log.module_id, activity_index=log.activity_index,
        points_awarded=points, completed_at=now(),
    ))
    db.add(DBTransaction(id=str(uuid4()), kid_id=log.kid_id, type="earned",
                         amount=points, description=f"Completed activity: {activity_title} ({module.topic_title})", timestamp=now()))
    log.status = "approved"
    log.reviewed_at = now()
    db.commit()
    db.refresh(wallet)
    notify_kid(
        db, log.kid_id,
        title="✅ Quest approved!",
        body=f"\"{activity_title}\" was approved -- you earned {points:g} pts!",
        data={"type": "quest_log_approved", "moduleId": module.id, "activityIndex": log.activity_index},
    )
    return ok({"pointsAwarded": points, "newBalance": wallet.balance})


@router.post("/api/quests/logs/{log_id}/reject")
def reject_quest_log(log_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    log = db.query(DBQuestLog).filter(DBQuestLog.id == log_id).first()
    if not log: fail("Log not found", 404)
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == log.kid_id, DBUser.role == "kid", DBUser.guardian_id == family_id).first()
    if not kid: fail("Log not found", 404)
    if log.status != "pending": fail("Only pending logs can be rejected")

    log.status = "rejected"
    log.reviewed_at = now()
    db.commit()
    module = db.query(DBLearningModule).filter(DBLearningModule.id == log.module_id).first()
    activities = _activities(module) if module else []
    label = (
        activities[log.activity_index].get("title")
        if module and log.activity_index is not None and log.activity_index < len(activities)
        else None
    ) or (module.title if module else log.module_id)
    notify_kid(
        db, log.kid_id,
        title="Quest needs another try",
        body=f"Your guardian asked you to try \"{label}\" again before it counts.",
        data={"type": "quest_log_rejected", "moduleId": log.module_id, "activityIndex": log.activity_index},
    )
    return ok({"rejected": True})
