"""Reading Level algorithm -- how a kid's Reading Level is actually computed.

THE PROBLEM WITH "BOOKS FINISHED" ALONE
Counting books (or pages) rewards volume, not growth: a kid who reads the
same easy 20-page picture book ten times would out-rank one who reads one
long, unfamiliar novel. We want the level to reflect genuine reading
*development* -- tackling harder material, trying new genres, actually
engaging with the book -- not just how fast they can tap "mark complete."

WHAT WE ACTUALLY HAVE TO WORK WITH
There's no licensed Lexile/AR reading-difficulty database here (that's a
paid MetaMetrics/Renaissance dataset, not something this app has access
to). What Open Library's free search API DOES give us, per book:
  - `number_of_pages_median` -- a real, if approximate (median across
    editions), length figure.
  - `subject` -- a messy, crowdsourced bag of 10-80 tags per book (genre
    words, award names, translations, and -- occasionally -- an actual
    library-cataloged "Reading Level-Grade N" tag). Coverage of that grade
    tag is inconsistent (most books don't have one), so it's used as a
    BONUS signal when present, never a requirement.
So "quality" here is a deliberately pragmatic proxy built from four real,
available signals -- not a claim of psychometric accuracy. It's documented
here precisely so it's easy to see what it does and doesn't measure, and to
retune as better data becomes available (e.g. if a real Lexile source is
ever added, `_extract_grade_hint` is the one place that would change).

THE FOUR SIGNALS (per finished/approved book)
1. Difficulty  -- PAGE COUNT IS NOT DIFFICULTY, so this never just scales
   off pages alone. Two sub-cases:
     a) An explicit grade-level tag exists -> the difficulty score comes
        ENTIRELY from that grade (a confirmed "Grade 7" book scores as a
        grade-7 book, full stop, regardless of whether it's 80 pages or
        400). This is the one real difficulty signal available here, so
        when it exists it REPLACES the page-based guess rather than just
        padding it.
     b) No grade tag -- falls back to a page-count proxy, but first
        DAMPENED by detected format: a picture book, early reader, or
        graphic novel/comic has far less text per page than a standard
        prose novel, so a 300-page graphic novel does NOT earn the same
        length-credit as a 300-page novel (see `_FORMAT_DENSITY`). This
        fallback is deliberately capped below what a confirmed grade tag
        would award, since it's the weaker, noisier of the two signals.
2. Diversity   -- a one-time bonus the FIRST time a kid finishes a book in
   a genre they haven't finished one in before. Rewards range, discourages
   just re-reading the same series for easy points.
3. Engagement  -- credit for logging reading across multiple days (capped,
   so spamming tiny entries doesn't help) and for writing a substantive
   finishing summary (word count, also capped -- length isn't eloquence,
   but a one-word summary is a weaker signal than a real paragraph).
4. Completion  -- a flat base score just for finishing, so every book
   counts for something even a fast, easy read.

Every component is capped/dampened on purpose: the score should reward
genuine variety and effort, not be maximized by gaming any single input
(mashing the pages field, writing a 1000-word summary, etc.) -- and
critically, NOT be maximized by just picking long books, which was the
earlier version's biggest flaw.

TUNING
All the numbers below (`_LEVEL_TIERS`, the point weights in
`score_finished_book`) are constants, not derived from any formal study --
adjust them freely as real usage data comes in and some tiers turn out too
easy/hard to reach.
"""

import re

# ── Genre classification ──────────────────────────────────────────────────────
# Open Library's `subject` list is a noisy bag of tags (award names, language
# editions, "Juvenile fiction", etc.) -- this is a simple, transparent
# keyword-bucket classifier, NOT a trained model. First matching bucket wins,
# so order encodes priority (a fantasy book tagged "Animals" should classify
# as fantasy, not animals -- hence fantasy is checked before animals).
_GENRE_RULES = [
    ("fantasy",     ["fantasy", "magic", "wizard", "dragon", "fairy tale", "mythology", "witch"]),
    ("mystery",     ["mystery", "detective", "spy stories"]),
    ("science_fiction", ["science fiction", "sci-fi", "space travel", "robot"]),
    ("historical",  ["historical fiction", "history"]),
    ("biography",   ["biography", "autobiography"]),
    ("science",     ["science", "nature", "space exploration", "experiments"]),
    ("sports",      ["sports", "baseball", "soccer", "basketball", "football"]),
    ("poetry",      ["poetry", "poems", "nursery rhymes"]),
    ("humor",       ["humorous stories", "humor", "comedy", "jokes"]),
    ("adventure",   ["adventure", "survival", "exploration"]),
    ("friendship",  ["friendship", "family life"]),
    ("animals",     ["animals", "pets", "dogs", "cats", "horses"]),
    ("fiction",     ["juvenile fiction", "fiction", "stories"]),
    ("nonfiction",  ["juvenile literature", "nonfiction", "encyclopedias"]),
]
_DEFAULT_GENRE = "general"


