import glob
import json
import os
from datetime import date, timedelta
from uuid import uuid4

from sqlalchemy.orm import Session

from helpers import now
from models import DBChore, DBContentTopic, DBLearningModule, DBRecurringTemplate, DBShopItem, DBTransaction, DBUser, DBWallet
from sample_items import is_sample_shop_item, sample_chore_id_for_title


def seed_db(db: Session):
    # Keyed on the demo username rather than "any users exist" so this stays
    # idempotent on a production DB that already has real signups but has
    # never had the public demo family provisioned.
    if db.query(DBUser).filter(DBUser.username == "parent1").first():
        return   # demo family already seeded

    today = date.today()

    for u in [
        # Firebase requires at least 6 characters for a password, so these are
        # one longer than the "pass1"/"pass2" kid/demo-PIN convention used
        # elsewhere -- see frontend/src/utils/demoAccount.js (DEMO_PASSWORD
        # must match this exactly) and tests/api.test.js.
        DBUser(id="parent1", name="Mom",     username="parent1", password="pass1234", role="guardian", email="mom@family.com", date_of_birth="1980-03-10", gender="female", created_at=now(), pin="246810", pin_auto_generated="0"),
        DBUser(id="parent2", name="Dad",     username="parent2", password="pass2345", role="guardian", email="dad@family.com", date_of_birth="1978-07-22", gender="male", created_at=now(), pin="864203", pin_auto_generated="0"),
        DBUser(id="kid1",    name="Alice",   username="kid1",    password="pass1", role="kid",    guardian_id="parent1", avatar="🐱", created_at=now(), pin="123456", pin_auto_generated="0", birth_month=6, birth_year=2020),
        DBUser(id="kid2",    name="Bob",     username="kid2",    password="pass1", role="kid",    guardian_id="parent1", avatar="🐶", created_at=now(), pin="284917", pin_auto_generated="0", birth_month=1, birth_year=2017),
        DBUser(id="kid3",    name="Charlie", username="kid3",    password="pass1", role="kid",    guardian_id="parent2", avatar="🦁", created_at=now(), pin="573920", pin_auto_generated="0"),
    ]:
        db.add(u)

    for c in [
        # parent1 family chores (kid1 = Alice, kid2 = Bob)
        DBChore(id=str(uuid4()), title="Wash the dishes",           description="Wash and dry all dishes after dinner.",                   points=10, image_emoji="🍽️", status="open",     assigned_kid_id="kid1", due_date=(today+timedelta(days=3)).isoformat(), created_at=now(), family_id="parent1"),
        DBChore(id=str(uuid4()), title="Take out the trash",        description="Take all trash bags to the bin outside.",                  points= 5, image_emoji="🗑️", status="open",     due_date=(today+timedelta(days=1)).isoformat(), created_at=now(), family_id="parent1"),
        DBChore(id=str(uuid4()), title="Make your bed",             description="Straighten sheets, fluff pillows, and tidy your bedroom.", points= 5, image_emoji="🛏️", status="open",     assigned_kid_id="kid1", created_at=now(), family_id="parent1"),
        DBChore(id=str(uuid4()), title="Water the plants",          description="Water all indoor and balcony plants.",                     points= 8, image_emoji="🌿", status="open",     assigned_kid_id="kid2", due_date=(today+timedelta(days=2)).isoformat(), created_at=now(), family_id="parent1"),
        DBChore(id=str(uuid4()), title="Set the dinner table",      description="Lay out plates, cutlery, and glasses for the family.",     points= 5, image_emoji="🥄", status="open",     created_at=now(), family_id="parent1"),
        DBChore(id=str(uuid4()), title="Feed the pet",              description="Fill the food and water bowl for the family pet.",         points= 6, image_emoji="🐕", status="open",     created_at=now(), family_id="parent1"),
        DBChore(id=str(uuid4()), title="Sweep the porch",           description="Sweep leaves and dirt off the front porch.",               points= 8, image_emoji="🧹", status="open",     assigned_kid_id="kid2", due_date=(today+timedelta(days=4)).isoformat(), created_at=now(), family_id="parent1"),
        DBChore(id=str(uuid4()), title="Wash the car",              description="Rinse, soap, and dry the family car.",                     points=20, image_emoji="🚗", status="open",     assigned_kid_id="kid2", due_date=(today-timedelta(days=1)).isoformat(), created_at=now(), family_id="parent1"),
        DBChore(id=str(uuid4()), title="Vacuum the living room",    description="Vacuum carpets and clean under the sofa.",                 points=15, image_emoji="🏠", status="pending",  assigned_kid_id="kid2", completed_by_kid_id="kid2", due_date=(today+timedelta(days=1)).isoformat(), created_at=now(), family_id="parent1"),
        DBChore(id=str(uuid4()), title="Wipe down kitchen counter", description="Clean all kitchen surfaces with a damp cloth.",            points= 7, image_emoji="🧼", status="pending",  completed_by_kid_id="kid1", created_at=now(), family_id="parent1"),
        DBChore(id=str(uuid4()), title="Take out recycling",        description="Sort and take the recycling bins to the kerb.",            points= 8, image_emoji="♻️", status="complete", completed_by_kid_id="kid1", created_at=now(), family_id="parent1", completed_at=now()),
        DBChore(id=str(uuid4()), title="Mop the kitchen floor",     description="Mop the kitchen floor after sweeping.",                    points=15, image_emoji="🪣", status="complete", assigned_kid_id="kid2", completed_by_kid_id="kid2", created_at=now(), family_id="parent1", completed_at=now()),
        # parent2 family chores (kid3 = Charlie)
        DBChore(id=str(uuid4()), title="Fold the laundry",          description="Fold clean clothes from the dryer and put them away.",     points=12, image_emoji="🧺", status="open",     assigned_kid_id="kid3", due_date=(today+timedelta(days=5)).isoformat(), created_at=now(), family_id="parent2"),
        DBChore(id=str(uuid4()), title="Clean the garage",          description="Tidy up and sweep the garage floor.",                      points=25, image_emoji="🏡", status="open",     due_date=(today-timedelta(days=2)).isoformat(), created_at=now(), family_id="parent2"),
        DBChore(id=str(uuid4()), title="Organise the bookshelf",    description="Sort books by size and put them back neatly.",             points=10, image_emoji="📚", status="pending",  assigned_kid_id="kid3", completed_by_kid_id="kid3", due_date=(today-timedelta(days=1)).isoformat(), created_at=now(), family_id="parent2"),
        DBChore(id=str(uuid4()), title="Clean the bathroom",        description="Scrub the sink, toilet, and wipe down surfaces.",          points=20, image_emoji="🚽", status="complete", assigned_kid_id="kid3", completed_by_kid_id="kid3", created_at=now(), family_id="parent2", completed_at=now()),
    ]:
        db.add(c)

    for s in [
        DBShopItem(id=str(uuid4()), name="Extra Screen Time (30 min)", description="Get 30 extra minutes of screen time today.", cost=10, image_emoji="📱", created_at=now(), family_id="parent1"),
        DBShopItem(id=str(uuid4()), name="Choose Dinner",              description="Pick what the family eats for dinner.",       cost=25, image_emoji="🍕", created_at=now(), family_id="parent1"),
        DBShopItem(id=str(uuid4()), name="Stay Up 1 Hour Later",       description="Extend bedtime by one hour on a weekend.",   cost=20, image_emoji="🌙", created_at=now(), family_id="parent1"),
        DBShopItem(id=str(uuid4()), name="Movie Night Pick",           description="Choose the movie for family movie night.",   cost=15, image_emoji="🎬", created_at=now(), family_id="parent1"),
        DBShopItem(id=str(uuid4()), name="Extra Screen Time (30 min)", description="Get 30 extra minutes of screen time today.", cost=10, image_emoji="📱", created_at=now(), family_id="parent2"),
        DBShopItem(id=str(uuid4()), name="Choose Dinner",              description="Pick what the family eats for dinner.",       cost=25, image_emoji="🍕", created_at=now(), family_id="parent2"),
        DBShopItem(id=str(uuid4()), name="Stay Up 1 Hour Later",       description="Extend bedtime by one hour on a weekend.",   cost=20, image_emoji="🌙", created_at=now(), family_id="parent2"),
        DBShopItem(id=str(uuid4()), name="Movie Night Pick",           description="Choose the movie for family movie night.",   cost=15, image_emoji="🎬", created_at=now(), family_id="parent2"),
    ]:
        db.add(s)

    for kid_id, balance in [("kid1", 30), ("kid2", 0), ("kid3", 20)]:
        db.add(DBWallet(kid_id=kid_id, balance=balance))

    db.add(DBTransaction(id=str(uuid4()), kid_id="kid1", type="earned", amount=30, description="Bonus points (seed)",        timestamp=now()))
    db.add(DBTransaction(id=str(uuid4()), kid_id="kid3", type="earned", amount=20, description="Earned: Clean the bathroom", timestamp=now()))

    db.commit()


