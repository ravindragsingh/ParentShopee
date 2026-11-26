"""One-time backfill: set DBUser.google_id for any account that signed up via
a Firebase-verified Google sign-in (web popup, or a co-guardian accepting
their invite with Google -- see routers/auth.py's register_finalize and
routers/family.py's accept_coguardian_invite) but never got google_id set.

Why this was needed: the native Android/iOS app's own Google sign-in
(/api/auth/google, /api/auth/google/complete) never touches Firebase at all --
it looks accounts up by google_id only. A handful of code paths that create a
Firebase-linked account forgot to also set google_id, so an account created
or linked that way could sign into the web app but not the native app with
the same Google account. Those code paths are now fixed (see git history),
but any row created before the fix is still missing it -- this backfills them
using Firebase's own record of the linked Google provider, not a guess.

Safe to re-run -- rows that already have google_id are skipped, and each row
commits independently so a crash partway through is resumable.

Run from the backend/ directory so sibling imports resolve:

    cd backend
    python scripts/backfill_google_id.py            # local dev DB
    DATABASE_URL=... python scripts/backfill_google_id.py   # production

Needs FIREBASE_SERVICE_ACCOUNT_JSON set (or FIREBASE_AUTH_EMULATOR_HOST for
a local dry run against the Auth Emulator) -- see firebase_app.py.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal  # noqa: E402
from firebase_app import get_firebase_app  # noqa: E402
from models import DBUser  # noqa: E402


def backfill():
    app = get_firebase_app()
    if not app:
        print("Firebase Admin SDK isn't configured (FIREBASE_SERVICE_ACCOUNT_JSON / "
              "FIREBASE_AUTH_EMULATOR_HOST) -- aborting.")
        sys.exit(1)
    from firebase_admin import auth as firebase_auth

    db = SessionLocal()
    linked, no_google_provider, failed = 0, 0, []
    try:
        candidates = db.query(DBUser).filter(
            DBUser.firebase_uid.isnot(None),
            DBUser.google_id.is_(None),
        ).all()
        print(f"Found {len(candidates)} account(s) with a firebase_uid but no google_id.")

        for u in candidates:
            try:
                fb_user = firebase_auth.get_user(u.firebase_uid, app=app)
                google_provider = next(
                    (p for p in fb_user.provider_data if p.provider_id == "google.com"), None,
                )
                if not google_provider:
                    no_google_provider += 1
                    continue
                u.google_id = google_provider.uid
                db.commit()
                linked += 1
                print(f"  linked {u.username} <{u.email}> -> google_id={google_provider.uid}")
            except Exception as e:
                db.rollback()
                failed.append((u.id, u.username, str(e)))
    finally:
        db.close()

    print(f"\nDone. linked={linked} no_google_provider={no_google_provider} failed={len(failed)}")
    if failed:
        print("Failed rows (needs manual follow-up):")
        for user_id, username, reason in failed:
            print(f"  - {username} ({user_id}): {reason}")


if __name__ == "__main__":
    backfill()