def classify_genre(subjects: list) -> str:
    if not subjects:
        return _DEFAULT_GENRE
    lowered = [s.lower() for s in subjects]
    for genre, keywords in _GENRE_RULES:
        if any(any(kw in subj for kw in keywords) for subj in lowered):
            return genre
    return _DEFAULT_GENRE


# ── Format detection ──────────────────────────────────────────────────────────
# Orthogonal to genre: a graphic novel can be fantasy OR mystery OR anything
# else, but whatever it is, its pages carry far less text than a standard
# prose novel's. This is the fix for "a 300-page graphic novel shouldn't
# out-score a dense 120-page novel" -- it scales the page-based difficulty
# FALLBACK (used only when there's no grade-level tag; see score_finished_book)
# down for low-text-density formats, instead of trusting raw page count.
# Order matters, most specific first (a "board book" is also arguably a
# "picture book" but should get the deeper discount).
_FORMAT_RULES = [
    ("board_book",    ["board books", "board book"]),
    ("picture_book",  ["picture books", "picture book", "picture books for children"]),
    ("easy_reader",   ["easy readers", "beginning readers", "early readers", "i can read"]),
    ("graphic_novel", ["graphic novels", "comics & graphic novels", "comic books, strips", "comics", "manga"]),
]
_DEFAULT_FORMAT = "standard"  # a normal prose novel/chapter book -- full page-count weight applies

# How much of a book's raw page count should count toward the difficulty
# fallback, by format -- e.g. a 300-page graphic novel is treated as if it
# were a ~120-page standard novel (300 * 0.4) before the sqrt dampening
# below, since most of each page is illustration, not text to read.
_FORMAT_DENSITY = {
    "board_book":    0.1,
    "picture_book":  0.15,
    "easy_reader":    0.3,
    "graphic_novel":  0.4,
    "standard":       1.0,
}


def detect_format(subjects: list) -> str:
    if not subjects:
        return _DEFAULT_FORMAT
    lowered = [s.lower() for s in subjects]
    for fmt, keywords in _FORMAT_RULES:
        if any(any(kw in subj for kw in keywords) for subj in lowered):
            return fmt
    return _DEFAULT_FORMAT


# ── Grade-level hint extraction ────────────────────────────────────────────────
# Looks for library-cataloged "Reading Level-Grade N" / "Grade N" tags.
# Present on only a minority of books (often several at once, sometimes
# noisy/inconsistent -- e.g. a children's novel tagged grades 9-12 because
# of a library's own audience categorization) -- averaging every match found
# and rounding dampens any single outlier tag.
_GRADE_RE = re.compile(r"grade[\s-]*(\d{1,2})", re.IGNORECASE)


def extract_grade_hint(subjects: list) -> int | None:
    if not subjects:
        return None
    grades = []
    for s in subjects:
        m = _GRADE_RE.search(s)
        if m:
            g = int(m.group(1))
            if 1 <= g <= 12:
                grades.append(g)
    if not grades:
        return None
    return round(sum(grades) / len(grades))


# ── Per-book scoring ──────────────────────────────────────────────────────────

_BASE_FINISH_POINTS = 10
_MAX_ENGAGEMENT_DAYS_CREDIT = 10   # entries beyond this stop adding engagement points
_MAX_SUMMARY_WORDS_CREDIT = 150    # summary words beyond this stop adding points
_DIVERSITY_BONUS = 8
_GRADE_DIFFICULTY_PER_LEVEL = 6     # a confirmed "Grade N" tag -> (N-1) * this, the authoritative difficulty path
_PAGE_FALLBACK_SCALE = 0.9          # dampens the whole page-based guess below what a real grade tag would award,
                                    # since it's the weaker/noisier of the two paths (see module docstring)


