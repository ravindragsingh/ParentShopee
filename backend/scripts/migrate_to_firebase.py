"""One-time backfill: create a Firebase Auth user for every existing guardian
and link it via DBUser.firebase_uid, so the new Firebase-based login/register
endpoints (see routers/auth.py, firebase_app.py) have something to match
against. Safe to re-run -- already-migrated rows (firebase_uid IS NOT NULL)
are skipped, and each row commits independently so a crash partway through
is resumable.

Run from the backend/ directory so sibling imports resolve:

    cd backend
    python scripts/migrate_to_firebase.py            # local dev DB
    DATABASE_URL=... python scripts/migrate_to_firebase.py   # production

Needs FIREBASE_SERVICE_ACCOUNT_JSON set (or FIREBASE_AUTH_EMULATOR_HOST for
a local dry run against the Auth Emulator) -- see firebase_app.py.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal  # noqa: E402
from firebase_app import get_firebase_app  # noqa: E402
from models import DBUser  # noqa: E402

# Inert placeholders look like this (see helpers.generate_inert_credentials /
# the password=str(uuid4()) literal in routers/auth.py's google_complete) --
# a real password a guardian actually typed never matches this shape, but
# there's no reliable way to distinguish the two by value alone, so instead
# we key off `google_id`: set means Google-only (no real local password ever
# existed), unset means a real password is sitting in the `password` column.


def migrate():
    app = get_firebase_app()
    if not app:
        print("Firebase Admin SDK isn't configured (FIREBASE_SERVICE_ACCOUNT_JSON / "
              "FIREBASE_AUTH_EMULATOR_HOST) -- aborting.")
        sys.exit(1)
    from firebase_admin import auth as firebase_auth

    db = SessionLocal()
    migrated, skipped, failed = 0, 0, []
    try:
        # Co-guardians also carry role="guardian" but are PIN-gated profiles
        # under the family session (no email, an inert placeholder username/
        # password) -- same as kids, they never sign in with Firebase directly,
        # so co_guardian_of must be excluded here the same way is_profile
        # checks do everywhere else in the app. Admins sign in the same way
        # guardians do now (see resolve_login_identifier in routers/auth.py),
        # so they're migrated too.
        guardians = db.query(DBUser).filter(
            DBUser.role.in_(("guardian", "admin")),
            DBUser.co_guardian_of.is_(None),
            DBUser.firebase_uid.is_(None),
        ).all()
        print(f"Found {len(guardians)} account(s) without a firebase_uid.")

        for u in guardians:
            if not u.email:
                failed.append((u.id, u.username, "no email on file"))
                continue
            try:
                if u.google_id:
                    fb_user = firebase_auth.create_user(
                        email=u.email, email_verified=True, app=app,
                    )
                else:
                    fb_user = firebase_auth.create_user(
                        email=u.email, password=u.password,
                        email_verified=(u.is_active == "1"), app=app,
                    )
                u.firebase_uid = fb_user.uid
                db.commit()
                migrated += 1
                print(f"  migrated {u.username} <{u.email}> -> {fb_user.uid}")
            except firebase_auth.EmailAlreadyExistsError:
                # Already has a Firebase user from a previous partial run under a
                # different uid than what we'd have stored -- link to the existing one
                # instead of failing the whole batch.
                try:
                    existing = firebase_auth.get_user_by_email(u.email, app=app)
                    u.firebase_uid = existing.uid
                    db.commit()
                    migrated += 1
                    print(f"  linked {u.username} <{u.email}> -> existing {existing.uid}")
                except Exception as e2:
                    db.rollback()
                    failed.append((u.id, u.username, str(e2)))
            except Exception as e:
                db.rollback()
                failed.append((u.id, u.username, str(e)))
    finally:
        db.close()

    print(f"\nDone. migrated={migrated} skipped={skipped} failed={len(failed)}")
    if failed:
        print("Failed rows (needs manual follow-up):")
        for user_id, username, reason in failed:
            print(f"  - {username} ({user_id}): {reason}")


if __name__ == "__main__":
    migrate()
