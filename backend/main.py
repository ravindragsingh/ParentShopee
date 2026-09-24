import glob
import json
import os
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from starlette.responses import Response as StarletteResponse

import models  # noqa: F401 — import ensures all tables are registered on Base before create_all()
from database import SessionLocal, engine, Base
from seed import ensure_demo_accounts, reconcile_custom_item_counts, seed_db
from models import DBUser
from routers import admin, auth, chores, contact, daily_chores, family, future_ready, kids, messages, shop, wallet

app = FastAPI(title="Reward Ur Kids API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class MaxBodySizeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        if request.headers.get("content-length"):
            if int(request.headers["content-length"]) > 5 * 1024 * 1024:
                return StarletteResponse("Request body too large (max 5 MB)", status_code=413)
        return await call_next(request)

app.add_middleware(MaxBodySizeMiddleware)

@app.exception_handler(HTTPException)
async def _flatten_http_exception(request: StarletteRequest, exc: HTTPException):
    """fail() raises HTTPException(detail={"success": False, "error": ...}). FastAPI's
    default handler wraps that as {"detail": {...}}, which doesn't match ok()'s flat
    {"success", "data"} shape and left every server-side error message unreadable by
    the frontend (which fell back to a generic "Request failed"). Return detail as-is
    at the top level so success and error responses are symmetrical."""
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"success": False, "error": str(exc.detail)})

# ── Routers ────────────────────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(kids.router)
app.include_router(family.router)
app.include_router(chores.router)
app.include_router(shop.router)
app.include_router(wallet.router)
app.include_router(contact.router)
app.include_router(messages.router)
app.include_router(admin.router)
app.include_router(daily_chores.router)
app.include_router(future_ready.router)

