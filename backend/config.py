import os
import re

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
# The address recipients see as "From". Defaults to SMTP_USER for providers like
# Gmail where the login and the sender are the same mailbox. Transactional senders
# (Resend, SendGrid, Mailgun, SES...) authenticate with a fixed username or API key
# that ISN'T a real mailbox, so EMAIL_FROM lets you send as e.g. help@rewardurkids.com
# while SMTP_USER/PASSWORD stay whatever the provider issued you.
EMAIL_FROM    = os.getenv("EMAIL_FROM", SMTP_USER)

if not SMTP_USER or not SMTP_PASSWORD:
    print("[email] WARNING: SMTP_USER and/or SMTP_PASSWORD are not set — outgoing emails will not be sent")

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

ACTIVATION_TOKEN_TTL_HOURS = 24
RESET_TOKEN_TTL_HOURS = 1
