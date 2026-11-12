import json
import ssl
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone as dt_timezone
from uuid import uuid4
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import certifi
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from deps import require_auth, require_guardian, require_kid
from helpers import get_family_id, now
from models import DBReadingLog, DBReadingLogEntry, DBTransaction, DBUser, DBWallet
from push_utils import notify_guardians_of_kid, notify_kid
from reading_level import classify_genre, compute_reading_level, detect_format, extract_grade_hint
from responses import fail, ok
from schemas import ReadingLogAssignBody, ReadingLogCompleteBody, ReadingLogEntryBody, ReadingLogPointsBody, ReadingLogStartBody

router = APIRouter()

MAX_SUMMARY_CHARS = 1000
MAX_NOTE_CHARS = 1000
SEARCH_RESULT_LIMIT = 10

# A Python.org macOS install doesn't trust the system keychain out of the
# box (needs its own "Install Certificates.command" run once, which this
# dev machine never had done) -- certifi's bundled CA list sidesteps that
# instead of requiring every dev's machine to be set up a specific way.
# Harmless everywhere else (Linux/Render containers already trust this
# bundle via their own OS certs).
_SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())


# ── Open Library search ───────────────────────────────────────────────────────
# No API key, no quota -- unlike Google Books' keyless tier (which shares one
# global anonymous quota across every app using it unauthenticated, and ran
# dry in testing), Open Library's search is free and open with no sign-up.
# Never raises on a network/API hiccup; a search failure should read as "no
# results right now", not break the page, since nothing downstream depends on it.

@router.get("/api/reading-log/search")
def search_books(q: str, user: DBUser = Depends(require_auth)):
    query = q.strip()
    if len(query) < 2:
        fail("Type at least 2 characters to search.")
    url = "https://openlibrary.org/search.json?" + urllib.parse.urlencode({
        "q": query, "limit": SEARCH_RESULT_LIMIT,
        "fields": "key,title,author_name,cover_i,first_publish_year,number_of_pages_median,subject",
    })
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "RewardUrKids/1.0 (contact: rewardurkids@gmail.com)"})
        with urllib.request.urlopen(req, timeout=5, context=_SSL_CONTEXT) as resp:
            data = json.loads(resp.read().decode())
    except Exception:
        fail("Book search is unavailable right now. Please try again shortly.", 503)

    results = []
    for doc in data.get("docs", []):
        if not doc.get("title"):
            continue
        cover_id = doc.get("cover_i")
        year = doc.get("first_publish_year")
        results.append({
            # "/works/OL81839W" -- Open Library's stable work id, kept as-is
            # rather than stripped down, since it's only ever used as an
            # opaque reference back to this book, never shown to anyone.
            "volumeId": doc.get("key"),
            "title": doc.get("title"),
            "author": ", ".join(doc.get("author_name", [])) or None,
            # "-M" = medium size (~180px tall); Open Library's cover CDN, no
            # auth needed. No cover_i means this edition has no known cover.
            "thumbnailUrl": f"https://covers.openlibrary.org/b/id/{cover_id}-M.jpg" if cover_id else None,
            # The search endpoint doesn't return a description/summary at
            # all (only each work's own detail page does, which would mean
            # a second request per result) -- first-publish year is the one
            # bit of extra context cheap enough to show inline instead.
            "description": f"First published {year}" if year else None,
            # Median page count across editions -- approximate, but good
            # enough to drive a "pages read so far" progress bar once a
            # guardian/kid picks this result (see DBReadingLog.total_pages).
            "totalPages": doc.get("number_of_pages_median"),
            # Classified here (not left as the raw 10-80-tag `subject` list,
            # which is noisy and would bloat every search response) -- see
            # reading_level.py for the full Reading Level algorithm these
            # feed once this book is assigned/started and later approved.
            "genre": classify_genre(doc.get("subject", [])),
            "gradeLevel": extract_grade_hint(doc.get("subject", [])),
            # Picture book / graphic novel / etc. -- see reading_level.py for
            # why this matters: it dampens the page-count difficulty fallback
            # for low-text-density formats instead of trusting raw pages.
            "format": detect_format(doc.get("subject", [])),
        })
    return ok(results)


# ── Shared helpers ────────────────────────────────────────────────────────────

def _family_id_for(user: DBUser) -> str:
    return user.guardian_id if user.role == "kid" else get_family_id(user)


