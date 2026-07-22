# Reward Ur Kids (ParentShopee)

A family chore & reward app. Parents assign chores, kids complete them to earn points, and points are redeemed for rewards in a family shop. Live at [rewardurkids.com](https://rewardurkids.com).

**Stack:** FastAPI + SQLAlchemy (SQLite locally, Postgres in production) on the backend; React + Vite on the frontend. Deployed on Render (API) and Vercel (frontend).

## Features

### For parents
- **Chores** — one-off or recurring (daily/weekly/monthly) chores, assignable to specific kids, with due dates, points, and approval before a chore counts as complete.
- **Daily Chores** — an auto-generated, age-appropriate daily checklist per kid, with an optional end-of-day point deduction for anything left unchecked.
- **Shop** — a rewards catalog kids spend points in. Parents can require their approval before a redemption is finalized (toggle in the Shop tab), and approve/reject pending requests. When approval is off, redemptions deduct points instantly as before.
- **Per-kid reports** — a weekly or monthly report per child (Kids tab → Report) showing tasks completed, points earned/spent, and current balance.
- **Bonuses / point adjustments** — award or remove points with a short note, recorded in the child's transaction history.
- **Co-parent accounts** — a second parent login with full access to the same family.
- **Messaging** — in-app messages between parents and kids.

### For kids
- Chores/Daily Chores checklist, shop with a live points balance, wallet/transaction history, and messaging with parents.

### Admin panel
- Browse all families, edit or delete any account, and drill into a family's chores/transactions.
- **Account signup date** and a **last-active timestamp** (distinct from last login) per user, so admins can tell dormant accounts from active ones.
- **Suspend / unsuspend** any parent, co-parent, or kid account — enforced immediately, both blocking new logins and ending any existing session.
- **Support tickets** — tickets submitted via the in-app Contact form are persisted (not just emailed) and appear in a Support Tickets tab, filterable by open/resolved, with one-click resolve/reopen.
- Location (country/city) capture at signup and per login, with search/filter across all families.

## Project structure

```
backend/
  main.py            FastAPI app, startup/migrations
  models.py           SQLAlchemy models
  routers/            one router per domain (auth, chores, shop, kids, admin, ...)
  schemas.py           Pydantic request bodies
  helpers.py           shared helpers (dict serializers, family lookups, etc.)
frontend/
  src/components/     React components (ParentDashboard, KidDashboard, AdminDashboard, ...)
  src/api.js           API client
```

## Running locally

**Backend**
```
cd backend
pip install -r requirements.txt
python main.py            # serves on :4001, SQLite db created automatically
```
Set `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars to provision an admin account on startup.

**Frontend**
```
cd frontend
npm install
npm run dev                # serves on :5173
```