# The public "try demo" login (parent1/pass1, referenced directly in the
# login page's own placeholder text and in Help/blog docs) needs to always
# work for site visitors. Unlike seed_db above -- which only ever runs once,
# on a genuinely empty database -- this runs on every startup and repairs
# just these specific accounts' credentials/status if they ever drift (e.g.
# someone changes the password while poking at a public demo login), without
# touching any of their chores/shop items/wallet history.
DEMO_ACCOUNTS = [
    dict(id="parent1", name="Mom",   username="parent1", password="pass1234", role="guardian",
         email="mom@family.com", date_of_birth="1980-03-10", gender="female", pin="246810", pin_auto_generated="0"),
    dict(id="parent2", name="Dad",   username="parent2", password="pass2345", role="guardian",
         email="dad@family.com", date_of_birth="1978-07-22", gender="male", pin="864203", pin_auto_generated="0"),
    dict(id="kid1", name="Alice", username="kid1", password="pass1", role="kid", guardian_id="parent1",
         avatar="🐱", pin="123456", pin_auto_generated="0", birth_month=6, birth_year=2020),
    dict(id="kid2", name="Bob",   username="kid2", password="pass1", role="kid", guardian_id="parent1",
         avatar="🐶", pin="284917", pin_auto_generated="0", birth_month=1, birth_year=2017),
    dict(id="kid3", name="Charlie", username="kid3", password="pass1", role="kid", guardian_id="parent2",
         avatar="🦁", pin="573920", pin_auto_generated="0"),
]


