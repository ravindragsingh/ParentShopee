import re
import os
import json
import smtplib
import base64
import binascii
import urllib.request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from fastapi import FastAPI, HTTPException, Depends, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from starlette.responses import Response as StarletteResponse
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
    country            = Column(String, nullable=True)  # best-effort, from IP at registration
    city               = Column(String, nullable=True)  # best-effort, from IP at registration
    last_login_country = Column(String, nullable=True)  # best-effort, from IP on most recent login
    last_login_city    = Column(String, nullable=True)  # best-effort, from IP on most recent login
    chores_added_count     = Column(Float, default=0)  # lifetime count, shared by co-parent
    shop_items_added_count = Column(Float, default=0)  # lifetime count, shared by co-parent
    is_active               = Column(String, default="1")  # "1"/"0" — "0" only for parents pending email activation
    activation_token        = Column(String, nullable=True)
    activation_token_expires = Column(String, nullable=True)  # ISO timestamp

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
    template_id         = Column(String, nullable=True, index=True)
    scheduled_date      = Column(String, nullable=True)

class DBRecurringTemplate(Base):
    __tablename__ = "recurring_templates"
    id              = Column(String, primary_key=True)
    title           = Column(String, nullable=False)
    description     = Column(String, default="")
    points          = Column(Float,  default=0)
    image_emoji     = Column(String, default="📋")
    assigned_kid_id = Column(String, nullable=True)
    recurrence_type = Column(String, nullable=False)   # daily | weekly | monthly
    recurrence_days = Column(String, nullable=True)    # CSV of weekday ints e.g. "0,2,4"
    recurrence_dom  = Column(String, nullable=True)    # day-of-month for monthly
    family_id       = Column(String, nullable=True, index=True)
    is_active       = Column(String, default="1")      # "1" or "0"
    created_at      = Column(String, nullable=False)

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

EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')
SESSIONS: dict = {}   # token -> user_id  (in-memory; users re-login after restart)

CONTACT_EMAIL = os.getenv("CONTACT_EMAIL", "ravindragsingh@gmail.com")
FRONTEND_URL  = os.getenv("FRONTEND_URL", "http://localhost:5173")

SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
try:
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
except ValueError:
    SMTP_PORT = 587
    print("[email] SMTP_PORT env var is not a valid integer, defaulting to 587")
SMTP_USER     = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

if not SMTP_USER or not SMTP_PASSWORD:
    print("[email] WARNING: SMTP_USER and/or SMTP_PASSWORD are not set — outgoing emails will not be sent")

