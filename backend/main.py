import re
import os
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from uuid import uuid4
from datetime import datetime, timezone, date, timedelta

app = FastAPI(title="ParentShopee API")

_FRONTEND_URL = os.environ.get("FRONTEND_URL", "")
_CORS_ORIGINS = [
    "http://localhost:3000", "http://localhost:3002", "http://localhost:5173",
    *([_FRONTEND_URL] if _FRONTEND_URL else []),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')

# ── In-memory store ───────────────────────────────────────────────────────────

def now() -> str:
    return datetime.now(timezone.utc).isoformat()

def today_str() -> str:
    return date.today().isoformat()

def calculate_age(dob_str: str) -> int:
    dob = date.fromisoformat(dob_str)
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

# parentId = None for parents; parentId = <parent user id> for kids
USERS = [
    {"id": "parent1", "name": "Mom",     "username": "parent1", "password": "pass1", "role": "parent", "email": "mom@family.com",   "dateOfBirth": "1980-03-10", "parentId": None, "gender": "female", "coParentOf": None},
    {"id": "parent2", "name": "Dad",     "username": "parent2", "password": "pass2", "role": "parent", "email": "dad@family.com",   "dateOfBirth": "1978-07-22", "parentId": None, "gender": "male",   "coParentOf": None},
    {"id": "kid1",    "name": "Alice",   "username": "kid1",    "password": "pass1", "role": "kid",    "email": None, "dateOfBirth": None, "parentId": "parent1", "avatar": "🐱"},
    {"id": "kid2",    "name": "Bob",     "username": "kid2",    "password": "pass1", "role": "kid",    "email": None, "dateOfBirth": None, "parentId": "parent1", "avatar": "🐶"},
    {"id": "kid3",    "name": "Charlie", "username": "kid3",    "password": "pass1", "role": "kid",    "email": None, "dateOfBirth": None, "parentId": "parent2", "avatar": "🦁"},
]

CHORES = [
    {"id": str(uuid4()), "title": "Wash the dishes",          "description": "Wash and dry all dishes after dinner.",                   "points": 10, "imageEmoji": "🍽️", "status": "open",    "assignedKidId": "kid1", "completedByKidId": None, "dueDate": (date.today() + timedelta(days=3)).isoformat(), "expiredAt": None, "createdAt": now()},
    {"id": str(uuid4()), "title": "Take out the trash",       "description": "Take all trash bags to the bin outside.",                  "points":  5, "imageEmoji": "🗑️", "status": "open",    "assignedKidId": None,   "completedByKidId": None, "dueDate": (date.today() + timedelta(days=1)).isoformat(), "expiredAt": None, "createdAt": now()},
    {"id": str(uuid4()), "title": "Make your bed",            "description": "Straighten sheets, fluff pillows, and tidy your bedroom.", "points":  5, "imageEmoji": "🛏️", "status": "open",    "assignedKidId": "kid1", "completedByKidId": None, "dueDate": None,                                            "expiredAt": None, "createdAt": now()},
    {"id": str(uuid4()), "title": "Water the plants",         "description": "Water all indoor and balcony plants.",                     "points":  8, "imageEmoji": "🌿", "status": "open",    "assignedKidId": "kid2", "completedByKidId": None, "dueDate": (date.today() + timedelta(days=2)).isoformat(), "expiredAt": None, "createdAt": now()},
    {"id": str(uuid4()), "title": "Set the dinner table",     "description": "Lay out plates, cutlery, and glasses for the family.",     "points":  5, "imageEmoji": "🥄", "status": "open",    "assignedKidId": None,   "completedByKidId": None, "dueDate": None,                                            "expiredAt": None, "createdAt": now()},
    {"id": str(uuid4()), "title": "Fold the laundry",         "description": "Fold clean clothes from the dryer and put them away.",     "points": 12, "imageEmoji": "🧺", "status": "open",    "assignedKidId": "kid3", "completedByKidId": None, "dueDate": (date.today() + timedelta(days=5)).isoformat(), "expiredAt": None, "createdAt": now()},
    {"id": str(uuid4()), "title": "Feed the pet",             "description": "Fill the food and water bowl for the family pet.",         "points":  6, "imageEmoji": "🐕", "status": "open",    "assignedKidId": None,   "completedByKidId": None, "dueDate": None,                                            "expiredAt": None, "createdAt": now()},
    {"id": str(uuid4()), "title": "Sweep the porch",          "description": "Sweep leaves and dirt off the front porch.",               "points":  8, "imageEmoji": "🧹", "status": "open",    "assignedKidId": "kid2", "completedByKidId": None, "dueDate": (date.today() + timedelta(days=4)).isoformat(), "expiredAt": None, "createdAt": now()},
    {"id": str(uuid4()), "title": "Clean the garage",         "description": "Tidy up and sweep the garage floor.",                      "points": 25, "imageEmoji": "🏡", "status": "open",    "assignedKidId": None,   "completedByKidId": None, "dueDate": (date.today() - timedelta(days=2)).isoformat(), "expiredAt": None, "createdAt": now()},
    {"id": str(uuid4()), "title": "Wash the car",             "description": "Rinse, soap, and dry the family car.",                     "points": 20, "imageEmoji": "🚗", "status": "open",    "assignedKidId": "kid2", "completedByKidId": None, "dueDate": (date.today() - timedelta(days=1)).isoformat(), "expiredAt": None, "createdAt": now()},
    {"id": str(uuid4()), "title": "Vacuum the living room",        "description": "Vacuum carpets and clean under the sofa.",           "points": 15, "imageEmoji": "🏠", "status": "pending",  "assignedKidId": "kid2", "completedByKidId": "kid2", "dueDate": (date.today() + timedelta(days=1)).isoformat(), "expiredAt": None, "createdAt": now()},
    {"id": str(uuid4()), "title": "Wipe down the kitchen counter", "description": "Clean all kitchen surfaces with a damp cloth.",      "points":  7, "imageEmoji": "🧼", "status": "pending",  "assignedKidId": None,   "completedByKidId": "kid1", "dueDate": None,                                            "expiredAt": None, "createdAt": now()},
    {"id": str(uuid4()), "title": "Organise the bookshelf",        "description": "Sort books by size and put them back neatly.",       "points": 10, "imageEmoji": "📚", "status": "pending",  "assignedKidId": "kid3", "completedByKidId": "kid3", "dueDate": (date.today() - timedelta(days=1)).isoformat(), "expiredAt": None, "createdAt": now()},
    {"id": str(uuid4()), "title": "Clean the bathroom",   "description": "Scrub the sink, toilet, and wipe down surfaces.", "points": 20, "imageEmoji": "🚽", "status": "complete", "assignedKidId": "kid3", "completedByKidId": "kid3", "dueDate": None, "expiredAt": None, "createdAt": now()},
    {"id": str(uuid4()), "title": "Take out recycling",   "description": "Sort and take the recycling bins to the kerb.",   "points":  8, "imageEmoji": "♻️", "status": "complete", "assignedKidId": None,   "completedByKidId": "kid1", "dueDate": None, "expiredAt": None, "createdAt": now()},
    {"id": str(uuid4()), "title": "Mop the kitchen floor","description": "Mop the kitchen floor after sweeping.",           "points": 15, "imageEmoji": "🪣", "status": "complete", "assignedKidId": "kid2", "completedByKidId": "kid2", "dueDate": None, "expiredAt": None, "createdAt": now()},
]

SHOP_ITEMS = [
    {"id": str(uuid4()), "name": "Extra Screen Time (30 min)", "description": "Get 30 extra minutes of screen time today.", "cost": 10, "imageEmoji": "📱", "createdAt": now()},
    {"id": str(uuid4()), "name": "Choose Dinner",              "description": "Pick what the family eats for dinner.",       "cost": 25, "imageEmoji": "🍕", "createdAt": now()},
    {"id": str(uuid4()), "name": "Stay Up 1 Hour Later",       "description": "Extend bedtime by one hour on a weekend.",   "cost": 20, "imageEmoji": "🌙", "createdAt": now()},
    {"id": str(uuid4()), "name": "Movie Night Pick",           "description": "Choose the movie for family movie night.",   "cost": 15, "imageEmoji": "🎬", "createdAt": now()},
]

WALLETS: dict = {
    "kid1": {"balance": 30, "transactions": [{"id": str(uuid4()), "type": "earned", "amount": 30, "description": "Bonus points (seed)", "timestamp": now()}]},
    "kid2": {"balance": 0,  "transactions": []},
    "kid3": {"balance": 20, "transactions": [{"id": str(uuid4()), "type": "earned", "amount": 20, "description": "Earned: Clean the bathroom", "timestamp": now()}]},
}

SESSIONS: dict = {}

# ── Expiry helpers ────────────────────────────────────────────────────────────

def check_and_expire_chores():
    today = date.today().isoformat()
    for chore in CHORES:
        if chore["status"] in ("open", "pending") and chore["dueDate"] and chore["dueDate"] < today:
            chore["status"] = "expired"
            chore["expiredAt"] = now()

def visible_chores(chores: list) -> list:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    result = []
    for c in chores:
        if c["status"] == "expired" and c["expiredAt"]:
            if datetime.fromisoformat(c["expiredAt"]) < cutoff:
                continue
        result.append(c)
    return result

# ── Response helpers ──────────────────────────────────────────────────────────

def ok(data, status: int = 200):
    return JSONResponse({"success": True, "data": data}, status_code=status)

def fail(msg: str, status: int = 400):
    raise HTTPException(status_code=status, detail={"success": False, "error": msg})

# ── Auth helpers ──────────────────────────────────────────────────────────────

def get_user_by_token(authorization: Optional[str] = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:]
    user_id = SESSIONS.get(token)
    if not user_id:
        return None
    return next((u for u in USERS if u["id"] == user_id), None)

def require_auth(authorization: Optional[str] = Header(default=None)):
    user = get_user_by_token(authorization)
    if not user:
        fail("Unauthorized — valid Bearer token required", 401)
    return user

def require_parent(authorization: Optional[str] = Header(default=None)):
    user = require_auth(authorization)
    if user["role"] != "parent":
        fail("Forbidden — parents only", 403)
    return user

def require_kid(authorization: Optional[str] = Header(default=None)):
    user = require_auth(authorization)
    if user["role"] != "kid":
        fail("Forbidden — kids only", 403)
    return user

def get_family_id(user: dict) -> str:
    """Returns the primary parent ID whose kids this user manages."""
    return user.get("coParentOf") or user["id"]

def safe_user(u: dict) -> dict:
    return {"id": u["id"], "name": u["name"], "username": u["username"], "role": u["role"],
            "email": u.get("email"), "parentId": u.get("parentId"), "avatar": u.get("avatar"),
            "gender": u.get("gender"), "coParentOf": u.get("coParentOf")}

# ── Pydantic models ───────────────────────────────────────────────────────────

class LoginBody(BaseModel):
    username: str
    password: str

class RegisterBody(BaseModel):
    name: str
    email: str
    username: str
    password: str
    dateOfBirth: str   # "YYYY-MM-DD"
    gender: str        # "male" | "female" | "other"

class AddKidBody(BaseModel):
    name: str
    username: str
    password: str
    avatar: Optional[str] = "🐶"

class UpdateKidPasswordBody(BaseModel):
    password: str

class ChoreCreate(BaseModel):
    title: str
    points: float
    description: Optional[str] = ""
    assignedKidId: Optional[str] = None
    dueDate: Optional[str] = None
    imageEmoji: Optional[str] = "📋"

class ChoreUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    points: Optional[float] = None
    assignedKidId: Optional[str] = None
    status: Optional[str] = None
    dueDate: Optional[str] = None
    imageEmoji: Optional[str] = None

class ShopItemCreate(BaseModel):
    name: str
    cost: float
    description: Optional[str] = ""
    imageEmoji: Optional[str] = "🎁"

class ShopItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cost: Optional[float] = None
    imageEmoji: Optional[str] = None

# ── Auth routes ───────────────────────────────────────────────────────────────

@app.post("/api/auth/login")
def login(body: LoginBody):
    user = next((u for u in USERS if u["username"] == body.username and u["password"] == body.password), None)
    if not user:
        fail("Invalid credentials", 401)
    token = str(uuid4())
    SESSIONS[token] = user["id"]
    return ok({"token": token, "user": safe_user(user)})

@app.post("/api/auth/register")
def register(body: RegisterBody):
    # Validate email
    if not EMAIL_RE.match(body.email):
        fail("Please enter a valid email address")
    # Validate age >= 25
    try:
        age = calculate_age(body.dateOfBirth)
    except Exception:
        fail("Invalid date of birth — use YYYY-MM-DD format")
    if age < 25:
        fail("To register as Parent, you should be 25 years or more.")
    # Check uniqueness
    if any(u["username"] == body.username for u in USERS):
        fail("Username already taken")
    if any(u.get("email") == body.email for u in USERS):
        fail("Email address already registered")
    if len(body.name.strip()) < 2:
        fail("Name must be at least 2 characters")
    if len(body.password) < 4:
        fail("Password must be at least 4 characters")
    if body.gender not in ("male", "female", "other"):
        fail("Gender must be 'male', 'female', or 'other'")

    user = {
        "id": str(uuid4()),
        "name": body.name.strip(),
        "username": body.username.strip(),
        "password": body.password,
        "role": "parent",
        "email": body.email.lower().strip(),
        "dateOfBirth": body.dateOfBirth,
        "gender": body.gender,
        "parentId": None,
        "coParentOf": None,
    }
    USERS.append(user)
    token = str(uuid4())
    SESSIONS[token] = user["id"]
    return ok({"token": token, "user": safe_user(user)}, 201)

# ── User routes ───────────────────────────────────────────────────────────────

@app.get("/api/users/kids")
def list_kids(user=Depends(require_parent)):
    family_id = get_family_id(user)
    kids = [safe_user(u) for u in USERS if u["role"] == "kid" and u.get("parentId") == family_id]
    return ok(kids)

@app.get("/api/users/parents")
def list_parents(user=Depends(require_auth)):
    parents = [safe_user(u) for u in USERS if u["role"] == "parent"]
    return ok(parents)

# ── Kids management (parent adds/manages their own kids) ──────────────────────

@app.post("/api/kids")
def add_kid(body: AddKidBody, user=Depends(require_parent)):
    family_id = get_family_id(user)
    my_kids = [u for u in USERS if u["role"] == "kid" and u.get("parentId") == family_id]
    if len(my_kids) >= 10:
        fail("You can add a maximum of 10 children")
    if any(u["username"] == body.username for u in USERS):
        fail("Username already taken")
    if len(body.name.strip()) < 2:
        fail("Name must be at least 2 characters")
    if len(body.password) < 4:
        fail("Password must be at least 4 characters")

    kid = {
        "id": str(uuid4()),
        "name": body.name.strip(),
        "username": body.username.strip(),
        "password": body.password,
        "role": "kid",
        "email": None,
        "dateOfBirth": None,
        "parentId": family_id,
        "avatar": body.avatar or "🐶",
        "coParentOf": None,
    }
    USERS.append(kid)
    wallet_id = kid["id"]
    WALLETS[wallet_id] = {"balance": 0, "transactions": []}
    return ok(safe_user(kid), 201)

@app.put("/api/kids/{kid_id}/password")
def update_kid_password(kid_id: str, body: UpdateKidPasswordBody, user=Depends(require_parent)):
    family_id = get_family_id(user)
    kid = next((u for u in USERS if u["id"] == kid_id and u["role"] == "kid"), None)
    if not kid:
        fail("Child not found", 404)
    if kid.get("parentId") != family_id:
        fail("You can only update passwords for your own children", 403)
    if len(body.password) < 4:
        fail("Password must be at least 4 characters")
    kid["password"] = body.password
    return ok({"message": f"Password updated for {kid['name']}"})

# ── Co-parent routes ──────────────────────────────────────────────────────────

class CoParentBody(BaseModel):
    name: str
    username: str
    password: str

@app.get("/api/family/co-parent")
def get_co_parent(user=Depends(require_parent)):
    if user.get("coParentOf"):
        primary = next((u for u in USERS if u["id"] == user["coParentOf"]), None)
        return ok({"isCoParent": True, "coParent": None, "primaryParent": safe_user(primary) if primary else None})
    co_parent = next((u for u in USERS if u.get("coParentOf") == user["id"] and u["role"] == "parent"), None)
    return ok({"isCoParent": False, "coParent": safe_user(co_parent) if co_parent else None, "primaryParent": None})

@app.post("/api/family/co-parent")
def add_co_parent(body: CoParentBody, user=Depends(require_parent)):
    if user.get("coParentOf"):
        fail("Co-parents cannot create other co-parents")
    existing = next((u for u in USERS if u.get("coParentOf") == user["id"] and u["role"] == "parent"), None)
    if existing:
        fail("You already have a co-parent. Remove them first.")
    if any(u["username"] == body.username for u in USERS):
        fail("Username already taken")
    if len(body.name.strip()) < 2:
        fail("Name must be at least 2 characters")
    if len(body.password) < 4:
        fail("Password must be at least 4 characters")
    co_parent = {
        "id": str(uuid4()),
        "name": body.name.strip(),
        "username": body.username.strip(),
        "password": body.password,
        "role": "parent",
        "email": None,
        "dateOfBirth": None,
        "gender": None,
        "parentId": None,
        "coParentOf": user["id"],
        "avatar": None,
    }
    USERS.append(co_parent)
    return ok(safe_user(co_parent), 201)

@app.put("/api/family/co-parent/password")
def update_co_parent_password(body: UpdateKidPasswordBody, user=Depends(require_parent)):
    if user.get("coParentOf"):
        fail("Co-parents cannot change passwords via this endpoint")
    co_parent = next((u for u in USERS if u.get("coParentOf") == user["id"] and u["role"] == "parent"), None)
    if not co_parent:
        fail("No co-parent found")
    if len(body.password) < 4:
        fail("Password must be at least 4 characters")
    co_parent["password"] = body.password
    return ok({"message": f"Password updated for {co_parent['name']}"})

@app.delete("/api/family/co-parent")
def remove_co_parent(user=Depends(require_parent)):
    if user.get("coParentOf"):
        fail("Co-parents cannot revoke access themselves")
    co_parent = next((u for u in USERS if u.get("coParentOf") == user["id"] and u["role"] == "parent"), None)
    if not co_parent:
        fail("No co-parent found")
    USERS.remove(co_parent)
    return ok({"message": "Co-parent account removed"})

# ── Chore routes ──────────────────────────────────────────────────────────────

@app.get("/api/chores")
def get_chores(status: Optional[str] = None, kidId: Optional[str] = None, user=Depends(require_auth)):
    check_and_expire_chores()
    result = visible_chores(CHORES)
    if status:
        result = [c for c in result if c["status"] == status]
    if kidId:
        result = [c for c in result if c["assignedKidId"] == kidId or c["completedByKidId"] == kidId]
    return ok(result)

@app.post("/api/chores")
def create_chore(body: ChoreCreate, user=Depends(require_parent)):
    if body.points < 0:
        fail("points must be a non-negative number")
    if body.assignedKidId:
        kid = next((u for u in USERS if u["id"] == body.assignedKidId and u["role"] == "kid"), None)
        if not kid:
            fail("assignedKidId does not match any kid", 404)
    chore = {
        "id": str(uuid4()), "title": body.title,
        "description": body.description or "", "points": body.points,
        "imageEmoji": body.imageEmoji or "📋",
        "status": "open", "assignedKidId": body.assignedKidId,
        "completedByKidId": None, "dueDate": body.dueDate or None,
        "expiredAt": None, "createdAt": now(),
    }
    CHORES.append(chore)
    return ok(chore, 201)

@app.put("/api/chores/{chore_id}")
def update_chore(chore_id: str, body: ChoreUpdate, user=Depends(require_parent)):
    chore = next((c for c in CHORES if c["id"] == chore_id), None)
    if not chore:
        fail("Chore not found", 404)
    if body.title is not None:       chore["title"] = body.title
    if body.description is not None: chore["description"] = body.description
    if body.points is not None:
        if body.points < 0: fail("points must be a non-negative number")
        chore["points"] = body.points
    if body.assignedKidId is not None:
        if body.assignedKidId and not any(u["id"] == body.assignedKidId and u["role"] == "kid" for u in USERS):
            fail("assignedKidId does not match any kid", 404)
        chore["assignedKidId"] = body.assignedKidId or None
    if body.status is not None:
        if body.status not in ("open", "pending", "complete", "expired"):
            fail("Invalid status")
        chore["status"] = body.status
    if body.dueDate is not None:
        chore["dueDate"] = body.dueDate or None
        if chore["dueDate"]: chore["expiredAt"] = None
    if body.imageEmoji is not None: chore["imageEmoji"] = body.imageEmoji
    return ok(chore)

@app.delete("/api/chores/{chore_id}")
def delete_chore(chore_id: str, user=Depends(require_parent)):
    chore = next((c for c in CHORES if c["id"] == chore_id), None)
    if not chore: fail("Chore not found", 404)
    if chore["status"] not in ("open", "expired"): fail("Only open or expired chores can be deleted")
    CHORES.remove(chore)
    return ok(chore)

@app.post("/api/chores/{chore_id}/complete")
def complete_chore(chore_id: str, user=Depends(require_kid)):
    chore = next((c for c in CHORES if c["id"] == chore_id), None)
    if not chore: fail("Chore not found", 404)
    if chore["status"] != "open": fail("Only open chores can be marked complete")
    if chore["assignedKidId"] and chore["assignedKidId"] != user["id"]:
        fail("This chore is assigned to a different kid", 403)
    chore["status"] = "pending"
    chore["completedByKidId"] = user["id"]
    return ok(chore)

@app.post("/api/chores/{chore_id}/approve")
def approve_chore(chore_id: str, user=Depends(require_parent)):
    chore = next((c for c in CHORES if c["id"] == chore_id), None)
    if not chore: fail("Chore not found", 404)
    if chore["status"] != "pending": fail("Only pending chores can be approved")
    kid_id = chore["completedByKidId"]
    if not kid_id: fail("No kid associated with this chore")
    if kid_id not in WALLETS: WALLETS[kid_id] = {"balance": 0, "transactions": []}
    WALLETS[kid_id]["balance"] += chore["points"]
    WALLETS[kid_id]["transactions"].append({
        "id": str(uuid4()), "type": "earned",
        "amount": chore["points"], "description": f"Earned: {chore['title']}", "timestamp": now(),
    })
    chore["status"] = "complete"
    return ok({"chore": chore, "newBalance": WALLETS[kid_id]["balance"]})

@app.post("/api/chores/{chore_id}/reject")
def reject_chore(chore_id: str, user=Depends(require_parent)):
    chore = next((c for c in CHORES if c["id"] == chore_id), None)
    if not chore: fail("Chore not found", 404)
    if chore["status"] != "pending": fail("Only pending chores can be rejected")
    chore["status"] = "open"
    chore["completedByKidId"] = None
    return ok(chore)

# ── Shop routes ───────────────────────────────────────────────────────────────

@app.get("/api/shop")
def get_shop(user=Depends(require_auth)):
    return ok(SHOP_ITEMS)

@app.post("/api/shop")
def create_shop_item(body: ShopItemCreate, user=Depends(require_parent)):
    if body.cost < 0: fail("cost must be a non-negative number")
    item = {"id": str(uuid4()), "name": body.name, "description": body.description or "",
            "cost": body.cost, "imageEmoji": body.imageEmoji or "🎁", "createdAt": now()}
    SHOP_ITEMS.append(item)
    return ok(item, 201)

@app.put("/api/shop/{item_id}")
def update_shop_item(item_id: str, body: ShopItemUpdate, user=Depends(require_parent)):
    item = next((i for i in SHOP_ITEMS if i["id"] == item_id), None)
    if not item: fail("Shop item not found", 404)
    if body.name is not None:        item["name"] = body.name
    if body.description is not None: item["description"] = body.description
    if body.cost is not None:
        if body.cost < 0: fail("cost must be a non-negative number")
        item["cost"] = body.cost
    if body.imageEmoji is not None:  item["imageEmoji"] = body.imageEmoji
    return ok(item)

@app.delete("/api/shop/{item_id}")
def delete_shop_item(item_id: str, user=Depends(require_parent)):
    item = next((i for i in SHOP_ITEMS if i["id"] == item_id), None)
    if not item: fail("Shop item not found", 404)
    SHOP_ITEMS.remove(item)
    return ok(item)

@app.post("/api/shop/{item_id}/buy")
def buy_shop_item(item_id: str, user=Depends(require_kid)):
    item = next((i for i in SHOP_ITEMS if i["id"] == item_id), None)
    if not item: fail("Shop item not found", 404)
    kid_id = user["id"]
    if kid_id not in WALLETS: WALLETS[kid_id] = {"balance": 0, "transactions": []}
    if WALLETS[kid_id]["balance"] < item["cost"]:
        fail(f"Insufficient points. Need {item['cost']}, have {WALLETS[kid_id]['balance']}")
    WALLETS[kid_id]["balance"] -= item["cost"]
    WALLETS[kid_id]["transactions"].append({
        "id": str(uuid4()), "type": "spent",
        "amount": item["cost"], "description": f"Bought: {item['name']}", "timestamp": now(),
    })
    return ok({"item": item, "newBalance": WALLETS[kid_id]["balance"]})

# ── Wallet routes ─────────────────────────────────────────────────────────────

@app.get("/api/wallet")
def get_all_wallets(user=Depends(require_auth)):
    if user["role"] == "parent":
        kids = [u for u in USERS if u["role"] == "kid" and u.get("parentId") == user["id"]]
    else:
        kids = [u for u in USERS if u["id"] == user["id"]]
    summary = [
        {"kidId": k["id"], "name": k["name"],
         "balance": WALLETS.get(k["id"], {}).get("balance", 0),
         "transactionCount": len(WALLETS.get(k["id"], {}).get("transactions", []))}
        for k in kids
    ]
    return ok(summary)

@app.get("/api/wallet/{kid_id}")
def get_wallet(kid_id: str, user=Depends(require_auth)):
    if user["role"] == "kid" and user["id"] != kid_id:
        fail("Forbidden — you can only view your own wallet", 403)
    kid = next((u for u in USERS if u["id"] == kid_id and u["role"] == "kid"), None)
    if not kid: fail("Kid not found", 404)
    wallet = WALLETS.get(kid_id, {"balance": 0, "transactions": []})
    return ok({"kidId": kid_id, "name": kid["name"], "balance": wallet["balance"], "transactions": wallet["transactions"]})

# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 3001))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
