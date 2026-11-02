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
from seed import backfill_sample_ids, ensure_demo_accounts, migrate_legacy_learning_content, reconcile_custom_item_counts, seed_db
from models import DBUser
from routers import admin, admin_content, auth, chores, contact, daily_chores, family, future_ready, kids, messages, quests, reading_log, shop, wallet

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
app.include_router(admin_content.router)
app.include_router(daily_chores.router)
app.include_router(future_ready.router)
app.include_router(quests.router)
app.include_router(reading_log.router)

# ── Startup ────────────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup():
    import random
    from datetime import datetime, timezone
    from sqlalchemy import text

    # Must run before create_all: once create_all sees DBQuestLog's current
    # __tablename__ ("quest_logs"), it creates that table fresh, and renaming
    # onto an already-existing table fails -- silently orphaning any real
    # data in the old "activity_logs" table from before the "Activity Ideas"
    # -> "Quest" rename. Only matters for a database that predates the
    # rename; harmless (caught below) otherwise.
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE activity_logs RENAME TO quest_logs"))
            conn.commit()
        except Exception:
            conn.rollback()

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
            ("chores",     "sample_id",      "VARCHAR"),
            ("recurring_templates", "sample_id", "VARCHAR"),
            ("users",      "chores_added_count",     "FLOAT"),
            ("users",      "shop_items_added_count", "FLOAT"),
            ("users",      "chores_limit_override",     "FLOAT"),
            ("users",      "shop_items_limit_override", "FLOAT"),
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
            ("users",      "firebase_uid",              "VARCHAR"),
            ("users",      "push_token",                "VARCHAR"),
            ("users",      "last_login_platform",        "VARCHAR"),
            ("users",      "admin_scope",                 "VARCHAR"),
            ("users",      "timezone",                    "VARCHAR"),
            ("daily_chore_items", "status",           "VARCHAR"),
            ("wallets",    "savings_balance",         "FLOAT"),
            ("wallets",    "goal_name",               "VARCHAR"),
            ("wallets",    "goal_target",             "FLOAT"),
            ("family_learning_settings", "points_override", "FLOAT"),
            ("learning_modules", "content", "JSON"),
            ("learning_modules", "created_at", "VARCHAR"),
            ("learning_modules", "status", "VARCHAR"),
            ("learning_modules", "is_premium", "VARCHAR"),
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
        # One-time promotion of every pre-existing module (migrated from the
        # legacy JSON catalogs) to published/non-premium -- the column default
        # only applies to rows inserted after the column exists, so rows from
        # before this change need an explicit backfill. Never touches a row
        # that already has a status, so an admin-created draft is never flipped.
        conn.execute(text("UPDATE learning_modules SET status='published' WHERE status IS NULL"))
        conn.execute(text("UPDATE learning_modules SET is_premium='0' WHERE is_premium IS NULL"))
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
        backfill_sample_ids(db)
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

    # One-time import of the legacy Future-Ready/Quests JSON catalogs into
    # DBContentTopic/DBLearningModule rows -- insert-only-if-missing, never
    # overwrites a row that already exists (including one an admin has since
    # edited through the Content panel). See seed.migrate_legacy_learning_content
    # for the full explanation; content is admin-managed from here on, this
    # is purely a migration step for databases that predate the Content panel.
    db3 = SessionLocal()
    try:
        migrate_legacy_learning_content(db3)
    finally:
        db3.close()

# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 4001))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
