"""One-time seed script: pushes the existing local Math topics catalog into a
running Strapi instance as `kind=topic` Content Items.

Run this AFTER Strapi is up and the Question component + Content Item
content-type (see schemas/ in this folder) have been added to it — see
README.md for the full setup sequence.

Usage:
    STRAPI_URL=http://localhost:1337 STRAPI_API_TOKEN=xxx python seed_strapi.py
"""
import json
import os
import sys
import urllib.error
import urllib.request

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from math_topics_seed import MATH_TOPICS  # noqa: E402

STRAPI_URL = os.environ.get("STRAPI_URL", "http://localhost:1337")
STRAPI_API_TOKEN = os.environ.get("STRAPI_API_TOKEN")


def create_content_item(payload: dict) -> dict:
    body = json.dumps({"data": payload}).encode()
    req = urllib.request.Request(
        f"{STRAPI_URL}/api/content-items",
        data=body, method="POST",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {STRAPI_API_TOKEN}"},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.load(resp)


def main():
    if not STRAPI_API_TOKEN:
        raise SystemExit("Set STRAPI_API_TOKEN to a Strapi API token with create access on Content Item.")

    created = 0
    for i, t in enumerate(MATH_TOPICS):
        payload = {
            "title": t["title"],
            "subject": "Maths",
            "grade": 4,
            "emoji": t["emoji"],
            "kind": "topic",
            "explanation": t["explanation"],
            "questions": t["questions"],  # already [{question, answers}] — matches the component shape
        }
        try:
            res = create_content_item(payload)
        except urllib.error.HTTPError as exc:
            print(f"FAILED: {t['title']} -> {exc.code} {exc.read().decode(errors='replace')}")
            continue
        item_id = res.get("data", {}).get("id")
        print(f"Created ({i + 1}/{len(MATH_TOPICS)}): {t['title']} -> id {item_id}")
        created += 1

    print(f"\nDone — created {created}/{len(MATH_TOPICS)} topics.")
    print("They're drafts by default (draftAndPublish is on) — open the Strapi")
    print("admin panel and Publish each one before the app will see them.")


if __name__ == "__main__":
    main()