def ensure_demo_accounts(db: Session):
    for fields in DEMO_ACCOUNTS:
        user = db.query(DBUser).filter(DBUser.id == fields["id"]).first()
        if user:
            for key, value in fields.items():
                setattr(user, key, value)
            user.is_suspended = "0"
            user.is_active = "1"
        else:
            db.add(DBUser(created_at=now(), is_active="1", **fields))
    db.commit()


def backfill_sample_ids(db: Session) -> None:
    """One-time: tag chores/templates that predate the sample_id column (this
    includes the demo seed data above, and any pre-existing production rows)
    with the id they'd match today, best-effort by title -- the same
    ambiguity a title-based match always had (a coincidentally-matching
    custom title gets misattributed), but only for this one backfill. Every
    chore created from here on gets an unambiguous, explicit sample_id
    straight from the create request (see routers/chores.py) and is never
    touched by this again once it has one, NULL included -- a genuinely
    custom chore's sample_id starts and stays NULL, so re-running this on
    every startup is safe."""
    for c in db.query(DBChore).filter(DBChore.sample_id == None, DBChore.template_id == None).all():
        match = sample_chore_id_for_title(c.title)
        if match:
            c.sample_id = match
    for t in db.query(DBRecurringTemplate).filter(DBRecurringTemplate.sample_id == None).all():
        match = sample_chore_id_for_title(t.title)
        if match:
            t.sample_id = match
    db.commit()
    # Recurring occurrences generated before this backfill copy their template's
    # (now-backfilled) sample_id -- new ones get it straight from the template at
    # generation time (see chore_logic.generate_instances), so this only ever
    # matters for rows that already existed when this shipped.
    template_sample_ids = dict(db.query(DBRecurringTemplate.id, DBRecurringTemplate.sample_id).all())
    for c in db.query(DBChore).filter(DBChore.sample_id == None, DBChore.template_id != None).all():
        c.sample_id = template_sample_ids.get(c.template_id)
    db.commit()