def send_email(to_addr: str, subject: str, body_text: str) -> bool:
    """Best-effort plain-text email send. Returns True if actually sent. If SMTP
    creds aren't configured (e.g. local dev), logs the content instead so the flow
    is still testable, and callers treat that as success (matches existing /api/contact
    behaviour)."""
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"[email — not configured] To: {to_addr}\nSubject: {subject}\n{body_text}")
        return True
    try:
        msg = MIMEMultipart()
        msg["From"] = SMTP_USER
        msg["To"] = to_addr
        msg["Subject"] = subject
        msg.attach(MIMEText(body_text, "plain"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as srv:
            srv.starttls()
            srv.login(SMTP_USER, SMTP_PASSWORD)
            srv.send_message(msg)
        return True
    except Exception as exc:
        print(f"[email] send failed: {exc}")
        return False

# ── Custom chore / shop item limits ─────────────────────────────────────────────
# Families can add as many chores/rewards as they want by picking from the built-in
# sample list (title/name kept as-is). Only items with a title/name that doesn't
# match a sample — i.e. genuinely custom ones — count against the lifetime cap
# (one-off chores + recurring templates counted together, shop items separately).
# Deleting an item does NOT free up a slot. Families that need more custom items
# should contact support. Keep these two sets in sync with SAMPLE_CHORES /
# SAMPLE_SHOP_ITEMS in frontend/src/components/ParentDashboard.jsx.
LIMIT_EXTRA_CHORES     = 10
LIMIT_EXTRA_SHOP_ITEMS = 10

SAMPLE_CHORE_TITLES = {t.lower() for t in [
    "Clean up your toys", "Put dirty clothes in hamper", "Pack your school bag",
    "Put shoes away", "Clear your plate after eating", "Feed the pet",
    "Water the plants", "Make your bed", "Tidy your bedroom", "Sort the recycling",
    "Dust the furniture", "Help carry groceries", "Set the dinner table",
    "Wipe down the bathroom sink", "Empty small bins", "Put books back on shelf",
    "Wash the dishes", "Take out the trash", "Fold the laundry", "Sweep the floor",
    "Vacuum the living room", "Clean the bathroom", "Wash the car", "Mop the floor",
    "Empty the dishwasher", "Wipe kitchen surfaces", "Tidy the living room",
    "Sweep the porch",
]}

SAMPLE_SHOP_ITEM_NAMES = {n.lower() for n in [
    "Extra Screen Time (30 min)", "Extra Screen Time (1 hour)", "Video Game Session",
    "Download a New App or Game", "YouTube / Streaming Hour", "Choose Dinner Tonight",
    "Dessert of Your Choice", "Ice Cream Trip", "Skip Vegetables at Dinner",
    "Breakfast in Bed", "Stay Up 30 Minutes Later", "Stay Up 1 Hour Later",
    "Skip One Chore (one-time)", "Movie Night Pick", "Friend Can Come Over",
    "Sleepover with a Friend", "Trip to the Park", "Bowling / Mini Golf Trip",
    "Choose Weekend Activity", "New Book of Your Choice", "New Toy or Small Gift",
    "Extra Pocket Money", "No Chores Day",
]}

def is_sample_chore(title: str) -> bool:
    return (title or "").strip().lower() in SAMPLE_CHORE_TITLES

def is_sample_shop_item(name: str) -> bool:
    return (name or "").strip().lower() in SAMPLE_SHOP_ITEM_NAMES

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
    # Sexual phrases (innocuous words combined into an adult meaning)
    "sleep with","sleeping with","slept with","in bed with","spend the night with",
    "spending the night with","make out with","making out with","make out",
    "making out","hook up with","hooking up with","hook up","hooking up",
    "hooked up with","friends with benefits","one night stand","get naked",
    "getting naked","take off your clothes","netflix and chill",
    # Drugs / alcohol
    "alcohol","beer","booze","cannabis","cocaine","crack","ecstasy","mdma",
    "heroin","marijuana","weed","methamphetamine","meth","opioid","opium",
    "overdose","stoned","vodka","whiskey","whisky","tequila","gin","rum",
    # Drug phrases
    "get high","getting high","do drugs","doing drugs","take drugs","smoke weed",
    # Violence / hate
    "bomb","choke","choked","choking","execute","executed","execution",
    "genocide","gore","gun","guns","hang","hanged","hanging","hate","hated",
    "hates","hating","kill","killed","killer","killing","kys",
    "murder","murdered","murderer","nazi","racist","racism","shoot","shooting",
    "stab","stabbing","suicide","terrorist","terrorism","torture","weapon","weapons",
    # Violence phrases
    "beat up","beat him up","beat her up","beat you up","burn down","burn it down",
    "set fire to","blow up","blow it up",
    # Self-harm / suicide phrases
    "hurt myself","hurting myself","cut myself","cutting myself","harm myself",
    "self-harm","selfharm","self harm",
    "end my life","end it all","want to die","wanna die","should die","go die",
    "kill yourself","kill urself","hang yourself","shoot yourself",
    "jump off a bridge","jump off a building","better off dead",
    "not worth living","no reason to live",
    # Bullying / harassment
    "bully","bullying","bullied","loser","losers","pathetic","worthless",
    "idiot","idiots","stupid","dumb","ugly","freak","weirdo","fat",
    # Bullying phrases
    "nobody likes you","no one likes you","everybody hates you",
    "everyone hates you","no one wants you","no one cares about you",
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

def check_password_complexity(password: str) -> None:
    """Raises 400 unless the password meets complexity rules. Applies to new
    accounts and password resets — NOT to login, so existing passwords still work."""
    if not password or len(password) < 8:
        fail("Password must be at least 8 characters long")
    if not re.search(r'[A-Z]', password):
        fail("Password must contain at least one uppercase letter")
    if not re.search(r'[0-9]', password):
        fail("Password must contain at least one number")
    if not re.search(r'[^A-Za-z0-9]', password):
        fail("Password must contain at least one special character")

# ── Helpers ────────────────────────────────────────────────────────────────────

def now() -> str:
    return datetime.now(timezone.utc).isoformat()

def calculate_age(dob_str: str) -> int:
    dob = date.fromisoformat(dob_str)
    t   = date.today()
    return t.year - dob.year - ((t.month, t.day) < (dob.month, dob.day))

_PRIVATE_IP_PREFIXES = ("127.", "10.", "192.168.", "::1", "localhost")

def get_client_ip(request: StarletteRequest) -> str:
    """Real client IP, respecting X-Forwarded-For set by the hosting proxy (e.g. Render)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else ""

def get_location_from_ip(ip: str) -> dict:
    """Best-effort IP geolocation for admin filtering. Never raises — registration
    must succeed even if the lookup fails or the service is unreachable."""
    if not ip or ip.startswith(_PRIVATE_IP_PREFIXES) or ip.startswith("172."):
        return {"country": None, "city": None}
    try:
        req = urllib.request.Request(
            f"https://ipapi.co/{ip}/json/",
            headers={"User-Agent": "RewardUrKids/1.0"},
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode())
        if data.get("error"):
            return {"country": None, "city": None}
        return {"country": data.get("country_name"), "city": data.get("city")}
    except Exception:
        return {"country": None, "city": None}

def _record_login_location(user_id: str, ip: str) -> None:
    """Runs after the login response is already sent, so the geolocation lookup
    never adds latency to sign-in. Opens its own DB session (the request's is
    closed by then)."""
    location = get_location_from_ip(ip)
    if not location["country"] and not location["city"]:
        return
    db = SessionLocal()
    try:
        u = db.query(DBUser).filter(DBUser.id == user_id).first()
        if u:
            u.last_login_country = location["country"]
            u.last_login_city = location["city"]
            db.commit()
    finally:
        db.close()

def get_family_id(user: DBUser) -> str:
    return user.co_parent_of or user.id

def get_family_owner(db: Session, user: DBUser) -> DBUser:
    """The primary parent's row — where shared lifetime add-counters live."""
    return db.query(DBUser).filter(DBUser.id == get_family_id(user)).first()

def check_add_limit(db: Session, user: DBUser, field: str, extra: int, limit: int, item_label: str) -> DBUser:
    """Raises 400 if adding `extra` more items would exceed the family's lifetime limit."""
    owner = get_family_owner(db, user)
    current = getattr(owner, field) or 0
    if current + extra > limit:
        fail(
            f"You've reached the limit of {limit} custom {item_label} for your family. "
            f"To add more, please contact our support team at {CONTACT_EMAIL}.",
            403,
        )
    return owner

def safe_user(u: DBUser) -> dict:
    return {"id": u.id, "name": u.name, "username": u.username, "role": u.role,
            "email": u.email, "parentId": u.parent_id, "avatar": u.avatar,
            "gender": u.gender, "coParentOf": u.co_parent_of,
            "country": u.country, "city": u.city,
            "lastLoginCountry": u.last_login_country, "lastLoginCity": u.last_login_city}

def chore_dict(c: DBChore) -> dict:
    return {"id": c.id, "title": c.title, "description": c.description,
            "points": c.points, "imageEmoji": c.image_emoji, "status": c.status,
            "assignedKidId": c.assigned_kid_id, "completedByKidId": c.completed_by_kid_id,
            "dueDate": c.due_date, "expiredAt": c.expired_at,
            "completedAt": c.completed_at, "createdAt": c.created_at,
            "templateId": c.template_id, "scheduledDate": c.scheduled_date}

def recurring_dict(t: DBRecurringTemplate) -> dict:
    days = [int(x) for x in t.recurrence_days.split(',') if x.strip()] if t.recurrence_days else []
    return {
        "id": t.id, "title": t.title, "description": t.description,
        "points": t.points, "imageEmoji": t.image_emoji,
        "assignedKidId": t.assigned_kid_id,
        "recurrenceType": t.recurrence_type,
        "recurrenceDays": days,
        "recurrenceDom": int(t.recurrence_dom) if t.recurrence_dom else None,
        "createdAt": t.created_at,
    }

def shop_dict(s: DBShopItem) -> dict:
    return {"id": s.id, "name": s.name, "description": s.description,
            "cost": s.cost, "imageEmoji": s.image_emoji, "createdAt": s.created_at}

def ok(data, status: int = 200):
    return JSONResponse({"success": True, "data": data}, status_code=status)

def fail(msg: str, status: int = 400, code: Optional[str] = None):
    detail = {"success": False, "error": msg}
    if code:
        detail["code"] = code
    raise HTTPException(status_code=status, detail=detail)

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
    today_str = date.today().isoformat()
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
        # Hide recurring instances scheduled for a future date
        ~and_(DBChore.template_id.isnot(None),
              DBChore.scheduled_date > today_str),
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

def require_admin(user: DBUser = Depends(require_auth)) -> DBUser:
    if user.role != "admin":
        fail("Forbidden — admin only", 403)
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

class ActivateBody(BaseModel):
    token: str

class ResendActivationBody(BaseModel):
    username: str

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

class BehaviourBody(BaseModel):
    points: int  # positive = award, negative = remove

class ContactTicketBody(BaseModel):
    category: Optional[str] = "General Inquiry"
    subject: str
    message: str
    screenshot_b64: Optional[str] = None  # base64 data-URL of attached image

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

class RecurringCreate(BaseModel):
    title: str
    points: float
    description: Optional[str] = ""
    imageEmoji: Optional[str] = "📋"
    assignedKidId: Optional[str] = None
    recurrenceType: str                      # daily | weekly | monthly
    recurrenceDays: Optional[List[int]] = [] # weekday ints (0=Mon) for weekly
    recurrenceDom: Optional[int] = None      # day of month for monthly

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

class AdminUserUpdate(BaseModel):
    name:     Optional[str] = None
    email:    Optional[str] = None
    password: Optional[str] = None
    avatar:   Optional[str] = None

class AdminChoreUpdate(BaseModel):
    title:         Optional[str]   = None
    description:   Optional[str]   = None
    points:        Optional[float] = None
    status:        Optional[str]   = None
    assignedKidId: Optional[str]   = None
    dueDate:       Optional[str]   = None
    imageEmoji:    Optional[str]   = None

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

# ── Auth routes ────────────────────────────────────────────────────────────────

@app.post("/api/auth/login")
def login(body: LoginBody, request: StarletteRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.username == body.username, DBUser.password == body.password).first()
    if not user:
        fail("Invalid credentials", 401)
    if user.is_active != "1":
        fail(
            "Please activate your account before signing in — check your email for the activation link.",
            403,
            code="account_not_activated",
        )
    token = str(uuid4())
    SESSIONS[token] = user.id
    background_tasks.add_task(_record_login_location, user.id, get_client_ip(request))
    return ok({"token": token, "user": safe_user(user)})

ACTIVATION_TOKEN_TTL_HOURS = 24

def _send_activation_email(user: DBUser) -> bool:
    link = f"{FRONTEND_URL}/activate?token={user.activation_token}"
    subject = "Activate your Reward Ur Kids account"
    body_text = (
        f"Hi {user.name},\n\n"
        f"Thanks for signing up for Reward Ur Kids! Please activate your account by "
        f"clicking the link below:\n\n"
        f"    {link}\n\n"
        f"This link expires in {ACTIVATION_TOKEN_TTL_HOURS} hours. If you didn't create "
        f"this account, you can safely ignore this email.\n"
    )
    return send_email(user.email, subject, body_text)

@app.post("/api/auth/register")
def register(body: RegisterBody, request: StarletteRequest, db: Session = Depends(get_db)):
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
    check_password_complexity(body.password)
    if body.gender not in ("male", "female", "other"):
        fail("Gender must be 'male', 'female', or 'other'")

    location = get_location_from_ip(get_client_ip(request))
    expires = (datetime.now(timezone.utc) + timedelta(hours=ACTIVATION_TOKEN_TTL_HOURS)).isoformat()

    user = DBUser(
        id=str(uuid4()),
        name=body.name.strip(),
        username=body.username.strip(),
        password=body.password,
        role="parent",
        email=body.email.lower().strip(),
        date_of_birth=body.dateOfBirth,
        gender=body.gender,
        country=location["country"],
        city=location["city"],
        is_active="0",
        activation_token=str(uuid4()),
        activation_token_expires=expires,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if not _send_activation_email(user):
        fail("Account created, but we couldn't send the activation email. Please try 'Resend activation email' from the sign-in page.", 500)

    return ok({
        "activationRequired": True,
        "email": user.email,
        "message": "Account created! Check your email for a link to activate your account.",
    }, 201)

@app.post("/api/auth/activate")
def activate_account(body: ActivateBody, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.activation_token == body.token).first()
    if not user:
        fail("This activation link is invalid. It may have already been used — try signing in, or request a new link.")
    if user.is_active == "1":
        return ok({"message": "Your account is already active. You can sign in now."})
    if user.activation_token_expires and datetime.fromisoformat(user.activation_token_expires) < datetime.now(timezone.utc):
        fail("This activation link has expired. Please request a new one from the sign-in page.")
    user.is_active = "1"
    user.activation_token = None
    user.activation_token_expires = None
    db.commit()
    return ok({"message": "Account activated! You can sign in now."})

@app.post("/api/auth/resend-activation")
def resend_activation(body: ResendActivationBody, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.username == body.username.strip()).first()
    if not user:
        fail("No account found with that username.")
    if user.is_active == "1":
        return ok({"message": "This account is already active. You can sign in now."})
    user.activation_token = str(uuid4())
    user.activation_token_expires = (datetime.now(timezone.utc) + timedelta(hours=ACTIVATION_TOKEN_TTL_HOURS)).isoformat()
    db.commit()
    if not _send_activation_email(user):
        fail("Failed to send the activation email. Please try again shortly.", 500)
    return ok({"message": f"Activation email resent to {user.email}."})

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
    check_password_complexity(body.password)

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
    if body.reason and len(body.reason.strip()) > 15:
        fail("Message must be 15 characters or fewer")
    check_content(body.reason or "")
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

@app.post("/api/kids/{kid_id}/behaviour")
def award_behaviour(kid_id: str, body: BehaviourBody, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    if body.points == 0:
        fail("Points cannot be zero")
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid", DBUser.parent_id == family_id).first()
    if not kid:
        fail("Child not found or not in your family", 404)
    wallet = db.query(DBWallet).filter(DBWallet.kid_id == kid_id).first()
    if not wallet:
        wallet = DBWallet(kid_id=kid_id, balance=0)
        db.add(wallet)
        db.flush()
    if body.points < 0 and wallet.balance + body.points < 0:
        fail(f"Cannot remove more than current balance ({int(wallet.balance)} pts)")
    wallet.balance += body.points
    tx_type = "behaviour" if body.points > 0 else "behaviour_deduct"
    desc = "Bonus received for good behaviour" if body.points > 0 else "Good behaviour points removed"
    db.add(DBTransaction(
        id=str(uuid4()), kid_id=kid_id, type=tx_type,
        amount=abs(body.points), description=desc, timestamp=now(),
    ))
    db.commit()
    db.refresh(wallet)
    return ok({"kidName": kid.name, "points": body.points, "newBalance": wallet.balance})

@app.put("/api/kids/{kid_id}/password")
def update_kid_password(kid_id: str, body: UpdateKidPasswordBody, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid", DBUser.parent_id == family_id).first()
    if not kid:
        fail("Child not found or not in your family", 404)
    check_password_complexity(body.password)
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
    check_password_complexity(body.password)

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
    check_password_complexity(body.password)
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

# ── Recurring chore helper ─────────────────────────────────────────────────────

def _generate_instances(db: Session, template: DBRecurringTemplate):
    today = date.today()
    today_str = today.isoformat()
    # Remove any stale open instances scheduled beyond today
    db.query(DBChore).filter(
        DBChore.template_id == template.id,
        DBChore.status == "open",
        DBChore.scheduled_date > today_str,
    ).delete(synchronize_session=False)
    db.commit()
    weekly_days: List[int] = []
    if template.recurrence_days:
        try:
            weekly_days = [int(x) for x in template.recurrence_days.split(',') if x.strip()]
        except Exception:
            weekly_days = []

    for delta in range(1):  # only today — tomorrow's instance is created when tomorrow arrives
        target = today + timedelta(days=delta)
        date_str = target.isoformat()

        if template.recurrence_type == 'daily':
            matches = True
        elif template.recurrence_type == 'weekly':
            matches = target.weekday() in weekly_days
        elif template.recurrence_type == 'monthly':
            dom = int(template.recurrence_dom) if template.recurrence_dom else 1
            matches = target.day == dom
        else:
            matches = False

        if not matches:
            continue

        existing = db.query(DBChore).filter(
            DBChore.template_id == template.id,
            DBChore.scheduled_date == date_str,
        ).first()
        if existing:
            continue

        chore = DBChore(
            id=str(uuid4()),
            title=template.title,
            description=template.description or "",
            points=template.points,
            image_emoji=template.image_emoji or "📋",
            status="open",
            assigned_kid_id=template.assigned_kid_id,
            due_date=date_str,
            created_at=now(),
            family_id=template.family_id,
            template_id=template.id,
            scheduled_date=date_str,
        )
        db.add(chore)
    db.commit()

# ── Add-limits route ───────────────────────────────────────────────────────────

@app.get("/api/limits")
def get_add_limits(db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    owner = get_family_owner(db, user)
    return ok({
        "choresUsed":       int(owner.chores_added_count or 0),
        "choresLimit":      LIMIT_EXTRA_CHORES,
        "shopItemsUsed":    int(owner.shop_items_added_count or 0),
        "shopItemsLimit":   LIMIT_EXTRA_SHOP_ITEMS,
        "supportEmail":     CONTACT_EMAIL,
    })

# ── Chore routes ───────────────────────────────────────────────────────────────

@app.get("/api/chores")
def get_chores(status: Optional[str] = None, kidId: Optional[str] = None,
               db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    check_and_expire_chores(db)
    # parents see their own family's chores; kids see chores from their parent's family
    fid = get_family_id(user) if user.role == "parent" else user.parent_id
    # Generate any missing instances for active recurring templates in this family
    for t in db.query(DBRecurringTemplate).filter(
        DBRecurringTemplate.family_id == fid,
        DBRecurringTemplate.is_active == "1",
    ).all():
        _generate_instances(db, t)
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
    family_id = get_family_id(user)
    if db.query(DBUser).filter(DBUser.role == "kid", DBUser.parent_id == family_id).count() == 0:
        fail("Please add a child first before creating chores.")
    # Resolve which kid IDs to assign — multi takes priority over single
    kid_ids: List[Optional[str]] = body.assignedKidIds if body.assignedKidIds else (
        [body.assignedKidId] if body.assignedKidId else [None]
    )
    # Validate every supplied kid ID
    for kid_id in kid_ids:
        if kid_id and not db.query(DBUser).filter(DBUser.id == kid_id, DBUser.role == "kid").first():
            fail(f"Kid not found: {kid_id}", 404)
    from_sample = is_sample_chore(body.title)
    owner = get_family_owner(db, user)
    if not from_sample:
        owner = check_add_limit(db, user, "chores_added_count", len(kid_ids), LIMIT_EXTRA_CHORES, "chores")
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
    if not from_sample:
        owner.chores_added_count = (owner.chores_added_count or 0) + len(kid_ids)
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

# ── Recurring template routes ──────────────────────────────────────────────────

@app.post("/api/recurring")
def create_recurring(body: RecurringCreate, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    check_content(body.title, body.description or "")
    if body.points < 0:
        fail("points must be a non-negative number")
    if body.recurrenceType not in ('daily', 'weekly', 'monthly'):
        fail("recurrenceType must be daily, weekly, or monthly")
    if body.recurrenceType == 'weekly' and not body.recurrenceDays:
        fail("Select at least one day for weekly recurrence")
    if body.recurrenceType == 'monthly' and not body.recurrenceDom:
        fail("Specify a day of month for monthly recurrence")

    family_id = get_family_id(user)
    if db.query(DBUser).filter(DBUser.role == "kid", DBUser.parent_id == family_id).count() == 0:
        fail("Please add a child first before creating chores.")

    from_sample = is_sample_chore(body.title)
    owner = get_family_owner(db, user)
    if not from_sample:
        owner = check_add_limit(db, user, "chores_added_count", 1, LIMIT_EXTRA_CHORES, "chores")
    rec_days = ','.join(str(d) for d in body.recurrenceDays) if body.recurrenceDays else None
    rec_dom = str(body.recurrenceDom) if body.recurrenceDom else None

    template = DBRecurringTemplate(
        id=str(uuid4()),
        title=body.title,
        description=body.description or "",
        points=body.points,
        image_emoji=body.imageEmoji or "📋",
        assigned_kid_id=body.assignedKidId or None,
        recurrence_type=body.recurrenceType,
        recurrence_days=rec_days,
        recurrence_dom=rec_dom,
        family_id=family_id,
        is_active="1",
        created_at=now(),
    )
    db.add(template)
    if not from_sample:
        owner.chores_added_count = (owner.chores_added_count or 0) + 1
    db.commit()
    db.refresh(template)
    _generate_instances(db, template)
    return ok(recurring_dict(template), 201)

@app.get("/api/recurring")
def list_recurring(db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    family_id = get_family_id(user)
    templates = db.query(DBRecurringTemplate).filter(
        DBRecurringTemplate.family_id == family_id,
        DBRecurringTemplate.is_active == "1",
    ).all()
    return ok([recurring_dict(t) for t in templates])

@app.delete("/api/recurring/{template_id}")
def delete_recurring(template_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_parent)):
    family_id = get_family_id(user)
    template = db.query(DBRecurringTemplate).filter(
        DBRecurringTemplate.id == template_id,
        DBRecurringTemplate.family_id == family_id,
    ).first()
    if not template:
        fail("Template not found", 404)
    today_str = date.today().isoformat()
    db.query(DBChore).filter(
        DBChore.template_id == template_id,
        DBChore.status == "open",
        DBChore.scheduled_date >= today_str,
    ).delete(synchronize_session=False)
    db.commit()
    template.is_active = "0"
    db.commit()
    return ok(recurring_dict(template))

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
    from_sample = is_sample_shop_item(body.name)
    owner = get_family_owner(db, user)
    if not from_sample:
        owner = check_add_limit(db, user, "shop_items_added_count", 1, LIMIT_EXTRA_SHOP_ITEMS, "shop items")
    item = DBShopItem(id=str(uuid4()), name=body.name.strip(), description=body.description or "",
                      cost=body.cost, image_emoji=body.imageEmoji or "🎁", created_at=now(),
                      family_id=get_family_id(user))
    db.add(item)
    if not from_sample:
        owner.shop_items_added_count = (owner.shop_items_added_count or 0) + 1
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

# ── Contact / support ticket route ────────────────────────────────────────────

@app.post("/api/contact")
def submit_contact(body: ContactTicketBody, user: DBUser = Depends(require_auth)):
    if not body.subject.strip():
        fail("Subject is required")
    if len(body.message.strip()) < 20:
        fail("Message must be at least 20 characters")

    # Build email body
    body_text = (
        f"New Support Ticket — Reward Ur Kids\n"
        f"{'='*50}\n\n"
        f"From   : {user.name} ({user.username})\n"
        f"Role   : {user.role}\n"
        f"Email  : {user.email or 'not provided'}\n"
        f"Category: {body.category}\n\n"
        f"Subject:\n{body.subject}\n\n"
        f"Message:\n{body.message}\n"
    )

    email_sent = False
    if SMTP_USER and SMTP_PASSWORD:
        try:
            msg = MIMEMultipart()
            msg["From"]    = SMTP_USER
            msg["To"]      = CONTACT_EMAIL
            msg["Subject"] = f"[Reward Ur Kids] {body.category}: {body.subject}"
            msg.attach(MIMEText(body_text, "plain"))

            if body.screenshot_b64:
                raw = body.screenshot_b64
                if "," in raw:
                    raw = raw.split(",", 1)[1]
                try:
                    img_bytes = base64.b64decode(raw)
                except binascii.Error:
                    fail("Invalid screenshot data — please re-attach the image.", 400)
                img_part  = MIMEImage(img_bytes)
                img_part.add_header("Content-Disposition", "attachment", filename="screenshot.png")
                msg.attach(img_part)

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as srv:
                srv.starttls()
                srv.login(SMTP_USER, SMTP_PASSWORD)
                srv.send_message(msg)
            email_sent = True
        except Exception as exc:
            print(f"[contact] email send failed: {exc}")

    if not email_sent:
        if SMTP_USER and SMTP_PASSWORD:
            # Credentials were present but sending still failed — surface the error
            fail("Failed to send email. Please try again later.", 500)
        # No credentials configured: log the ticket so it isn't silently lost
        print(f"[contact ticket — email not configured]\n{body_text}")

    return ok({"message": "Your ticket has been submitted. We'll get back to you soon!"})

# ── Account routes ─────────────────────────────────────────────────────────────

@app.put("/api/auth/password")
def change_own_password(body: ChangeOwnPasswordBody, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    check_password_complexity(body.password)
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
    check_content(text)
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

# ── Admin routes ──────────────────────────────────────────────────────────────

@app.get("/api/admin/families")
def admin_list_families(db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    primary_parents = db.query(DBUser).filter(
        DBUser.role == "parent",
        DBUser.co_parent_of == None,
    ).all()

    result = []
    for parent in primary_parents:
        family_id = parent.id
        co_parent = db.query(DBUser).filter(DBUser.co_parent_of == family_id).first()
        kids = db.query(DBUser).filter(DBUser.role == "kid", DBUser.parent_id == family_id).all()

        chore_counts = {}
        for status in ("open", "pending", "complete", "expired"):
            chore_counts[status] = db.query(DBChore).filter(
                DBChore.family_id == family_id, DBChore.status == status
            ).count()

        recurring_count = db.query(DBRecurringTemplate).filter(
            DBRecurringTemplate.family_id == family_id,
            DBRecurringTemplate.is_active == "1",
        ).count()

        kid_data = []
        for kid in kids:
            wallet = db.query(DBWallet).filter(DBWallet.kid_id == kid.id).first()
            kid_data.append({**safe_user(kid), "balance": wallet.balance if wallet else 0})

        result.append({
            "familyId": family_id,
            "parent": safe_user(parent),
            "coParent": safe_user(co_parent) if co_parent else None,
            "kids": kid_data,
            "choreCounts": chore_counts,
            "recurringCount": recurring_count,
        })

    return ok(result)


@app.get("/api/admin/family/{family_id}/chores")
def admin_family_chores(family_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    chores = db.query(DBChore).filter(
        DBChore.family_id == family_id,
    ).order_by(DBChore.created_at.desc()).limit(100).all()
    return ok([chore_dict(c) for c in chores])


@app.put("/api/admin/user/{user_id}")
def admin_update_user(user_id: str, body: AdminUserUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    target = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not target:
        fail("User not found", 404)
    if target.role == "admin":
        fail("Cannot edit admin accounts", 403)
    if body.name is not None:
        if len(body.name.strip()) < 2:
            fail("Name must be at least 2 characters")
        target.name = body.name.strip()
    if body.email is not None and body.email.strip():
        if not EMAIL_RE.match(body.email.strip()):
            fail("Invalid email address")
        clash = db.query(DBUser).filter(DBUser.email == body.email.lower().strip(), DBUser.id != user_id).first()
        if clash:
            fail("Email address already in use")
        target.email = body.email.lower().strip()
    if body.password is not None and body.password:
        check_password_complexity(body.password)
        target.password = body.password
    if body.avatar is not None:
        target.avatar = body.avatar
    db.commit()
    db.refresh(target)
    return ok(safe_user(target))


@app.put("/api/admin/chore/{chore_id}")
def admin_update_chore(chore_id: str, body: AdminChoreUpdate, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    chore = db.query(DBChore).filter(DBChore.id == chore_id).first()
    if not chore:
        fail("Chore not found", 404)
    if body.title is not None:
        if not body.title.strip():
            fail("Title cannot be empty")
        chore.title = body.title.strip()
    if body.description is not None:
        chore.description = body.description
    if body.points is not None:
        if body.points < 0:
            fail("Points must be non-negative")
        chore.points = body.points
    if body.status is not None:
        if body.status not in ("open", "pending", "complete", "expired"):
            fail("Invalid status")
        chore.status = body.status
    if body.assignedKidId is not None:
        chore.assigned_kid_id = body.assignedKidId or None
    if body.dueDate is not None:
        chore.due_date = body.dueDate or None
    if body.imageEmoji is not None:
        chore.image_emoji = body.imageEmoji
    db.commit()
    db.refresh(chore)
    return ok(chore_dict(chore))


@app.get("/api/admin/family/{family_id}/transactions")
def admin_family_transactions(family_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_admin)):
    kids = db.query(DBUser).filter(DBUser.role == "kid", DBUser.parent_id == family_id).all()
    kid_ids = [k.id for k in kids]
    if not kid_ids:
        return ok([])

    kid_map = {k.id: k for k in kids}
    txns = db.query(DBTransaction).filter(
        DBTransaction.kid_id.in_(kid_ids)
    ).order_by(DBTransaction.timestamp.desc()).limit(100).all()

    result = []
    for t in txns:
        kid = kid_map.get(t.kid_id)
        result.append({
            "id": t.id,
            "kidId": t.kid_id,
            "kidName": kid.name if kid else "Unknown",
            "kidAvatar": kid.avatar if kid else "👤",
            "type": t.type,
            "amount": t.amount,
            "description": t.description,
            "timestamp": t.timestamp,
        })
    return ok(result)

# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 3001))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