def log_dict(r: DBReadingLog, entry_count: int = None, pages_read: int = None) -> dict:
    d = {
        "id": r.id, "kidId": r.kid_id, "assignedBy": r.assigned_by,
        "volumeId": r.google_volume_id, "title": r.title, "author": r.author,
        "thumbnailUrl": r.thumbnail_url, "description": r.description,
        "totalPages": r.total_pages,
        "points": r.points, "status": r.status, "summary": r.summary,
        "createdAt": r.created_at, "submittedAt": r.submitted_at, "resolvedAt": r.resolved_at,
    }
    if entry_count is not None:
        d["entryCount"] = entry_count
    if pages_read is not None:
        d["pagesRead"] = pages_read
    return d


def entry_dict(e: DBReadingLogEntry) -> dict:
    return {"id": e.id, "readingLogId": e.reading_log_id, "note": e.note, "pages": e.pages, "createdAt": e.created_at}


# ── Streak / badge gamification ──────────────────────────────────────────────

_BADGE_DEFS = [
    {"id": "first_page",    "emoji": "📖",  "label": "First Page",   "description": "Log your first day of reading"},
    {"id": "first_finish",  "emoji": "🏁",  "label": "First Finish", "description": "Finish your first book"},
    {"id": "streak_3",      "emoji": "🔥",  "label": "3-Day Streak", "description": "Read 3 days in a row"},
    {"id": "streak_7",      "emoji": "🔥🔥", "label": "Week Streak",  "description": "Read 7 days in a row"},
    {"id": "bookworm",      "emoji": "📚",  "label": "Bookworm",     "description": "Finish 3 books"},
    {"id": "super_reader",  "emoji": "🏆",  "label": "Super Reader", "description": "Finish 10 books"},
    {"id": "page_turner",   "emoji": "📄",  "label": "Page Turner",  "description": "Read 100 pages total"},
]

# The reading buddy evolves with LIFETIME pages logged -- rewards showing up
# and reading a little most days, visible progress even between book
# completions. Deliberately a different metric than Reading Level (see
# reading_level.py, which scores books FINISHED by quality), so the two
# systems reward different behavior instead of both restating one number.
_BUDDY_STAGES = [
    (0,    "Mysterious Egg",   "🥚"),
    (25,   "Hatchling",        "🐣"),
    (100,  "Young Dragon",     "🦎"),
    (300,  "Dragon",           "🐉"),
    (700,  "Fire Dragon",      "🔥🐉"),
    (1500, "Legendary Dragon", "👑🐉"),
]


def _buddy_stage(total_pages_read: int) -> dict:
    idx = 0
    for i, (threshold, _name, _emoji) in enumerate(_BUDDY_STAGES):
        if total_pages_read >= threshold:
            idx = i
    _threshold, name, emoji = _BUDDY_STAGES[idx]
    has_next = idx + 1 < len(_BUDDY_STAGES)
    next_threshold, next_name, _next_emoji = _BUDDY_STAGES[idx + 1] if has_next else (None, None, None)
    return {
        "stage": idx, "name": name, "emoji": emoji,
        "nextName": next_name,
        "pagesToNext": (next_threshold - total_pages_read) if has_next else None,
        "maxStage": not has_next,
    }


def _kid_tz(kid: DBUser) -> ZoneInfo:
    if kid.timezone:
        try:
            return ZoneInfo(kid.timezone)
        except (ZoneInfoNotFoundError, ValueError):
            pass
    return ZoneInfo("UTC")


def _date_in_tz(iso_str: str, tz: ZoneInfo) -> date:
    dt = datetime.fromisoformat(iso_str)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=dt_timezone.utc)
    return dt.astimezone(tz).date()


def _current_and_longest_streak(dates: set, tz: ZoneInfo) -> tuple:
    if not dates:
        return 0, 0
    today = datetime.now(tz).date()
    # A day not yet logged today doesn't break the streak until the day
    # actually ends -- count back from yesterday in that case instead.
    cursor = today if today in dates else today - timedelta(days=1)
    current = 0
    while cursor in dates:
        current += 1
        cursor -= timedelta(days=1)

    ordered = sorted(dates)
    longest = run = 1
    for i in range(1, len(ordered)):
        if (ordered[i] - ordered[i - 1]).days == 1:
            run += 1
            longest = max(longest, run)
        else:
            run = 1
    longest = max(longest, current)
    return current, longest