def reconcile_custom_item_counts(db: Session) -> None:
    """chores_added_count / shop_items_added_count are meant to reflect custom
    items currently in use -- deleting one frees its slot back up (see the
    delete endpoints in routers/chores.py and routers/shop.py) -- but that
    wasn't true until that fix shipped, so any family active before then can
    have a stale count baked in already (e.g. showing more used than any
    custom item they can actually see, because years of since-deleted chores
    never decremented it). Runs on every startup and recomputes every family
    owner's counts from what's actually in the DB right now.

    Chores/templates count as custom based on sample_id (see routers/chores.py
    and main.py's one-time backfill for pre-existing rows) -- fixed at
    creation, not re-derived from the current title. Shop items don't have
    an id-based equivalent yet, so they're still matched by name."""
    owners = db.query(DBUser).filter(DBUser.role == "guardian", DBUser.co_guardian_of == None).all()
    for owner in owners:
        # A recurring instance (template_id set) was never itself counted --
        # only its template's creation consumed a slot -- so instances are
        # excluded here the same way delete_chore excludes them from refunds.
        chores = db.query(DBChore).filter(DBChore.family_id == owner.id, DBChore.template_id == None).all()
        templates = db.query(DBRecurringTemplate).filter(
            DBRecurringTemplate.family_id == owner.id, DBRecurringTemplate.is_active == "1",
        ).all()
        shop_items = db.query(DBShopItem).filter(DBShopItem.family_id == owner.id).all()

        owner.chores_added_count = (
            sum(1 for c in chores if c.sample_id is None)
            + sum(1 for t in templates if t.sample_id is None)
        )
        owner.shop_items_added_count = sum(1 for s in shop_items if not is_sample_shop_item(s.name))
    db.commit()


# Future-Ready topics as they existed before content became admin-managed --
# kept only as one-time migration input for migrate_legacy_learning_content
# below. New topics are created through the admin Content panel now, not by
# editing this list.
_LEGACY_FUTURE_READY_TOPICS = [
    # (file_slug, topic_key, topic_title, topic_emoji)
    ("investing", "investing-for-kids", "Investing for Kids", "📈"),
    ("ai", "ai-for-kids", "AI for Kids", "🤖"),
    ("entrepreneurship", "entrepreneurship", "Entrepreneurship", "💡"),
    ("critical-thinking", "critical-thinking", "Critical Thinking", "🧠"),
    ("communication", "communication", "Communication", "💬"),
    ("digital-safety", "digital-safety", "Digital Safety", "🔒"),
    ("problem-solving", "problem-solving", "Problem Solving", "🧩"),
    ("leadership", "leadership", "Leadership", "👑"),
    ("negotiation", "negotiation", "Negotiation Skills", "🤝"),
    ("public-speaking", "public-speaking", "Public Speaking", "🎤"),
    ("sight-words", "sight-words", "Sight Words", "🔤"),
    ("money-value", "money-value", "Value of Money", "💰"),
    ("making-friends", "making-friends", "Making Friends", "🧑‍🤝‍🧑"),
    ("manners", "manners", "Manners", "🎩"),
]
# Fixed age bands -- unlike the topics/categories above, these are NOT legacy
# migration-only input. Per the admin Content panel's design, age bands stay
# backend-defined for now (not admin-editable); a new module an admin creates
# still has to pick one of these via a dropdown. Imported by
# routers/admin_content.py for exactly that.
AGE_BANDS = [(4, 6, 10), (7, 9, 12), (10, 13, 15), (13, 17, 18)]  # (age_min, age_max, points per part)

_LEGACY_QUEST_CATEGORIES = [
    # (category_key, category_title, category_emoji)
    ("cognitive", "Cognitive Development", "🧠"),
    ("creativity", "Creativity & Imagination", "🎨"),
    ("physical", "Physical & Motor Skills", "🤸"),
    ("emotional", "Emotional Intelligence", "❤️"),
    ("stem", "STEM Exploration", "🔬"),
]
# Same non-legacy status as AGE_BANDS above -- fixed, still used when an
# admin creates a new Quest module, not just for this one-time migration.
QUEST_AGE_BANDS = [(4, 6), (7, 9), (10, 13), (13, 17)]
QUEST_POINTS = 8  # flat per quest completion -- no quiz to scale off of


def _insert_topic_if_missing(db: Session, topic_id: str, section: str, title: str, emoji: str, order_index: int) -> None:
    if db.query(DBContentTopic).get(topic_id):
        return
    db.add(DBContentTopic(id=topic_id, section=section, title=title, emoji=emoji, order_index=order_index))