# ── Startup ────────────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup():
    import random
    from datetime import datetime, timezone
    from sqlalchemy import text
    Base.metadata.create_all(bind=engine)
    # Add columns that may be missing from older databases
    _ts_now = datetime.now(timezone.utc).isoformat()
    with engine.connect() as conn:
        for table, col, col_type in [
            ("chores",     "family_id",      "VARCHAR"),
            ("shop_items", "family_id",      "VARCHAR"),
            ("chores",     "completed_at",   "VARCHAR"),
            ("messages",   "quote_content",  "VARCHAR"),
            ("chores",     "template_id",    "VARCHAR"),
            ("chores",     "scheduled_date", "VARCHAR"),
            ("users",      "chores_added_count",     "FLOAT"),
            ("users",      "shop_items_added_count", "FLOAT"),
            ("users",      "country",                "VARCHAR"),
            ("users",      "city",                   "VARCHAR"),
            ("users",      "last_login_country",     "VARCHAR"),
            ("users",      "last_login_city",        "VARCHAR"),
            ("users",      "last_login_at",          "VARCHAR"),
            ("users",      "is_active",               "VARCHAR"),
            ("users",      "activation_token",        "VARCHAR"),
            ("users",      "activation_token_expires","VARCHAR"),
            ("users",      "reset_token",             "VARCHAR"),
            ("users",      "reset_token_expires",     "VARCHAR"),
            ("users",      "birth_month",             "INTEGER"),
            ("users",      "birth_year",              "INTEGER"),
            ("users",      "daily_deduction_enabled", "VARCHAR"),
            ("users",      "shop_approval_enabled",   "VARCHAR"),
            ("users",      "created_at",              "VARCHAR"),
            ("users",      "last_active_at",          "VARCHAR"),
            ("users",      "is_suspended",            "VARCHAR"),
            ("users",      "pin",                     "VARCHAR"),
            ("users",      "pin_attempts",             "INTEGER"),
            ("users",      "pin_locked_until",          "VARCHAR"),
            ("users",      "pin_auto_generated",        "VARCHAR"),
            ("users",      "google_id",                 "VARCHAR"),
            ("users",      "push_token",                "VARCHAR"),
            ("daily_chore_items", "status",           "VARCHAR"),
            ("wallets",    "savings_balance",         "FLOAT"),
            ("family_learning_settings", "points_override", "FLOAT"),
            ("learning_modules", "content", "JSON"),
            ("learning_modules", "created_at", "VARCHAR"),
            ("family_learning_settings", "enabled_kid_ids", "VARCHAR"),
        ]:
            try:
                if "sqlite" in str(engine.url):
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                else:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {col_type}"))
                conn.commit()
            except Exception:
                conn.rollback()  # column already exists — Postgres aborts the whole
                # transaction on error, so it must be rolled back before continuing
        # Rename columns for the parent -> guardian terminology update. Only matters for
        # a database that predates this change — a fresh database already gets the new
        # column names straight from models.py. On every redeploy after the first
        # successful run, parent_id/co_parent_of no longer exist, so these fail (and
        # must roll back cleanly) every time from then on.
        for table, old_col, new_col in [
            ("users", "parent_id", "guardian_id"),
            ("users", "co_parent_of", "co_guardian_of"),
        ]:
            try:
                conn.execute(text(f"ALTER TABLE {table} RENAME COLUMN {old_col} TO {new_col}"))
                conn.commit()
            except Exception:
                conn.rollback()  # already renamed, or this DB never had the old column name
        # Migrate the "parent" role value itself to "guardian" for existing accounts
        try:
            conn.execute(text("UPDATE users SET role='guardian' WHERE role='parent'"))
            conn.commit()
        except Exception:
            conn.rollback()
        # Back-fill family_id for existing seed rows
        conn.execute(text("UPDATE chores SET family_id='parent1' WHERE family_id IS NULL AND (assigned_kid_id IN ('kid1','kid2') OR assigned_kid_id IS NULL)"))
        conn.execute(text("UPDATE chores SET family_id='parent2' WHERE family_id IS NULL AND assigned_kid_id='kid3'"))
        conn.execute(text("UPDATE shop_items SET family_id='parent1' WHERE family_id IS NULL"))
        # Back-fill completed_at for existing complete chores (visible for 3 days from now)
        conn.execute(text(f"UPDATE chores SET completed_at='{_ts_now}' WHERE status='complete' AND completed_at IS NULL"))
        # Public Speaking's rows were inserted (in an earlier deploy) before the
        # learning_modules.created_at column existed, so without this one-time
        # backfill it would never show the "New" badge -- every topic added
        # from this point on gets created_at automatically, in the catalog
        # loop below, on its first-ever insert.
        conn.execute(text(f"UPDATE learning_modules SET created_at='{_ts_now}' WHERE topic='public-speaking' AND created_at IS NULL"))
        # Back-fill new counters to 0 for existing users
        conn.execute(text("UPDATE users SET chores_added_count=0 WHERE chores_added_count IS NULL"))
        conn.execute(text("UPDATE users SET shop_items_added_count=0 WHERE shop_items_added_count IS NULL"))
        # Everyone who exists before this feature (or isn't a self-registering guardian)
        # is active by default — only fresh registrations start inactive.
        conn.execute(text("UPDATE users SET is_active='1' WHERE is_active IS NULL"))
        conn.execute(text("UPDATE users SET daily_deduction_enabled='1' WHERE daily_deduction_enabled IS NULL"))
        conn.execute(text("UPDATE users SET shop_approval_enabled='0' WHERE shop_approval_enabled IS NULL"))
        conn.execute(text("UPDATE users SET is_suspended='0' WHERE is_suspended IS NULL"))
        conn.execute(text("UPDATE users SET pin_attempts=0 WHERE pin_attempts IS NULL"))
        conn.execute(text("UPDATE users SET pin_auto_generated='0' WHERE pin_auto_generated IS NULL"))
        conn.execute(text("UPDATE wallets SET savings_balance=0 WHERE savings_balance IS NULL"))
        # Demo family sample kids (Alice/Bob) predate birth_month/birth_year
        # being a required field -- set them explicitly so age-based features
        # like Future-Ready work out of the box on any existing database,
        # not just freshly-seeded ones. Six years apart, matching the two
        # accounts' demo personas.
        conn.execute(text("UPDATE users SET birth_month=6, birth_year=2020 WHERE id='kid1'"))
        conn.execute(text("UPDATE users SET birth_month=1, birth_year=2017 WHERE id='kid2'"))
        # Migrate every family-profile account (kids, co-guardian, and now the primary
        # guardian too — every profile in the picker is PIN-gated) onto the PIN model:
        # generate a PIN for anyone who doesn't have one yet, and flag it so the
        # guardian sees a one-time "here are your new PINs" notice on the profile
        # picker until they set their own. Admins have no profile-picker concept
        # and are excluded.
        rows = conn.execute(text(
            "SELECT id FROM users WHERE pin IS NULL AND role != 'admin'"
        )).fetchall()
        for (user_id,) in rows:
            new_pin = f"{random.randint(0, 999999):06d}"
            conn.execute(
                text("UPDATE users SET pin=:pin, pin_auto_generated='1' WHERE id=:id"),
                {"pin": new_pin, "id": user_id},
            )
        # Commit everything backfilled above before the risky statement below — its
        # rollback-on-failure would otherwise also discard all of these uncommitted updates.
        conn.commit()
        # Daily chore items from before the open/pending/complete status column existed
        # tracked completion with a "checked" 0/1 column instead — carry that over.
        try:
            conn.execute(text("UPDATE daily_chore_items SET status = CASE WHEN checked='1' THEN 'complete' ELSE 'open' END WHERE status IS NULL"))
            conn.commit()
        except Exception:
            conn.rollback()  # no legacy "checked" column on this table (fresh install) — Postgres
            # aborts the whole transaction on error, so it must be rolled back before continuing
        conn.execute(text("UPDATE daily_chore_items SET status='open' WHERE status IS NULL"))
        conn.commit()
    db = SessionLocal()
    try:
        seed_db(db)
        ensure_demo_accounts(db)
        reconcile_custom_item_counts(db)
    finally:
        db.close()

    # Create/ensure admin user exists
    # Credentials MUST be set via environment variables — no hardcoded fallback for security
    admin_username = os.environ.get("ADMIN_USERNAME")
    admin_password = os.environ.get("ADMIN_PASSWORD")
    if not admin_username or not admin_password:
        print("WARNING: ADMIN_USERNAME or ADMIN_PASSWORD env var not set — skipping admin creation.")
    else:
        db2 = SessionLocal()
        try:
            existing = db2.query(DBUser).filter(DBUser.username == admin_username).first()
            if existing:
                if existing.role != "admin":
                    existing.role = "admin"
                    existing.password = admin_password
                    db2.commit()
            else:
                db2.add(DBUser(
                    id="admin-" + str(uuid4())[:8],
                    name="Admin",
                    username=admin_username,
                    password=admin_password,
                    role="admin",
                    email="admin@rewardyourkids.com",
                ))
                db2.commit()
        finally:
            db2.close()

    # Seed the Future-Ready catalog -- same upsert-plus-soft-deactivate pattern
    # as the games catalog: every server start syncs the DB rows to this list,
    # backfilling any field changes on existing rows and deactivating anything
    # no longer offered (keeping the row so past completions still resolve).
    from models import DBLearningModule
    db3 = SessionLocal()
    try:
        # Lesson content (slides + quiz) lives in these JSON files -- one per
        # topic, hand-authored directly here -- rather than bundled into the
        # frontend, so editing or adding a lesson is a backend-only redeploy.
        # See the Column(JSON) comment on DBLearningModule.content.
        content_dir = os.path.join(os.path.dirname(__file__), "future_ready_content")
        content_by_id = {}
        for fname in sorted(glob.glob(os.path.join(content_dir, "*.json"))):
            with open(fname, encoding="utf-8") as f:
                content_by_id.update(json.load(f))

        # A band's lesson can be split across several "Part N" modules --
        # e.g. "ai-4-6-p1", "ai-4-6-p2" -- each its own quiz and points, so a
        # kid working through a big topic gets a payout every ~10 questions
        # instead of one all-or-nothing quiz at the very end. How many parts
        # a band has is discovered from content_by_id rather than hardcoded
        # here, since that can (and does) vary per topic/band -- adding or
        # splitting a part is purely a content-file change, no code change.
        # (file slug, kid-facing topic-grouping key, topic title, topic emoji)
        TOPICS = [
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
        AGE_BANDS = [(4, 6, 10), (7, 9, 12), (10, 13, 15), (13, 17, 18)]  # (age_min, age_max, points per part)

        catalog = []
        order_index = 1
        for file_slug, topic_key, topic_title, topic_emoji in TOPICS:
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
                    catalog.append(dict(
                        id=part_id, section="future-ready", section_title="Future-Ready", section_emoji="🚀",
                        topic=topic_key, topic_title=topic_title, topic_emoji=topic_emoji,
                        age_min=age_min, age_max=age_max, title=part_title, points=points, order_index=order_index,
                    ))
                    order_index += 1

        for fields in catalog:
            fields = {**fields, "content": content_by_id.get(fields["id"])}
            existing = db3.query(DBLearningModule).filter(DBLearningModule.id == fields["id"]).first()
            if existing:
                for key, value in fields.items():
                    setattr(existing, key, value)
            else:
                # created_at is only ever set here, on first creation -- a later
                # catalog re-sync (every server start) must never touch it, or
                # every module would look "new" again after each deploy.
                db3.add(DBLearningModule(is_active="1", created_at=_ts_now, **fields))
        active_ids = [c["id"] for c in catalog]
        db3.query(DBLearningModule).filter(DBLearningModule.id.notin_(active_ids)).update({"is_active": "0"}, synchronize_session=False)
        db3.commit()
    finally:
        db3.close()

# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 4001))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