def _difficulty_points(pages: int | None, grade_hint: int | None, fmt: str) -> float:
    """The core fix: page count is NEVER the difficulty signal on its own.
    A confirmed grade-level tag replaces the page guess entirely; absent
    that, the page count is first discounted by format (a picture book or
    graphic novel's pages carry far less text than a standard novel's) and
    the whole fallback is scaled down, since it's a guess, not a rating."""
    if grade_hint is not None:
        return max(0, grade_hint - 1) * _GRADE_DIFFICULTY_PER_LEVEL
    density = _FORMAT_DENSITY.get(fmt, 1.0)
    adjusted_pages = (pages or 0) * density
    return (adjusted_pages ** 0.5) * _PAGE_FALLBACK_SCALE


def score_finished_book(pages: int | None, genre: str, prior_genres: set, entry_count: int, summary: str,
                         grade_hint: int | None = None, format: str = _DEFAULT_FORMAT) -> dict:
    """One finished book's contribution to Reading Quality Score (RQS).
    `prior_genres` = every genre this kid has ALREADY finished a book in
    (before this one) -- the caller is responsible for updating it between
    calls when scoring a kid's whole history in order."""
    difficulty = _difficulty_points(pages, grade_hint, format)

    summary_words = len((summary or "").split())
    engagement = min(entry_count, _MAX_ENGAGEMENT_DAYS_CREDIT) + min(summary_words, _MAX_SUMMARY_WORDS_CREDIT) / 10

    diversity = _DIVERSITY_BONUS if genre not in prior_genres else 0

    total = _BASE_FINISH_POINTS + difficulty + engagement + diversity
    return {
        "total": round(total, 1),
        "basePoints": _BASE_FINISH_POINTS,
        "difficultyPoints": round(difficulty, 1),
        "difficultySource": "grade_level" if grade_hint is not None else f"pages ({format})",
        "engagementPoints": round(engagement, 1),
        "diversityBonus": diversity,
        "genre": genre,
    }


# ── Level tiers ────────────────────────────────────────────────────────────────
# Cumulative RQS across every finished book -> a level, same six-tier ladder
# as before but now gated on quality-weighted score instead of a raw book
# count, so two kids who've each finished 3 books can land on different
# levels depending on what (and how well) they actually read.
_LEVEL_TIERS = [
    (0,   1, "New Reader",       "📖"),
    (25,  2, "Page Explorer",    "🔍"),
    (75,  3, "Bookworm",         "📚"),
    (160, 4, "Page Master",      "🎓"),
    (300, 5, "Reading Legend",   "🏆"),
    (500, 6, "Library Champion", "👑"),
]


def determine_level(total_rqs: float) -> dict:
    number, name, emoji = _LEVEL_TIERS[0][1], _LEVEL_TIERS[0][2], _LEVEL_TIERS[0][3]
    next_threshold = _LEVEL_TIERS[1][0] if len(_LEVEL_TIERS) > 1 else None
    for i, (threshold, lvl, nm, em) in enumerate(_LEVEL_TIERS):
        if total_rqs >= threshold:
            number, name, emoji = lvl, nm, em
            next_threshold = _LEVEL_TIERS[i + 1][0] if i + 1 < len(_LEVEL_TIERS) else None
    return {
        "number": number, "name": name, "emoji": emoji, "score": round(total_rqs, 1),
        "nextThreshold": next_threshold,
        "pointsToNext": round(next_threshold - total_rqs, 1) if next_threshold is not None else None,
    }


def compute_reading_level(finished_books: list) -> dict:
    """`finished_books`: list of dicts, each with keys pages, genre, format
    (or raw subjects -- pass subjects and this'll classify both), entryCount,
    summary, gradeHint, in the order they were approved (oldest first) so the
    diversity bonus credits whichever book in a genre came first."""
    seen_genres = set()
    breakdown = []
    total = 0.0
    for book in finished_books:
        subjects = book.get("subjects") or []
        genre = book.get("genre") or classify_genre(subjects)
        fmt = book.get("format") or detect_format(subjects)
        result = score_finished_book(
            pages=book.get("pages"), genre=genre, prior_genres=seen_genres,
            entry_count=book.get("entryCount", 0), summary=book.get("summary") or "",
            grade_hint=book.get("gradeHint"), format=fmt,
        )
        seen_genres.add(genre)
        total += result["total"]
        breakdown.append(result)

    level = determine_level(total)
    level["breakdown"] = breakdown
    level["genresRead"] = sorted(seen_genres)
    return level
