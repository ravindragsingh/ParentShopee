import re
import os
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from uuid import uuid4
from datetime import datetime, timezone, date, timedelta

from sqlalchemy import create_engine, Column, String, Float, and_, or_
from sqlalchemy.orm import sessionmaker, Session, declarative_base

# ── Database setup ─────────────────────────────────────────────────────────────

_DB_URL = os.environ.get("DATABASE_URL", "sqlite:///./parentshopee.db")
# Normalise URL: Render gives postgres://, psycopg3 dialect needs postgresql+psycopg://
if _DB_URL.startswith("postgres://"):
    _DB_URL = _DB_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif _DB_URL.startswith("postgresql://"):
    _DB_URL = _DB_URL.replace("postgresql://", "postgresql+psycopg://", 1)

_connect_args = {"check_same_thread": False} if _DB_URL.startswith("sqlite") else {}
_engine = create_engine(_DB_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
Base = declarative_base()

# ── ORM models ─────────────────────────────────────────────────────────────────

class DBUser(Base):
    __tablename__ = "users"
    id            = Column(String, primary_key=True)
    name          = Column(String, nullable=False)
    username      = Column(String, unique=True, nullable=False, index=True)
    password      = Column(String, nullable=False)
    role          = Column(String, nullable=False)   # parent | kid
    email         = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)
    gender        = Column(String, nullable=True)
    parent_id     = Column(String, nullable=True)    # for kids: their parent's id
    co_parent_of  = Column(String, nullable=True)    # for co-parents: primary parent's id
    avatar        = Column(String, nullable=True)

class DBChore(Base):
    __tablename__ = "chores"
    id                  = Column(String, primary_key=True)
    title               = Column(String, nullable=False)
    description         = Column(String, default="")
    points              = Column(Float,  default=0)
    image_emoji         = Column(String, default="📋")
    status              = Column(String, default="open", index=True)
    assigned_kid_id     = Column(String, nullable=True)
    completed_by_kid_id = Column(String, nullable=True)
    due_date            = Column(String, nullable=True)
    expired_at          = Column(String, nullable=True)
    completed_at        = Column(String, nullable=True)
    created_at          = Column(String, nullable=False)
    family_id           = Column(String, nullable=True, index=True)

class DBShopItem(Base):
    __tablename__ = "shop_items"
    id          = Column(String, primary_key=True)
    name        = Column(String, nullable=False)
    description = Column(String, default="")
    cost        = Column(Float,  nullable=False)
    image_emoji = Column(String, default="🎁")
    created_at  = Column(String, nullable=False)
    family_id   = Column(String, nullable=True, index=True)

class DBMessage(Base):
    __tablename__ = "messages"
    id            = Column(String, primary_key=True)
    sender_id     = Column(String, nullable=False, index=True)
    receiver_id   = Column(String, nullable=False, index=True)
    content       = Column(String, nullable=False)
    timestamp     = Column(String, nullable=False)
    is_read       = Column(String, default="false")
    quote_content = Column(String, nullable=True)   # quoted message for replies

class DBWallet(Base):
    __tablename__ = "wallets"
    kid_id  = Column(String, primary_key=True)
    balance = Column(Float,  default=0)

class DBTransaction(Base):
    __tablename__ = "transactions"
    id          = Column(String, primary_key=True)
    kid_id      = Column(String, nullable=False, index=True)
    type        = Column(String, nullable=False)   # earned | spent
    amount      = Column(Float,  nullable=False)
    description = Column(String, nullable=False)
    timestamp   = Column(String, nullable=False)

# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(title="ParentShopee API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')
SESSIONS: dict = {}   # token -> user_id  (in-memory; users re-login after restart)