def _get_owned_log(db: Session, log_id: str, user: DBUser) -> DBReadingLog:
    """A kid may only touch their own log; a guardian only one in their
    family. Same "not found" either way so a wrong id never distinguishes
    "doesn't exist" from "not yours"."""
    log = db.query(DBReadingLog).filter(DBReadingLog.id == log_id).first()
    if not log:
        fail("Reading log not found", 404)
    if user.role == "kid":
        if log.kid_id != user.id:
            fail("Reading log not found", 404)
    elif log.family_id != get_family_id(user):
        fail("Reading log not found", 404)
    return log


# ── List ──────────────────────────────────────────────────────────────────────

@router.get("/api/reading-log")
def get_reading_log(db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    family_id = _family_id_for(user)
    q = db.query(DBReadingLog).filter(DBReadingLog.family_id == family_id)
    if user.role == "kid":
        q = q.filter(DBReadingLog.kid_id == user.id)
    logs = q.order_by(DBReadingLog.created_at.desc()).all()
    counts = {}
    pages = {}
    if logs:
        for e in db.query(DBReadingLogEntry).filter(DBReadingLogEntry.reading_log_id.in_([l.id for l in logs])).all():
            counts[e.reading_log_id] = counts.get(e.reading_log_id, 0) + 1
            pages[e.reading_log_id] = pages.get(e.reading_log_id, 0) + (e.pages or 0)

    if user.role != "kid":
        kids = db.query(DBUser).filter(DBUser.role == "kid", DBUser.guardian_id == family_id).all()
        kid_names = {k.id: k.name for k in kids}
        result = []
        for l in logs:
            d = log_dict(l, counts.get(l.id, 0), pages.get(l.id, 0))
            d["kidName"] = kid_names.get(l.kid_id, "?")
            result.append(d)
        return ok(result)
    return ok([log_dict(l, counts.get(l.id, 0), pages.get(l.id, 0)) for l in logs])


@router.get("/api/reading-log/stats")
def get_reading_log_stats(kidId: str = None, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    if user.role == "kid":
        kid = user
    else:
        if not kidId:
            fail("kidId is required")
        kid = db.query(DBUser).filter(DBUser.id == kidId, DBUser.role == "kid", DBUser.guardian_id == get_family_id(user)).first()
        if not kid:
            fail("Kid not found", 404)

    logs = db.query(DBReadingLog).filter(DBReadingLog.kid_id == kid.id).all()
    log_ids = [l.id for l in logs]
    entries = db.query(DBReadingLogEntry).filter(DBReadingLogEntry.reading_log_id.in_(log_ids)).all() if log_ids else []

    tz = _kid_tz(kid)
    dates = {_date_in_tz(e.created_at, tz) for e in entries}
    current_streak, longest_streak = _current_and_longest_streak(dates, tz)
    total_pages_read = sum(e.pages or 0 for e in entries)
    books_completed = sum(1 for l in logs if l.status == "approved")
    total_entries = len(entries)

    entry_counts_by_log = {}
    for e in entries:
        entry_counts_by_log[e.reading_log_id] = entry_counts_by_log.get(e.reading_log_id, 0) + 1

    stats = {
        "totalEntries": total_entries, "totalBooksCompleted": books_completed,
        "totalPagesRead": total_pages_read, "currentStreak": current_streak, "longestStreak": longest_streak,
    }
    badge_checks = {
        "first_page": total_entries >= 1,
        "first_finish": books_completed >= 1,
        "streak_3": longest_streak >= 3,
        "streak_7": longest_streak >= 7,
        "bookworm": books_completed >= 3,
        "super_reader": books_completed >= 10,
        "page_turner": total_pages_read >= 100,
    }
    stats["badges"] = [{**b, "earned": badge_checks.get(b["id"], False)} for b in _BADGE_DEFS]

    # Reading Level is quality-weighted (see reading_level.py) -- pages,
    # genre diversity, engagement, and any crowdsourced grade-level hint, not
    # just a raw books-finished count. Chronological (oldest approval first)
    # so the one-time diversity bonus lands on whichever book in a genre was
    # actually finished first.
    approved = sorted((l for l in logs if l.status == "approved"), key=lambda l: l.resolved_at or l.created_at)
    finished_books = [
        {
            "pages": l.total_pages, "genre": l.genre, "gradeHint": l.grade_level_hint, "format": l.reading_format,
            "entryCount": entry_counts_by_log.get(l.id, 0), "summary": l.summary,
        }
        for l in approved
    ]
    stats["level"] = compute_reading_level(finished_books)
    stats["buddy"] = _buddy_stage(total_pages_read)
    return ok(stats)


@router.get("/api/reading-log/{log_id}/entries")
def get_reading_log_entries(log_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_auth)):
    log = _get_owned_log(db, log_id, user)
    entries = db.query(DBReadingLogEntry).filter(
        DBReadingLogEntry.reading_log_id == log.id
    ).order_by(DBReadingLogEntry.created_at.asc()).all()
    return ok([entry_dict(e) for e in entries])


# ── Guardian: assign + review ────────────────────────────────────────────────

@router.post("/api/reading-log/assign")
def assign_reading_log(body: ReadingLogAssignBody, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    family_id = get_family_id(user)
    kid = db.query(DBUser).filter(DBUser.id == body.kidId, DBUser.role == "kid", DBUser.guardian_id == family_id).first()
    if not kid:
        fail("Kid not found", 404)
    if not body.title.strip():
        fail("Title is required")
    if body.points <= 0:
        fail("Points must be greater than 0")

    log = DBReadingLog(
        id=str(uuid4()), kid_id=kid.id, family_id=family_id, assigned_by="parent",
        google_volume_id=body.volumeId, title=body.title.strip(), author=body.author,
        thumbnail_url=body.thumbnailUrl, description=body.description, total_pages=body.totalPages,
        genre=body.genre, grade_level_hint=body.gradeLevel, reading_format=body.format,
        points=body.points, status="assigned", created_at=now(),
    )
    db.add(log)
    db.commit()
    notify_kid(
        db, kid.id,
        title="📖 New book assigned!",
        body=f"{user.name} assigned you \"{log.title}\" to read.",
        data={"type": "reading_log_assigned", "readingLogId": log.id},
    )
    return ok(log_dict(log, 0), 201)


@router.put("/api/reading-log/{log_id}/points")
def set_reading_log_points(log_id: str, body: ReadingLogPointsBody, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    log = _get_owned_log(db, log_id, user)
    if log.status == "approved":
        fail("Points already paid out for this one -- can't change them now.")
    if body.points <= 0:
        fail("Points must be greater than 0")
    log.points = body.points
    db.commit()
    return ok(log_dict(log))


@router.post("/api/reading-log/{log_id}/approve")
def approve_reading_log(log_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    log = _get_owned_log(db, log_id, user)
    if log.status != "pending_approval":
        fail("Only a book awaiting approval can be approved")

    wallet = db.query(DBWallet).filter(DBWallet.kid_id == log.kid_id).first()
    if not wallet:
        wallet = DBWallet(kid_id=log.kid_id, balance=0)
        db.add(wallet)
        db.flush()
    wallet.balance += log.points
    db.add(DBTransaction(
        id=str(uuid4()), kid_id=log.kid_id, type="earned", amount=log.points,
        description=f"Finished reading: {log.title}", timestamp=now(),
    ))
    log.status = "approved"
    log.resolved_at = now()
    db.commit()
    db.refresh(wallet)
    notify_kid(
        db, log.kid_id,
        title="✅ Reading approved!",
        body=f"\"{log.title}\" was approved -- you earned {log.points:g} pts!",
        data={"type": "reading_log_approved", "readingLogId": log.id},
    )
    return ok({"pointsAwarded": log.points, "newBalance": wallet.balance})


@router.post("/api/reading-log/{log_id}/reject")
def reject_reading_log(log_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    log = _get_owned_log(db, log_id, user)
    if log.status != "pending_approval":
        fail("Only a book awaiting approval can be sent back")

    log.status = "in_progress"
    db.commit()
    notify_kid(
        db, log.kid_id,
        title="Reading log needs another look",
        body=f"Your guardian asked for a bit more before \"{log.title}\" counts -- keep logging and resubmit.",
        data={"type": "reading_log_rejected", "readingLogId": log.id},
    )
    return ok(log_dict(log))


@router.delete("/api/reading-log/{log_id}")
def remove_reading_log(log_id: str, db: Session = Depends(get_db), user: DBUser = Depends(require_guardian)):
    log = _get_owned_log(db, log_id, user)
    if log.status == "approved":
        fail("Can't remove a book that's already been paid out.")
    db.query(DBReadingLogEntry).filter(DBReadingLogEntry.reading_log_id == log.id).delete(synchronize_session=False)
    db.delete(log)
    db.commit()
    return ok({"removed": True})


# ── Kid: self-start, daily log, complete ─────────────────────────────────────

@router.post("/api/reading-log/start")
def start_reading_log(body: ReadingLogStartBody, db: Session = Depends(get_db), user: DBUser = Depends(require_kid)):
    if not body.title.strip():
        fail("Title is required")
    log = DBReadingLog(
        id=str(uuid4()), kid_id=user.id, family_id=user.guardian_id, assigned_by="kid",
        google_volume_id=body.volumeId, title=body.title.strip(), author=body.author,
        thumbnail_url=body.thumbnailUrl, description=body.description, total_pages=body.totalPages,
        genre=body.genre, grade_level_hint=body.gradeLevel, reading_format=body.format,
        points=10, status="in_progress", created_at=now(),
    )
    db.add(log)
    db.commit()
    notify_guardians_of_kid(
        db, user,
        title="📖 Started a new book",
        body=f"{user.name} started reading \"{log.title}\" on their own.",
        data={"type": "reading_log_started", "readingLogId": log.id},
    )
    return ok(log_dict(log, 0), 201)


@router.post("/api/reading-log/{log_id}/entries")
def add_reading_log_entry(log_id: str, body: ReadingLogEntryBody, db: Session = Depends(get_db), user: DBUser = Depends(require_kid)):
    log = _get_owned_log(db, log_id, user)
    if log.status not in ("assigned", "in_progress"):
        fail("This book isn't open for new entries right now.")
    note = body.note.strip()
    if len(note) < 3:
        fail("Tell your guardian a little about what you read today.")
    if len(note) > MAX_NOTE_CHARS:
        fail(f"Keep today's note under {MAX_NOTE_CHARS} characters.")

    if body.pages is not None and body.pages < 0:
        fail("Pages read can't be negative.")
    entry = DBReadingLogEntry(id=str(uuid4()), reading_log_id=log.id, note=note, pages=body.pages, created_at=now())
    db.add(entry)
    if log.status == "assigned":
        log.status = "in_progress"
    db.commit()
    return ok(entry_dict(entry), 201)


@router.post("/api/reading-log/{log_id}/complete")
def complete_reading_log(log_id: str, body: ReadingLogCompleteBody, db: Session = Depends(get_db), user: DBUser = Depends(require_kid)):
    log = _get_owned_log(db, log_id, user)
    if log.status != "in_progress":
        fail("Log at least one day of reading before marking this book complete.")
    summary = body.summary.strip()
    if len(summary) < 10:
        fail("Write a short summary of the book before sending it for approval.")
    if len(summary) > MAX_SUMMARY_CHARS:
        fail(f"Keep your summary under {MAX_SUMMARY_CHARS} characters.")

    # Marking a book complete means the kid read the whole thing -- top up
    # pagesRead (derived from the sum of entries, see log_dict) to the full
    # total_pages if their daily entries added up to less, so the progress
    # bar/stats reflect "finished" rather than leaving it stuck at whatever
    # they happened to log along the way. No-op when total_pages is unknown
    # (nothing to top up to) or they'd already logged at/above it.
    if log.total_pages:
        pages_so_far = db.query(DBReadingLogEntry).filter(DBReadingLogEntry.reading_log_id == log.id).all()
        pages_logged = sum(e.pages or 0 for e in pages_so_far)
        remaining = log.total_pages - pages_logged
        if remaining > 0:
            db.add(DBReadingLogEntry(
                id=str(uuid4()), reading_log_id=log.id, pages=remaining,
                note="Finished the book!", created_at=now(),
            ))

    log.summary = summary
    log.status = "pending_approval"
    log.submitted_at = now()
    db.commit()
    notify_guardians_of_kid(
        db, user,
        title="📖 Book ready for review!",
        body=f"{user.name} finished \"{log.title}\" -- tap to review and approve.",
        data={"type": "reading_log_submitted", "readingLogId": log.id},
    )
    # Recomputed post-commit so the response reflects the just-added
    # top-up entry -- the kid's progress bar should read "finished" the
    # instant they submit, not after their next reload.
    all_entries = db.query(DBReadingLogEntry).filter(DBReadingLogEntry.reading_log_id == log.id).all()
    return ok(log_dict(log, len(all_entries), sum(e.pages or 0 for e in all_entries)))
