# ParentShopee — Build Summary

**Date:** 2026-06-25  
**Built by:** 4-agent team (BA, Backend Developer, Frontend Developer, QA Engineer)

---

## Overview

ParentShopee is a full-stack family chore & reward management app. Parents set up chores with point values and a shop of redeemable rewards. Kids complete chores, earn points, and spend them in the shop. All chore completions require parent approval before points are credited.

---

## Requirements (Business Analyst)

| Feature | Status |
|---------|--------|
| Parents add chores with points | ✅ |
| Parents create/manage a shop | ✅ |
| Parents add/remove shop items | ✅ |
| Parents update item cost | ✅ |
| Parents update chore points | ✅ |
| Chore completion requires parent approval | ✅ |
| Kids see available chores + point values | ✅ |
| Kids have a points wallet | ✅ |
| Kids can buy items from shop (deducts balance) | ✅ |
| Kids mark chores complete (pending approval) | ✅ |
| Parent chore list: Open / Pending / Complete | ✅ |

---

## Architecture

```
ParentShopee/
├── backend/          # Express REST API — port 3001
├── frontend/         # React + Vite SPA — port 3000
├── tests/            # Jest API test suite
└── documentation/    # This file
```

### Stack
| Layer | Technology |
|-------|-----------|
| Backend | Node.js 18+, Express 4, CORS, UUID |
| Frontend | React 18, Vite 4 |
| Data store | In-memory (arrays + objects) — resets on server restart |
| Auth | UUID bearer tokens, in-memory session map |
| Tests | Jest 29, node-fetch 2 |

---

## Backend (port 3001)

**File:** `backend/server.js`

### Seed Data

**Users:**
| Username | Password | Role | Display Name |
|----------|----------|------|--------------|
| parent1 | pass1 | parent | Mom |
| parent2 | pass2 | parent | Dad |
| kid1 | pass1 | kid | Alice |
| kid2 | pass1 | kid | Bob |
| kid3 | pass1 | kid | Charlie |

**Pre-seeded chores:** 4 chores (2 open, 1 pending, 1 complete)  
**Pre-seeded shop items:** 4 items (Screen Time, Choose Dinner, Stay Up Late, Movie Night Pick)  
**Pre-seeded wallets:** Alice = 30 pts, Charlie = 20 pts

### API Endpoints

#### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | None | Login → `{token, user}` |

#### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/kids` | Any | List all kids |
| GET | `/api/users/parents` | Any | List all parents |

#### Chores
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/chores` | Any | List chores (`?status=`, `?kidId=`) |
| POST | `/api/chores` | Parent | Create chore |
| PUT | `/api/chores/:id` | Parent | Update chore |
| DELETE | `/api/chores/:id` | Parent | Delete chore (open only) |
| POST | `/api/chores/:id/complete` | Kid | Mark complete → pending |
| POST | `/api/chores/:id/approve` | Parent | Approve → complete + credit wallet |
| POST | `/api/chores/:id/reject` | Parent | Reject → back to open |

#### Shop
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/shop` | Any | List shop items |
| POST | `/api/shop` | Parent | Add item |
| PUT | `/api/shop/:id` | Parent | Update item |
| DELETE | `/api/shop/:id` | Parent | Remove item |
| POST | `/api/shop/:id/buy` | Kid | Buy item (deducts wallet) |

#### Wallet
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/wallet` | Any | All kids wallet summary |
| GET | `/api/wallet/:kidId` | Any* | Kid wallet + transactions |

*Kids can only view their own wallet.

### Response Format
All responses follow:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "message" }
```

---

## Frontend (port 3000)

**Directory:** `frontend/src/`

### Components

| Component | Purpose |
|-----------|---------|
| `Login.jsx` | Username/password form, routes by role after login |
| `ParentDashboard.jsx` | 3-tab view: Chores, Shop, Kids |
| `KidDashboard.jsx` | 3-tab view: Chores, Shop, Wallet |
| `ChoreCard.jsx` | Reusable chore card with status badge |
| `ShopItem.jsx` | Shop item card with buy/edit/delete |
| `WalletView.jsx` | Balance + transaction history |
| `AuthContext.jsx` | Global auth state (token, user, logout) persisted to localStorage |
| `api.js` | Fetch wrapper — injects Authorization header automatically |

### Parent Dashboard
- **Chores tab**: Shows 3 groups — Open (with Edit/Delete), Pending (with Approve/Reject), Complete — plus an Add Chore form
- **Shop tab**: Grid of items with Edit/Delete; Add Item form
- **Kids tab**: Table of all kids with balance; click to see transaction history

### Kid Dashboard
- **Chores tab**: Available chores (Mark Complete button), My Pending, My Completed
- **Shop tab**: Shop grid with current balance displayed; Buy button disabled if insufficient points
- **Wallet tab**: Large balance display + colour-coded transaction history (earned=green, spent=red)

---

## How to Run

### Prerequisites
- Node.js 18+
- npm 9+

### Start Backend
```bash
cd backend
npm install     # if not already done
npm start       # starts Express on port 3001
```

### Start Frontend
```bash
cd frontend
npm install     # if not already done
npm run dev     # starts Vite dev server on port 3000
```

### Open App
Navigate to **http://localhost:5173**

### Test Credentials
- Parent: `parent1` / `pass1`
- Kid: `kid1` / `pass1`

---

## Run Tests

```bash
cd tests
npm install
npm test
```

See `tests/report.md` for the full test report.

---

## Chore State Machine

```
         Parent creates
              │
           [open]
              │
    Kid marks complete
              │
          [pending]  ◄─── Parent rejects
              │
    Parent approves
              │
          [complete]
         (points credited to kid wallet)
```

---

## Known Limitations

- **Data is in-memory**: Restarting the backend resets all data to seed state.
- **No persistence**: No database — intended for demo/development.
- **No real authentication**: Passwords are plain text; tokens are not signed JWTs.
- **Single-family**: No multi-family isolation; all parents see all kids.

---

## Agent Team Roles

| Agent | Responsibility | Output |
|-------|---------------|--------|
| Business Analyst | Requirements definition | Requirements spec (above) |
| Backend Developer | Express REST API | `backend/server.js`, `backend/package.json` |
| Frontend Developer | React + Vite UI | `frontend/src/**`, `frontend/vite.config.js` |
| QA Engineer | Jest tests + report | `tests/api.test.js`, `tests/report.md` |