# ── Age-appropriate content filter ─────────────────────────────────────────────
_RESTRICTED = [
    # Profanity
    "ass","arse","asshole","arsehole","bastard","bitch","bitches","bollocks",
    "bugger","bullshit","cock","cocks","crap","cum","cunt","cunts","damn",
    "dammit","dick","dicks","dickhead","douche","douchebag","dyke","faggot",
    "fag","fags","fart","fuck","fucked","fucker","fucking","fucks","fuckin",
    "goddamn","horseshit","jackass","motherfucker","mofo","nigga","nigger",
    "piss","pissed","prick","pricks","pussy","pussies","retard","retarded",
    "shit","shite","shitty","slut","sluts","turd","twat","twats","wank",
    "wanker","whore","whores",
    # Sexual
    "anal","blowjob","boner","clitoris","clit","dildo","erection","gangbang",
    "handjob","horny","masturbate","masturbation","milf","naked","nude","nudes",
    "orgasm","penis","porn","porno","pornography","prostitute","rape","raped",
    "sex","sexy","sperm","stripper","testicle","vagina","vibrator","xxx",
    # Drugs / alcohol
    "alcohol","beer","booze","cannabis","cocaine","crack","ecstasy","mdma",
    "heroin","marijuana","weed","methamphetamine","meth","opioid","opium",
    "overdose","stoned","vodka","whiskey","whisky","tequila","gin","rum",
    # Violence / hate
    "bomb","genocide","gore","hate","kill","killed","killer","killing",
    "murder","murdered","murderer","nazi","racist","racism","shoot","shooting",
    "stab","stabbing","suicide","terrorist","terrorism","torture","weapon","weapons",
]
_WORD_RE = re.compile(
    r'\b(' + '|'.join(re.escape(w) for w in _RESTRICTED if ' ' not in w) + r')\b',
    re.IGNORECASE,
)
_PHRASES = [w for w in _RESTRICTED if ' ' in w]

def _contains_restricted(text: str) -> Optional[str]:
    if not text:
        return None
    m = _WORD_RE.search(text)
    if m:
        return m.group(0)
    low = text.lower()
    for phrase in _PHRASES:
        if phrase in low:
            return phrase
    return None

def check_content(*fields: str) -> None:
    """Raises 400 if any field contains a restricted word."""
    for field in fields:
        word = _contains_restricted(field or "")
        if word:
            fail(f'Please use age-appropriate language. The word "{word}" is not allowed.')

# ── Helpers ────────────────────────────────────────────────────────────────────

def now() -> str:
    return datetime.now(timezone.utc).isoformat()

def calculate_age(dob_str: str) -> int:
    dob = date.fromisoformat(dob_str)
    t   = date.today()
    return t.year - dob.year - ((t.month, t.day) < (dob.month, dob.day))

def get_family_id(user: DBUser) -> str:
    return user.co_parent_of or user.id

def safe_user(u: DBUser) -> dict:
    return {"id": u.id, "name": u.name, "username": u.username, "role": u.role,
            "email": u.email, "parentId": u.parent_id, "avatar": u.avatar,
            "gender": u.gender, "coParentOf": u.co_parent_of}

def chore_dict(c: DBChore) -> dict:
    return {"id": c.id, "title": c.title, "description": c.description,
            "points": c.points, "imageEmoji": c.image_emoji, "status": c.status,
            "assignedKidId": c.assigned_kid_id, "completedByKidId": c.completed_by_kid_id,
            "dueDate": c.due_date, "expiredAt": c.expired_at,
            "completedAt": c.completed_at, "createdAt": c.created_at}

def shop_dict(s: DBShopItem) -> dict:
    return {"id": s.id, "name": s.name, "description": s.description,
            "cost": s.cost, "imageEmoji": s.image_emoji, "createdAt": s.created_at}

def ok(data, status: int = 200):
    return JSONResponse({"success": True, "data": data}, status_code=status)

def fail(msg: str, status: int = 400):
    raise HTTPException(status_code=status, detail={"success": False, "error": msg})

# ── DB dependency ──────────────────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── Chore expiry ───────────────────────────────────────────────────────────────

def check_and_expire_chores(db: Session):
    today = date.today().isoformat()
    db.query(DBChore).filter(
        DBChore.status.in_(["open", "pending"]),
        DBChore.due_date.isnot(None),
        DBChore.due_date < today,
    ).update({"status": "expired", "expired_at": now()}, synchronize_session=False)
    db.commit()

def get_visible_chores(db: Session, family_id: str = None, cutoff_hours: int = 72):
    ts = (datetime.now(timezone.utc) - timedelta(hours=cutoff_hours)).isoformat()
    q = db.query(DBChore).filter(
        # Hide expired chores older than cutoff
        ~and_(DBChore.status == "expired",
              DBChore.expired_at.isnot(None),
              DBChore.expired_at < ts),
        # Hide completed chores older than cutoff
        ~and_(DBChore.status == "complete",
              DBChore.completed_at.isnot(None),
              DBChore.completed_at < ts),
    )
    if family_id:
        q = q.filter(DBChore.family_id == family_id)
    return q.all()

