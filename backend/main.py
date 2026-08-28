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
from seed import seed_db
from models import DBUser
from routers import admin, auth, chores, contact, daily_chores, family, games, kids, messages, shop, wallet

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
app.include_router(games.router)

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
            ("games",      "min_age",                 "INTEGER"),
            ("games",      "max_age",                 "INTEGER"),
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
    finally:
        db.close()

    # Games catalog is global (not per-family) and kept in sync with this list on
    # every startup (upsert, not insert-only) -- unlike seed_db() above, which only
    # runs once against a brand-new database, this needs to reach every existing
    # production database too, including backfilling fields (like age tags) added
    # to games that already exist there. Per-family visibility is a separate,
    # opt-in setting (DBFamilyGameSetting) -- being in this catalog doesn't mean
    # a family's kids can see it yet.
    from models import DBGame
    db3 = SessionLocal()
    try:
        catalog = [
            dict(id="memory-match", name="Memory Match",
                 description="Flip cards and find every matching pair before time runs out.",
                 image_emoji="🧠", cost=15, duration_minutes=20, min_age=4, max_age=None),
            dict(id="alphabet-hunt", name="Alphabet Hunt",
                 description="Find the letter that's called out to practice the ABCs.",
                 image_emoji="🔤", cost=8, duration_minutes=10, min_age=4, max_age=6),
            dict(id="number-match", name="Number Match",
                 description="Count the pictures and tap the matching number.",
                 image_emoji="🔢", cost=8, duration_minutes=10, min_age=4, max_age=6),
            dict(id="sight-words", name="Sight Words",
                 description="Spot common reading words to build early reading skills.",
                 image_emoji="📖", cost=8, duration_minutes=10, min_age=4, max_age=6),
            dict(id="quick-math", name="Quick Math",
                 description="Solve as many quick math problems as you can before time runs out.",
                 image_emoji="🧮", cost=12, duration_minutes=15, min_age=8, max_age=None),
            dict(id="word-scramble", name="Word Scramble",
                 description="Unscramble the mixed-up letters to spell the word.",
                 image_emoji="🔀", cost=10, duration_minutes=12, min_age=8, max_age=None),
            dict(id="snake", name="Snake",
                 description="Guide the snake to eat food and grow as long as you can without crashing.",
                 image_emoji="🐍", cost=15, duration_minutes=15, min_age=6, max_age=None),
            dict(id="whack-a-mole", name="Whack-a-Mole",
                 description="Tap the moles as they pop up before they disappear.",
                 image_emoji="🐹", cost=10, duration_minutes=10, min_age=4, max_age=None),
            dict(id="tic-tac-toe", name="Tic-Tac-Toe",
                 description="Play a classic game of X's and O's against the computer.",
                 image_emoji="⭕", cost=8, duration_minutes=10, min_age=5, max_age=None),
        ]
        for fields in catalog:
            existing = db3.query(DBGame).filter(DBGame.id == fields["id"]).first()
            if existing:
                for key, value in fields.items():
                    setattr(existing, key, value)
            else:
                db3.add(DBGame(is_active="1", **fields))
        db3.commit()
    finally:
        db3.close()

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

# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 4001))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
