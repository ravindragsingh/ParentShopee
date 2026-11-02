from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from deps import require_admin
from models import DBContentTopic, DBLearningModule, DBUser
from responses import fail, ok
from schemas import (
    AdminModuleContentUpdate, AdminModuleCreate, AdminModuleMetaUpdate, AdminModuleStatusUpdate,
    AdminTopicCreate, AdminTopicUpdate,
)
from seed import AGE_BANDS, QUEST_AGE_BANDS

router = APIRouter()

# Age bands stay fixed/backend-defined for now (not admin-editable) -- a new
# module an admin creates picks one of these via a dropdown. Exposed here so
# the admin UI doesn't hardcode its own copy of what seed.py already defines.
_FUTURE_READY_AGE_BANDS = [{"ageMin": mn, "ageMax": mx, "defaultPoints": pts} for mn, mx, pts in AGE_BANDS]
_QUEST_AGE_BAND_LIST = [{"ageMin": mn, "ageMax": mx} for mn, mx in QUEST_AGE_BANDS]


def _topic_dict(t: DBContentTopic) -> dict:
    return {
        "id": t.id, "section": t.section, "title": t.title, "emoji": t.emoji,
        "orderIndex": t.order_index, "isActive": t.is_active == "1",
    }


def _module_dict(m: DBLearningModule, with_content: bool = False) -> dict:
    d = {
        "id": m.id, "section": m.section, "topic": m.topic, "topicTitle": m.topic_title,
        "ageMin": m.age_min, "ageMax": m.age_max, "title": m.title, "points": m.points,
        "orderIndex": m.order_index, "isActive": m.is_active == "1", "status": m.status,
        "isPremium": m.is_premium == "1",
    }
    if with_content:
        d["content"] = m.content
    return d


@router.get("/api/admin/content/age-bands")
def admin_get_age_bands(section: str, user: DBUser = Depends(require_admin)):
    if section in ("quest", "reading-log"):
        return ok(_QUEST_AGE_BAND_LIST)
    return ok(_FUTURE_READY_AGE_BANDS)