# ── Auth dependencies ──────────────────────────────────────────────────────────

def require_auth(db: Session = Depends(get_db), authorization: Optional[str] = Header(default=None)) -> DBUser:
    if not authorization or not authorization.startswith("Bearer "):
        fail("Unauthorized — valid Bearer token required", 401)
    token = authorization[7:]
    user_id = SESSIONS.get(token)
    if not user_id:
        fail("Unauthorized — valid Bearer token required", 401)
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        fail("Unauthorized — valid Bearer token required", 401)
    return user

def require_parent(user: DBUser = Depends(require_auth)) -> DBUser:
    if user.role != "parent":
        fail("Forbidden — parents only", 403)
    return user

def require_kid(user: DBUser = Depends(require_auth)) -> DBUser:
    if user.role != "kid":
        fail("Forbidden — kids only", 403)
    return user

# ── Pydantic models ────────────────────────────────────────────────────────────

class LoginBody(BaseModel):
    username: str
    password: str

class RegisterBody(BaseModel):
    name: str
    email: str
    username: str
    password: str
    dateOfBirth: str
    gender: str

class AddKidBody(BaseModel):
    name: str
    username: str
    password: str
    avatar: Optional[str] = "🐶"

class UpdateKidPasswordBody(BaseModel):
    password: str

class CoParentBody(BaseModel):
    name: str
    username: str
    password: str

class BonusPointsBody(BaseModel):
    points: float
    reason: Optional[str] = "Bonus points"

class WalletAdjustBody(BaseModel):
    amount: float          # positive = add, negative = deduct
    reason: Optional[str] = ""

class MessageBody(BaseModel):
    receiver_id: str
    content: str
    quote_content: Optional[str] = None

class ChangeOwnPasswordBody(BaseModel):
    password: str

class ChoreCreate(BaseModel):
    title: str
    points: float
    description: Optional[str] = ""
    assignedKidId: Optional[str] = None        # single kid (legacy / repeat button)
    assignedKidIds: Optional[List[str]] = []   # multiple kids (new multi-assign)
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

# ── Seed data ──────────────────────────────────────────────────────────────────

