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
from routers import admin, auth, chores, contact, daily_chores, family, kids, messages, shop, wallet

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
            ("daily_chore_items", "status",           "VARCHAR"),
        ]:
            try:
                if "sqlite" in str(engine.url):
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                else:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {col_type}"))
                conn.commit()
            except Exception:
                pass  # column already exists
        # Back-fill family_id for existing seed rows
        conn.execute(text("UPDATE chores SET family_id='parent1' WHERE family_id IS NULL AND (assigned_kid_id IN ('kid1','kid2') OR assigned_kid_id IS NULL)"))
        conn.execute(text("UPDATE chores SET family_id='parent2' WHERE family_id IS NULL AND assigned_kid_id='kid3'"))
        conn.execute(text("UPDATE shop_items SET family_id='parent1' WHERE family_id IS NULL"))
        # Back-fill completed_at for existing complete chores (visible for 3 days from now)
        conn.execute(text(f"UPDATE chores SET completed_at='{_ts_now}' WHERE status='complete' AND completed_at IS NULL"))
        # Back-fill new counters to 0 for existing users
        conn.execute(text("UPDATE users SET chores_added_count=0 WHERE chores_added_count IS NULL"))
        conn.execute(text("UPDATE users SET shop_items_added_count=0 WHERE shop_items_added_count IS NULL"))
        # Everyone who exists before this feature (or isn't a self-registering parent)
        # is active by default — only fresh registrations start inactive.
        conn.execute(text("UPDATE users SET is_active='1' WHERE is_active IS NULL"))
        conn.execute(text("UPDATE users SET daily_deduction_enabled='1' WHERE daily_deduction_enabled IS NULL"))
        conn.execute(text("UPDATE users SET shop_approval_enabled='0' WHERE shop_approval_enabled IS NULL"))
        conn.execute(text("UPDATE users SET is_suspended='0' WHERE is_suspended IS NULL"))
        conn.execute(text("UPDATE users SET pin_attempts=0 WHERE pin_attempts IS NULL"))
        conn.execute(text("UPDATE users SET pin_auto_generated='0' WHERE pin_auto_generated IS NULL"))
        # Migrate existing kid/co-parent accounts (which used to log in with their own
        # username+password) onto the PIN model: generate a PIN for every one that
        # doesn't have one yet, and flag it so the parent sees a one-time "here are
        # your new PINs" notice on the profile picker until they set their own.
        rows = conn.execute(text(
            "SELECT id FROM users WHERE pin IS NULL AND (role='kid' OR co_parent_of IS NOT NULL)"
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
    port = int(os.environ.get("PORT", 3001))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