@router.get("/api/admin/content/topics")
def admin_list_topics(section: str = None, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    q = db.query(DBContentTopic)
    if section:
        q = q.filter(DBContentTopic.section == section)
    topics = q.order_by(DBContentTopic.order_index).all()
    return ok([_topic_dict(t) for t in topics])


@router.post("/api/admin/content/topics")
def admin_create_topic(body: AdminTopicCreate, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    if body.section not in ("future-ready", "quest", "reading-log"):
        fail("section must be 'future-ready', 'quest', or 'reading-log'")
    if db.query(DBContentTopic).get(body.id):
        fail("A topic with this id already exists", 409)
    max_order = db.query(DBContentTopic).filter(DBContentTopic.section == body.section).count()
    topic = DBContentTopic(
        id=body.id, section=body.section, title=body.title, emoji=body.emoji or "📘", order_index=max_order + 1,
    )
    db.add(topic)
    db.commit()
    return ok(_topic_dict(topic), 201)


@router.put("/api/admin/content/topics/{topic_id}")
def admin_update_topic(topic_id: str, body: AdminTopicUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    topic = db.query(DBContentTopic).get(topic_id)
    if not topic: fail("Topic not found", 404)
    if body.title is not None: topic.title = body.title
    if body.emoji is not None: topic.emoji = body.emoji
    if body.orderIndex is not None: topic.order_index = body.orderIndex
    if body.isActive is not None: topic.is_active = "1" if body.isActive else "0"
    db.commit()
    return ok(_topic_dict(topic))


@router.delete("/api/admin/content/topics/{topic_id}")
def admin_deactivate_topic(topic_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    topic = db.query(DBContentTopic).get(topic_id)
    if not topic: fail("Topic not found", 404)
    has_active_modules = db.query(DBLearningModule).filter(
        DBLearningModule.topic == topic_id, DBLearningModule.is_active == "1",
    ).first()
    if has_active_modules:
        fail("Deactivate or remove this topic's modules first", 409)
    topic.is_active = "0"
    db.commit()
    return ok({"deactivated": True})


@router.get("/api/admin/content/modules")
def admin_list_modules(topic: str, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    modules = db.query(DBLearningModule).filter(
        DBLearningModule.topic == topic,
    ).order_by(DBLearningModule.order_index).all()
    return ok([_module_dict(m) for m in modules])


@router.post("/api/admin/content/modules")
def admin_create_module(body: AdminModuleCreate, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    if body.section not in ("future-ready", "quest", "reading-log"):
        fail("section must be 'future-ready', 'quest', or 'reading-log'")
    if db.query(DBLearningModule).get(body.id):
        fail("A module with this id already exists", 409)
    topic = db.query(DBContentTopic).get(body.topic)
    if not topic or topic.section != body.section:
        fail("Topic not found for this section", 404)
    if body.points <= 0:
        fail("Points must be greater than 0")

    max_order = db.query(DBLearningModule).filter(DBLearningModule.topic == body.topic).count()
    module = DBLearningModule(
        id=body.id,
        section=body.section,
        section_title={"future-ready": "Future-Ready", "quest": "Quests", "reading-log": "Reading Log"}[body.section],
        section_emoji={"future-ready": "🚀", "quest": "🧸", "reading-log": "📖"}[body.section],
        topic=topic.id, topic_title=topic.title, topic_emoji=topic.emoji,
        age_min=body.ageMin, age_max=body.ageMax, title=body.title, points=body.points,
        order_index=body.orderIndex if body.orderIndex is not None else max_order + 1,
        is_active="1", status="draft", is_premium="0", content=None,
    )
    db.add(module)
    db.commit()
    return ok(_module_dict(module), 201)


@router.get("/api/admin/content/modules/{module_id}")
def admin_get_module(module_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    module = db.query(DBLearningModule).get(module_id)
    if not module: fail("Module not found", 404)
    return ok(_module_dict(module, with_content=True))


@router.put("/api/admin/content/modules/{module_id}")
def admin_update_module(module_id: str, body: AdminModuleMetaUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    module = db.query(DBLearningModule).get(module_id)
    if not module: fail("Module not found", 404)
    if body.title is not None: module.title = body.title
    if body.points is not None:
        if body.points <= 0: fail("Points must be greater than 0")
        module.points = body.points
    if body.ageMin is not None: module.age_min = body.ageMin
    if body.ageMax is not None: module.age_max = body.ageMax
    if body.orderIndex is not None: module.order_index = body.orderIndex
    if body.isPremium is not None: module.is_premium = "1" if body.isPremium else "0"
    if body.isActive is not None: module.is_active = "1" if body.isActive else "0"
    db.commit()
    return ok(_module_dict(module))


@router.put("/api/admin/content/modules/{module_id}/content")
def admin_update_module_content(module_id: str, body: AdminModuleContentUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    module = db.query(DBLearningModule).get(module_id)
    if not module: fail("Module not found", 404)
    module.content = body.content
    db.commit()
    return ok(_module_dict(module, with_content=True))


@router.put("/api/admin/content/modules/{module_id}/status")
def admin_update_module_status(module_id: str, body: AdminModuleStatusUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    module = db.query(DBLearningModule).get(module_id)
    if not module: fail("Module not found", 404)
    if body.status not in ("draft", "published"):
        fail("status must be 'draft' or 'published'")
    if body.status == "published" and not module.content:
        fail("Add content before publishing this module")
    module.status = body.status
    db.commit()
    return ok(_module_dict(module))


@router.delete("/api/admin/content/modules/{module_id}")
def admin_deactivate_module(module_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    module = db.query(DBLearningModule).get(module_id)
    if not module: fail("Module not found", 404)
    # Soft-delete only -- keeps DBLearningCompletion/DBFamilyLearningSetting
    # rows resolvable for kids who already completed it, same as the old
    # catalog-sync's deactivation sweep did.
    module.is_active = "0"
    db.commit()
    return ok({"deactivated": True})