def seed_db(db: Session):
    if db.query(DBUser).count() > 0:
        return   # already seeded

    today = date.today()

    for u in [
        DBUser(id="parent1", name="Mom",     username="parent1", password="pass1", role="parent", email="mom@family.com", date_of_birth="1980-03-10", gender="female"),
        DBUser(id="parent2", name="Dad",     username="parent2", password="pass2", role="parent", email="dad@family.com", date_of_birth="1978-07-22", gender="male"),
        DBUser(id="kid1",    name="Alice",   username="kid1",    password="pass1", role="kid",    parent_id="parent1", avatar="🐱"),
        DBUser(id="kid2",    name="Bob",     username="kid2",    password="pass1", role="kid",    parent_id="parent1", avatar="🐶"),
        DBUser(id="kid3",    name="Charlie", username="kid3",    password="pass1", role="kid",    parent_id="parent2", avatar="🦁"),
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

# ── Startup ────────────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup():
    from sqlalchemy import text
    Base.metadata.create_all(bind=_engine)
    # Add columns that may be missing from older databases
    _ts_now = now()
    with _engine.connect() as conn:
        for table, col, col_type in [
            ("chores",     "family_id",    "VARCHAR"),
            ("shop_items", "family_id",    "VARCHAR"),
            ("chores",     "completed_at", "VARCHAR"),
            ("messages",   "quote_content","VARCHAR"),
        ]:
            try:
                if "sqlite" in str(_engine.url):
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
        conn.commit()
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()

# ── Auth routes ────────────────────────────────────────────────────────────────

@app.post("/api/auth/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.username == body.username, DBUser.password == body.password).first()
    if not user:
        fail("Invalid credentials", 401)
    token = str(uuid4())
    SESSIONS[token] = user.id
    return ok({"token": token, "user": safe_user(user)})

@app.post("/api/auth/register")
def register(body: RegisterBody, db: Session = Depends(get_db)):
    if not EMAIL_RE.match(body.email):
        fail("Please enter a valid email address")
    try:
        age = calculate_age(body.dateOfBirth)
    except Exception:
        fail("Invalid date of birth — use YYYY-MM-DD format")
    if age < 25:
        fail("To register as Parent, you should be 25 years or more.")
    if db.query(DBUser).filter(DBUser.username == body.username.strip()).first():
        fail("Username already taken")
    if db.query(DBUser).filter(DBUser.email == body.email.lower().strip()).first():
        fail("Email address already registered")
    if len(body.name.strip()) < 2:
        fail("Name must be at least 2 characters")
    if len(body.password) < 4:
        fail("Password must be at least 4 characters")
    if body.gender not in ("male", "female", "other"):
        fail("Gender must be 'male', 'female', or 'other'")

    user = DBUser(
        id=str(uuid4()),
        name=body.name.strip(),
        username=body.username.strip(),
        password=body.password,
        role="parent",
        email=body.email.lower().strip(),
        date_of_birth=body.dateOfBirth,
        gender=body.gender,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = str(uuid4())
    SESSIONS[token] = user.id
    return ok({"token": token, "user": safe_user(user)}, 201)

# ── User routes ────────────────────────────────────────────────────────────────

@app.get("/api/users/kids")
def list_kids(db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    family_id = get_family_id(user)
    kids = db.query(DBUser).filter(DBUser.role == "kid", DBUser.parent_id == family_id).all()
    return ok([safe_user(k) for k in kids])

@app.get("/api/users/parents")
def list_parents(db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    parents = db.query(DBUser).filter(DBUser.role == "parent").all()
    return ok([safe_user(p) for p in parents])

# ── Kids management ────────────────────────────────────────────────────────────

@app.post("/api/kids")
def add_kid(body: AddKidBody, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    family_id = get_family_id(user)
    count = db.query(DBUser).filter(DBUser.role == "kid", DBUser.parent_id == family_id).count()
    if count >= 10:
        fail("You can add a maximum of 10 children")
    if db.query(DBUser).filter(DBUser.username == body.username.strip()).first():
        fail("Username already taken")
    if len(body.name.strip()) < 2:
        fail("Name must be at least 2 characters")
    if len(body.password) < 4:
        fail("Password must be at least 4 characters")

    kid = DBUser(
        id=str(uuid4()),
        name=body.name.strip(),
        username=body.username.strip(),
        password=body.password,
        role="kid",
        parent_id=family_id,
        avatar=body.avatar or "🐶",
    )
    db.add(kid)
    db.flush()   # get kid.id before commit
    db.add(DBWallet(kid_id=kid.id, balance=0))
    db.commit()
    db.refresh(kid)
    return ok(safe_user(kid), 201)

@app.post("/api/kids/{kid_id}/bonus")
def award_bonus(kid_id: str, body: BonusPointsBody, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid", DBUser.parent_id == family_id).first()
    if not kid:
        fail("Child not found or not in your family", 404)
    if body.points <= 0:
        fail("Points must be greater than 0")

    wallet = db.query(DBWallet).filter(DBWallet.kid_id == kid_id).first()
    if not wallet:
        wallet = DBWallet(kid_id=kid_id, balance=0)
        db.add(wallet)
        db.flush()

    wallet.balance += body.points
    db.add(DBTransaction(
        id=str(uuid4()), kid_id=kid_id, type="bonus",
        amount=body.points,
        description=body.reason.strip() if body.reason and body.reason.strip() else "Bonus points",
        timestamp=now(),
    ))
    db.commit()
    db.refresh(wallet)
    return ok({"kidName": kid.name, "pointsAwarded": body.points, "newBalance": wallet.balance})

@app.post("/api/kids/{kid_id}/wallet/adjust")
def adjust_wallet(kid_id: str, body: WalletAdjustBody, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    if body.amount == 0:
        fail("Amount cannot be zero")
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid", DBUser.parent_id == family_id).first()
    if not kid:
        fail("Child not found or not in your family", 404)
    wallet = db.query(DBWallet).filter(DBWallet.kid_id == kid_id).first()
    if not wallet:
        wallet = DBWallet(kid_id=kid_id, balance=0)
        db.add(wallet)
        db.flush()
    new_balance = wallet.balance + body.amount
    if new_balance < 0:
        fail(f"Cannot deduct more than current balance ({int(wallet.balance)} pts)")
    wallet.balance = new_balance
    tx_type = "bonus" if body.amount > 0 else "deduct"
    desc = body.reason.strip() if body.reason and body.reason.strip() else ("Bonus points" if body.amount > 0 else "Points adjusted")
    db.add(DBTransaction(id=str(uuid4()), kid_id=kid_id, type=tx_type, amount=abs(body.amount),
                         description=desc, timestamp=now()))
    db.commit()
    db.refresh(wallet)
    return ok({"kidName": kid.name, "adjustment": body.amount, "newBalance": wallet.balance})

@app.put("/api/kids/{kid_id}/password")
def update_kid_password(kid_id: str, body: UpdateKidPasswordBody, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid", DBUser.parent_id == family_id).first()
    if not kid:
        fail("Child not found or not in your family", 404)
    if len(body.password) < 4:
        fail("Password must be at least 4 characters")
    kid.password = body.password
    db.commit()
    return ok({"message": f"Password updated for {kid.name}"})

# ── Co-parent routes ───────────────────────────────────────────────────────────

@app.get("/api/family/co-parent")
def get_co_parent(db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    if user.co_parent_of:
        primary = db.query(DBUser).filter(DBUser.id == user.co_parent_of).first()
        return ok({"isCoParent": True, "coParent": None, "primaryParent": safe_user(primary) if primary else None})
    co_parent = db.query(DBUser).filter(DBUser.co_parent_of == user.id, DBUser.role == "parent").first()
    return ok({"isCoParent": False, "coParent": safe_user(co_parent) if co_parent else None, "primaryParent": None})

@app.post("/api/family/co-parent")
def add_co_parent(body: CoParentBody, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    if user.co_parent_of:
        fail("Co-parents cannot create other co-parents")
    if db.query(DBUser).filter(DBUser.co_parent_of == user.id, DBUser.role == "parent").first():
        fail("You already have a co-parent. Remove them first.")
    if db.query(DBUser).filter(DBUser.username == body.username.strip()).first():
        fail("Username already taken")
    if len(body.name.strip()) < 2:
        fail("Name must be at least 2 characters")
    if len(body.password) < 4:
        fail("Password must be at least 4 characters")

    co_parent = DBUser(
        id=str(uuid4()),
        name=body.name.strip(),
        username=body.username.strip(),
        password=body.password,
        role="parent",
        co_parent_of=user.id,
    )
    db.add(co_parent)
    db.commit()
    db.refresh(co_parent)
    return ok(safe_user(co_parent), 201)

@app.put("/api/family/co-parent/password")
def update_co_parent_password(body: UpdateKidPasswordBody, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    if user.co_parent_of:
        fail("Co-parents cannot change passwords via this endpoint")
    co_parent = db.query(DBUser).filter(DBUser.co_parent_of == user.id, DBUser.role == "parent").first()
    if not co_parent:
        fail("No co-parent found")
    if len(body.password) < 4:
        fail("Password must be at least 4 characters")
    co_parent.password = body.password
    db.commit()
    return ok({"message": f"Password updated for {co_parent.name}"})

@app.delete("/api/family/co-parent")
def remove_co_parent(db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    if user.co_parent_of:
        fail("Co-parents cannot revoke access themselves")
    co_parent = db.query(DBUser).filter(DBUser.co_parent_of == user.id, DBUser.role == "parent").first()
    if not co_parent:
        fail("No co-parent found")
    db.delete(co_parent)
    db.commit()
    return ok({"message": "Co-parent account removed"})

# ── Chore routes ───────────────────────────────────────────────────────────────

@app.get("/api/chores")
def get_chores(status: Optional[str] = None, kidId: Optional[str] = None,
               db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    check_and_expire_chores(db)
    # parents see their own family's chores; kids see chores from their parent's family
    fid = get_family_id(user) if user.role == "parent" else user.parent_id
    cutoff = 72 if user.role == "parent" else 48   # 3 days for parents, 2 days for kids
    chores = get_visible_chores(db, family_id=fid, cutoff_hours=cutoff)
    if status:
        chores = [c for c in chores if c.status == status]
    if kidId:
        chores = [c for c in chores if c.assigned_kid_id == kidId or c.completed_by_kid_id == kidId]
    return ok([chore_dict(c) for c in chores])

@app.post("/api/chores")
def create_chore(body: ChoreCreate, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    check_content(body.title, body.description or "")
    if body.points < 0:
        fail("points must be a non-negative number")
    # Resolve which kid IDs to assign — multi takes priority over single
    kid_ids: List[Optional[str]] = body.assignedKidIds if body.assignedKidIds else (
        [body.assignedKidId] if body.assignedKidId else [None]
    )
    # Validate every supplied kid ID
    for kid_id in kid_ids:
        if kid_id and not db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid").first():
            fail(f"Kid not found: {kid_id}", 404)
    family_id = get_family_id(user)
    created = []
    for kid_id in kid_ids:
        chore = DBChore(
            id=str(uuid4()),
            title=body.title,
            description=body.description or "",
            points=body.points,
            image_emoji=body.imageEmoji or "📋",
            assigned_kid_id=kid_id,
            due_date=body.dueDate or None,
            created_at=now(),
            family_id=family_id,
        )
        db.add(chore)
        created.append(chore)
    db.commit()
    for c in created:
        db.refresh(c)
    return ok([chore_dict(c) for c in created], 201)

@app.put("/api/chores/{chore_id}")
def update_chore(chore_id: str, body: ChoreUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    chore = db.query(DBChore).filter(DBChore.id == chore_id).first()
    if not chore:
        fail("Chore not found", 404)
    if body.title       is not None: chore.title       = body.title
    if body.description is not None: chore.description = body.description
    if body.points is not None:
        if body.points < 0: fail("points must be a non-negative number")
        chore.points = body.points
    if body.assignedKidId is not None:
        if body.assignedKidId and not db.query(DBUser).filter(DBUser.id == body.assignedKidId, DBUser.role == "kid").first():
            fail("assignedKidId does not match any kid", 404)
        chore.assigned_kid_id = body.assignedKidId or None
    if body.status is not None:
        if body.status not in ("open", "pending", "complete", "expired"):
            fail("Invalid status")
        chore.status = body.status
    if body.dueDate is not None:
        chore.due_date = body.dueDate or None
        if chore.due_date: chore.expired_at = None
    if body.imageEmoji is not None: chore.image_emoji = body.imageEmoji
    db.commit()
    db.refresh(chore)
    return ok(chore_dict(chore))

@app.delete("/api/chores/{chore_id}")
def delete_chore(chore_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    chore = db.query(DBChore).filter(DBChore.id == chore_id).first()
    if not chore: fail("Chore not found", 404)
    if chore.status not in ("open", "expired"): fail("Only open or expired chores can be deleted")
    db.delete(chore)
    db.commit()
    return ok(chore_dict(chore))

@app.post("/api/chores/{chore_id}/complete")
def complete_chore(chore_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_kid)):
    chore = db.query(DBChore).filter(DBChore.id == chore_id).first()
    if not chore: fail("Chore not found", 404)
    if chore.status != "open": fail("Only open chores can be marked complete")
    if chore.assigned_kid_id and chore.assigned_kid_id != user.id:
        fail("This chore is assigned to a different kid", 403)
    chore.status = "pending"
    chore.completed_by_kid_id = user.id
    db.commit()
    db.refresh(chore)
    return ok(chore_dict(chore))

@app.post("/api/chores/{chore_id}/approve")
def approve_chore(chore_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    chore = db.query(DBChore).filter(DBChore.id == chore_id).first()
    if not chore: fail("Chore not found", 404)
    if chore.status != "pending": fail("Only pending chores can be approved")
    kid_id = chore.completed_by_kid_id
    if not kid_id: fail("No kid associated with this chore")

    wallet = db.query(DBWallet).filter(DBWallet.kid_id == kid_id).first()
    if not wallet:
        wallet = DBWallet(kid_id=kid_id, balance=0)
        db.add(wallet)
        db.flush()

    wallet.balance += chore.points
    db.add(DBTransaction(id=str(uuid4()), kid_id=kid_id, type="earned",
                         amount=chore.points, description=f"Earned: {chore.title}", timestamp=now()))
    chore.status = "complete"
    chore.completed_at = now()
    db.commit()
    db.refresh(chore)
    db.refresh(wallet)
    return ok({"chore": chore_dict(chore), "newBalance": wallet.balance})

@app.post("/api/chores/{chore_id}/reject")
def reject_chore(chore_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    chore = db.query(DBChore).filter(DBChore.id == chore_id).first()
    if not chore: fail("Chore not found", 404)
    if chore.status != "pending": fail("Only pending chores can be rejected")
    chore.status = "open"
    chore.completed_by_kid_id = None
    db.commit()
    db.refresh(chore)
    return ok(chore_dict(chore))

# ── Shop routes ────────────────────────────────────────────────────────────────

@app.get("/api/shop")
def get_shop(db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    fid = get_family_id(user) if user.role == "parent" else user.parent_id
    items = db.query(DBShopItem).filter(DBShopItem.family_id == fid).all()
    return ok([shop_dict(s) for s in items])

@app.post("/api/shop")
def create_shop_item(body: ShopItemCreate, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    check_content(body.name, body.description or "")
    if body.cost < 0: fail("cost must be a non-negative number")
    item = DBShopItem(id=str(uuid4()), name=body.name.strip(), description=body.description or "",
                      cost=body.cost, image_emoji=body.imageEmoji or "🎁", created_at=now(),
                      family_id=get_family_id(user))
    db.add(item)
    db.commit()
    db.refresh(item)
    return ok(shop_dict(item), 201)

@app.put("/api/shop/{item_id}")
def update_shop_item(item_id: str, body: ShopItemUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    item = db.query(DBShopItem).filter(DBShopItem.id == item_id).first()
    if not item: fail("Shop item not found", 404)
    if body.name        is not None: item.name        = body.name.strip()
    if body.description is not None: item.description = body.description
    if body.cost        is not None:
        if body.cost < 0: fail("cost must be a non-negative number")
        item.cost = body.cost
    if body.imageEmoji  is not None: item.image_emoji = body.imageEmoji
    db.commit()
    db.refresh(item)
    return ok(shop_dict(item))

@app.delete("/api/shop/{item_id}")
def delete_shop_item(item_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    item = db.query(DBShopItem).filter(DBShopItem.id == item_id).first()
    if not item: fail("Shop item not found", 404)
    db.delete(item)
    db.commit()
    return ok(shop_dict(item))

@app.post("/api/shop/{item_id}/buy")
def buy_shop_item(item_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_kid)):
    item = db.query(DBShopItem).filter(DBShopItem.id == item_id).first()
    if not item: fail("Shop item not found", 404)

    wallet = db.query(DBWallet).filter(DBWallet.kid_id == user.id).first()
    if not wallet:
        wallet = DBWallet(kid_id=user.id, balance=0)
        db.add(wallet)
        db.flush()

    if wallet.balance < item.cost:
        fail(f"Insufficient points. Need {item.cost}, have {wallet.balance}")

    wallet.balance -= item.cost
    db.add(DBTransaction(id=str(uuid4()), kid_id=user.id, type="spent",
                         amount=item.cost, description=f"Bought: {item.name}", timestamp=now()))
    db.commit()
    db.refresh(wallet)
    return ok({"item": shop_dict(item), "newBalance": wallet.balance})

# ── Wallet routes ──────────────────────────────────────────────────────────────

@app.get("/api/wallet")
def get_all_wallets(db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    if user.role == "parent":
        family_id = get_family_id(user)
        kids = db.query(DBUser).filter(DBUser.role == "kid", DBUser.parent_id == family_id).all()
    else:
        kids = [user]

    result = []
    for k in kids:
        wallet = db.query(DBWallet).filter(DBWallet.kid_id == k.id).first()
        tx_count = db.query(DBTransaction).filter(DBTransaction.kid_id == k.id).count()
        result.append({"kidId": k.id, "name": k.name,
                        "balance": wallet.balance if wallet else 0,
                        "transactionCount": tx_count})
    return ok(result)

@app.get("/api/wallet/{kid_id}")
def get_wallet(kid_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    if user.role == "kid" and user.id != kid_id:
        fail("Forbidden — you can only view your own wallet", 403)
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid").first()
    if not kid: fail("Kid not found", 404)

    wallet = db.query(DBWallet).filter(DBWallet.kid_id == kid_id).first()
    txs    = db.query(DBTransaction).filter(DBTransaction.kid_id == kid_id)\
               .order_by(DBTransaction.timestamp.desc()).all()

    return ok({"kidId": kid_id, "name": kid.name,
               "balance": wallet.balance if wallet else 0,
               "transactions": [{"id": t.id, "type": t.type, "amount": t.amount,
                                  "description": t.description, "timestamp": t.timestamp}
                                 for t in txs]})

# ── Account routes ─────────────────────────────────────────────────────────────

@app.put("/api/auth/password")
def change_own_password(body: ChangeOwnPasswordBody, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    if not body.password or len(body.password) < 4:
        fail("Password must be at least 4 characters")
    user.password = body.password
    db.add(user); db.commit()
    return ok({"message": "Password updated"})

# ── Messaging routes ───────────────────────────────────────────────────────────

def _msg_dict(m: DBMessage) -> dict:
    return {"id": m.id, "senderId": m.sender_id, "receiverId": m.receiver_id,
            "content": m.content, "timestamp": m.timestamp, "isRead": m.is_read,
            "quoteContent": m.quote_content}

def _family_contacts(db: Session, user: DBUser) -> list:
    """Return all users this user is allowed to message."""
    family_id = get_family_id(user)
    contacts = []
    if user.role == "parent":
        contacts += db.query(DBUser).filter(DBUser.parent_id == family_id, DBUser.role == "kid").all()
        if user.co_parent_of:
            p = db.query(DBUser).filter(DBUser.id == user.co_parent_of).first()
            if p: contacts.append(p)
        else:
            cp = db.query(DBUser).filter(DBUser.co_parent_of == user.id).first()
            if cp: contacts.append(cp)
    else:
        p = db.query(DBUser).filter(DBUser.id == user.parent_id).first()
        if p: contacts.append(p)
        cp = db.query(DBUser).filter(DBUser.co_parent_of == user.parent_id).first()
        if cp: contacts.append(cp)
    return contacts

@app.get("/api/messages/contacts")
def get_contacts(db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    contacts = _family_contacts(db, user)
    result = []
    for c in contacts:
        conv_filter = or_(
            and_(DBMessage.sender_id == user.id, DBMessage.receiver_id == c.id),
            and_(DBMessage.sender_id == c.id,    DBMessage.receiver_id == user.id),
        )
        last = db.query(DBMessage).filter(conv_filter).order_by(DBMessage.timestamp.desc()).first()
        unread = db.query(DBMessage).filter(
            DBMessage.sender_id == c.id,
            DBMessage.receiver_id == user.id,
            DBMessage.is_read == "false",
        ).count()
        result.append({
            "id": c.id, "name": c.name, "role": c.role,
            "avatar": c.avatar if c.role == "kid" else None,
            "lastMessage": last.content if last else None,
            "lastMessageTime": last.timestamp if last else None,
            "unread": unread,
        })
    return ok(result)

@app.get("/api/messages/{contact_id}")
def get_conversation(contact_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    allowed = [c.id for c in _family_contacts(db, user)]
    if contact_id not in allowed:
        fail("Not allowed to message this user", 403)
    conv_filter = or_(
        and_(DBMessage.sender_id == user.id, DBMessage.receiver_id == contact_id),
        and_(DBMessage.sender_id == contact_id, DBMessage.receiver_id == user.id),
    )
    msgs = db.query(DBMessage).filter(conv_filter).order_by(DBMessage.timestamp.asc()).all()
    return ok([_msg_dict(m) for m in msgs[-20:]])  # return last 20 only

@app.post("/api/messages")
def send_message(body: MessageBody, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    text = body.content.strip()
    if not text:
        fail("Message cannot be empty")
    if len(text) > 60:
        fail("Message cannot exceed 60 characters")
    allowed = [c.id for c in _family_contacts(db, user)]
    if body.receiver_id not in allowed:
        fail("Not allowed to message this user", 403)
    msg = DBMessage(id=str(uuid4()), sender_id=user.id, receiver_id=body.receiver_id,
                    content=text, timestamp=now(), is_read="false",
                    quote_content=body.quote_content)
    db.add(msg); db.commit()
    # Prune conversation to 20 messages (rolling window)
    conv_filter = or_(
        and_(DBMessage.sender_id == user.id, DBMessage.receiver_id == body.receiver_id),
        and_(DBMessage.sender_id == body.receiver_id, DBMessage.receiver_id == user.id),
    )
    all_msgs = db.query(DBMessage).filter(conv_filter).order_by(DBMessage.timestamp.asc()).all()
    if len(all_msgs) > 20:
        for old in all_msgs[:len(all_msgs) - 20]:
            db.delete(old)
        db.commit()
    db.refresh(msg)
    return ok(_msg_dict(msg))

@app.put("/api/messages/{contact_id}/read")
def mark_read(contact_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    db.query(DBMessage).filter(
        DBMessage.sender_id == contact_id,
        DBMessage.receiver_id == user.id,
        DBMessage.is_read == "false",
    ).update({"is_read": "true"}, synchronize_session=False)
    db.commit()
    return ok({"marked": True})

# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 3001))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
