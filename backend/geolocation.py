import json
import urllib.request

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
