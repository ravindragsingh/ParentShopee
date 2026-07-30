"""Thin client for the Strapi CMS that stores the Math topic catalog and
teacher study materials (see ../cms/). Normalizes Strapi's REST response
shape into the same plain-dict shape the rest of the app already expects —
{id, title, subject, grade, topic, emoji, kind, explanation, description,
url, questions: [{question, answers}]} — so routers/helpers only needed to
swap "query the local table" for "call this module."

NOT verified against a live Strapi instance — this was written in a sandbox
with no internet access to install/run one. Sanity-test these functions
against a real Strapi before relying on them; see ../cms/README.md.
"""
import json
import urllib.error
import urllib.parse
import urllib.request

from fastapi import HTTPException

from config import STRAPI_API_TOKEN, STRAPI_URL
from responses import fail

CONTENT_ENDPOINT = "/api/content-items"


def _headers() -> dict:
    headers = {"Content-Type": "application/json"}
    if STRAPI_API_TOKEN:
        headers["Authorization"] = f"Bearer {STRAPI_API_TOKEN}"
    return headers


def _request(method: str, path: str, body: dict = None) -> dict:
    url = f"{STRAPI_URL}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=_headers())
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            fail("Content not found", 404)
        detail = exc.read().decode(errors="replace")
        fail(f"Content service returned an error ({exc.code}): {detail}", 502)
    except urllib.error.URLError as exc:
        fail(f"Content service is unavailable right now ({exc.reason}). Please try again shortly.", 503)


def _normalize_item(raw: dict) -> dict:
    """Strapi v5 flattens fields directly onto each item; v4 nests them
    under `attributes`. Merge both so callers don't need to care which."""
    item = {**raw, **(raw.get("attributes") or {})}
    item.pop("attributes", None)
    questions = item.get("questions") or []
    item["questions"] = [
        {"question": q.get("question", ""), "answers": q.get("answers") or []}
        for q in questions
    ]
    item["id"] = str(item.get("documentId") or item.get("id"))
    item.setdefault("subject", "Maths")
    return item


def _build_query(filters: dict, extra_params: dict) -> str:
    flat = dict(extra_params)

    def add(prefix, value):
        if isinstance(value, dict):
            for k, v in value.items():
                add(f"{prefix}[{k}]", v)
        elif isinstance(value, (list, tuple)):
            for i, v in enumerate(value):
                add(f"{prefix}[{i}]", v)
        else:
            flat[prefix] = value

    for key, value in filters.items():
        add(f"filters[{key}]", value)
    return urllib.parse.urlencode(flat)


def list_content(kind: str = None, grade: int = None, subject: str = None, search: str = None) -> list:
    """Returns Content Items as plain dicts, optionally filtered. Used both
    for the Math topic picker (kind="topic") and the teacher's study
    material catalog (kind="material")."""
    filters = {}
    if kind:
        filters["kind"] = {"$eq": kind}
    if grade is not None:
        filters["grade"] = {"$eq": grade}
    if subject:
        filters["subject"] = {"$eq": subject}
    if search:
        filters["$or"] = [
            {"title": {"$containsi": search}},
            {"explanation": {"$containsi": search}},
            {"description": {"$containsi": search}},
        ]
    query = _build_query(filters, {"populate": "questions"})
    res = _request("GET", f"{CONTENT_ENDPOINT}?{query}")
    return [_normalize_item(item) for item in res.get("data", [])]


def get_content(content_id: str) -> dict:
    """Returns a single Content Item as a plain dict, or None if it doesn't
    exist. A genuinely unreachable/erroring content service still raises
    (502/503) rather than being silently treated as "not found"."""
    try:
        res = _request("GET", f"{CONTENT_ENDPOINT}/{content_id}?populate=questions")
    except HTTPException as exc:
        if exc.status_code == 404:
            return None
        raise
    data = res.get("data")
    return _normalize_item(data) if data else None