def migrate_legacy_learning_content(db: Session) -> None:
    """One-time import of the old hand-edited JSON catalogs
    (future_ready_content/*.json, quests_content/*.json) and the topics/
    categories/age-bands that used to be hardcoded here, into DBContentTopic
    + DBLearningModule rows. Insert-only-if-missing -- unlike the old
    upsert-and-clobber seeding this replaces, this NEVER touches a row that
    already exists, so it's safe to leave running on every boot forever
    without overwriting anything an admin has since edited through the
    Content panel. Once every legacy row exists in the DB (immediately after
    this first runs), every later call is just an existence-check no-op.

    Also means nothing auto-retires anymore if it's dropped from these
    legacy lists -- deactivating a module/topic is now a deliberate admin
    action (see routers/admin_content.py), not something this sync does for
    you, since the DB -- not these lists -- is the real catalog now."""
    _ts_now = now()

    # --- Future-Ready ---
    for order_index, (file_slug, topic_key, topic_title, topic_emoji) in enumerate(_LEGACY_FUTURE_READY_TOPICS, start=1):
        _insert_topic_if_missing(db, topic_key, "future-ready", topic_title, topic_emoji, order_index)
    db.commit()

    content_dir = os.path.join(os.path.dirname(__file__), "future_ready_content")
    content_by_id = {}
    for fname in sorted(glob.glob(os.path.join(content_dir, "*.json"))):
        with open(fname, encoding="utf-8") as f:
            content_by_id.update(json.load(f))

    order_index = 0
    for file_slug, topic_key, topic_title, topic_emoji in _LEGACY_FUTURE_READY_TOPICS:
        bands = [(4, 6, 10)] if file_slug == "sight-words" else AGE_BANDS
        for age_min, age_max, points in bands:
            band_prefix = f"{file_slug}-{age_min}-{age_max}-p"
            part_ids = sorted(
                (k for k in content_by_id if k.startswith(band_prefix) and k[len(band_prefix):].isdigit()),
                key=lambda k: int(k[len(band_prefix):]),
            )
            for part_id in part_ids:
                part_num = int(part_id[len(band_prefix):])
                part_title = f"Ages {age_min}–{age_max} · Part {part_num}" if len(part_ids) > 1 else f"Ages {age_min}–{age_max}"
                order_index += 1
                if db.query(DBLearningModule).get(part_id):
                    continue  # already migrated (or admin-created with this id) -- never touch it
                db.add(DBLearningModule(
                    id=part_id, section="future-ready", section_title="Future-Ready", section_emoji="🚀",
                    topic=topic_key, topic_title=topic_title, topic_emoji=topic_emoji,
                    age_min=age_min, age_max=age_max, title=part_title, points=points, order_index=order_index,
                    is_active="1", status="published", is_premium="0",
                    content=content_by_id.get(part_id), created_at=_ts_now,
                ))
    db.commit()

    # --- Quests ---
    for order_index, (category_key, category_title, category_emoji) in enumerate(_LEGACY_QUEST_CATEGORIES, start=1):
        _insert_topic_if_missing(db, category_key, "quest", category_title, category_emoji, order_index)
    db.commit()

    content_dir = os.path.join(os.path.dirname(__file__), "quests_content")
    content_by_id = {}
    for fname in sorted(glob.glob(os.path.join(content_dir, "*.json"))):
        with open(fname, encoding="utf-8") as f:
            content_by_id.update(json.load(f))

    order_index = 0
    for category_key, category_title, category_emoji in _LEGACY_QUEST_CATEGORIES:
        for age_min, age_max in QUEST_AGE_BANDS:
            module_id = f"{category_key}-{age_min}-{age_max}"
            if module_id not in content_by_id:
                continue
            order_index += 1
            if db.query(DBLearningModule).get(module_id):
                continue
            db.add(DBLearningModule(
                id=module_id, section="quest", section_title="Quests", section_emoji="🧸",
                topic=category_key, topic_title=category_title, topic_emoji=category_emoji,
                age_min=age_min, age_max=age_max, title=f"Ages {age_min}–{age_max}",
                points=QUEST_POINTS, order_index=order_index,
                is_active="1", status="published", is_premium="0",
                content=content_by_id.get(module_id), created_at=_ts_now,
            ))
    db.commit()
