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
from routers import admin, auth, chores, contact, family, kids, messages, shop, wallet

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

# ── Startup ────────────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup():
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
            ("users",      "is_active",               "VARCHAR"),
            ("users",      "activation_token",        "VARCHAR"),
            ("users",      "activation_token_expires","VARCHAR"),
            ("users",      "reset_token",             "VARCHAR"),
            ("users",      "reset_token_expires",     "VARCHAR"),
            ("users",      "birth_month",             "INTEGER"),
            ("users",      "birth_year",              "INTEGER"),
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
