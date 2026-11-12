import json
import urllib.request
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from starlette.requests import Request as StarletteRequest

from database import SessionLocal
from models import DBUser

_PRIVATE_IP_PREFIXES = ("127.", "10.", "192.168.", "::1", "localhost")


def get_client_ip(request: StarletteRequest) -> str:
    """Real client IP, respecting X-Forwarded-For set by the hosting proxy (e.g. Render)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else ""


_NATIVE_PLATFORMS = {"android", "ios"}


def get_client_platform(request: StarletteRequest) -> str:
    """Which shell/device the request came from, for the admin panel's "how are
    users accessing this" view. Native app detection comes from the frontend's own
    Capacitor.getPlatform() (see frontend/src/api.js) -- not something the server
    can reliably infer from the User-Agent alone, since a Capacitor WebView's UA
    often looks just like a mobile browser's. For anything that isn't a wrapped
    native app (header missing, or an old frontend build that predates it), falls
    back to sub-classifying by User-Agent so a phone browser (Android Chrome,
    iPhone/iPad Safari) can be told apart from a laptop/desktop browser.

    Returns one of: "android", "ios" (native app), "android-web", "ios-web"
    (mobile browser), or "web" (desktop/laptop browser, or anything else)."""
    platform = (request.headers.get("x-client-platform") or "").strip().lower()
    if platform in _NATIVE_PLATFORMS:
        return platform
    ua = (request.headers.get("user-agent") or "").lower()
    if "android" in ua:
        return "android-web"
    if "iphone" in ua or "ipad" in ua or "ipod" in ua:
        return "ios-web"
    return "web"


def get_client_timezone(request: StarletteRequest) -> str | None:
    """The device's own IANA timezone (e.g. "Asia/Kolkata"), as reported by the
    frontend's Intl.DateTimeFormat().resolvedOptions().timeZone (see
    frontend/src/api.js) -- not something the server can infer from the
    request at all. Validated against the real tz database rather than
    stored blindly, since this ends up driving day-boundary logic (see
    daily_chore_logic.py) where a garbage value would be worse than none.
    None (not a default like get_client_platform's "web") for a missing or
    invalid header, so callers can tell "no timezone known yet" apart from
    an actual zone and fall back to UTC themselves."""
    tz_name = (request.headers.get("x-client-timezone") or "").strip()
    if not tz_name:
        return None
    try:
        ZoneInfo(tz_name)
    except (ZoneInfoNotFoundError, ValueError):
        return None
    return tz_name


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


def record_login_location(user_id: str, ip: str) -> None:
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
