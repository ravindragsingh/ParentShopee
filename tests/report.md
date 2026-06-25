# ParentShopee API Test Report

**Date:** 2026-06-25
**Environment:** Windows 11, Node.js, Jest 29
**Server:** Express backend on http://localhost:3001 (spawned by globalSetup.js)

---

## Summary

| Metric | Value |
|--------|-------|
| Total tests | 44 |
| Passed | 44 |
| Failed | 0 |
| Test suites | 1 |
| Total run time | ~1.6 s |

**Result: ALL TESTS PASSED**

---

## Test Suite Breakdown

| Suite | Tests | Passed | Failed |
|-------|-------|--------|--------|
| Auth | 6 | 6 | 0 |
| Chores - Parent | 10 | 10 | 0 |
| Chores - Kid | 7 | 7 | 0 |
| Shop | 9 | 9 | 0 |
| Wallet | 7 | 7 | 0 |
| Users | 5 | 5 | 0 |
| **Total** | **44** | **44** | **0** |

---

## Test Coverage Detail

### Auth (6 tests)
- Login with valid parent credentials → 200 with token and user
- Login with valid kid credentials → 200 with token and user
- Login with wrong password → 401
- Login with unknown username → 401
- Accessing protected route without token → 401
- Login with missing fields → 400

### Chores - Parent (10 tests)
- GET /chores returns an array
- POST /chores creates a chore with title, description, points
- POST /chores without auth → 401
- PUT /chores/:id updates chore points
- DELETE /chores/:id removes an open chore
- DELETE /chores/:id returns 400 when chore is not open (only open chores can be deleted)
- GET /chores?status=open returns only open chores
- GET /chores?status=pending returns only pending chores
- POST /chores with invalid (negative) points → 400
- PUT /chores/:id returns 404 for unknown chore ID

### Chores - Kid (7 tests)
- Kid can GET /chores
- Kid can POST /chores/:id/complete to mark an open chore pending
- Kid cannot POST /chores (create) → 403
- Parent can approve a pending chore → chore becomes complete
- Parent can reject a pending chore → chore goes back to open
- Kid cannot complete a chore assigned to a different kid → 403
- Kid cannot complete an already-pending chore → 400

### Shop (9 tests)
- GET /shop returns items array
- Parent can POST /shop to add item → 201
- Parent can PUT /shop/:id to update cost
- Parent can DELETE /shop/:id
- Kid can GET /shop
- Kid cannot DELETE /shop/:id → 403
- POST /shop without auth → 401
- POST /shop with negative cost → 400
- PUT /shop/:id returns 404 for unknown item

### Wallet (7 tests)
- GET /wallet/:kidId returns balance and transactions for a kid
- After approving a chore, kid balance increases by chore points
- After buying a shop item, kid balance decreases by item cost
- Buying an item with insufficient balance → 400
- Kid can view own wallet
- Kid cannot view another kid's wallet → 403
- GET /wallet returns summary for all kids

### Users (5 tests)
- GET /users/kids returns list of kids (all role=kid)
- GET /users/parents returns list of parents (all role=parent)
- GET /users/kids requires auth → 401 without token
- GET /users/parents requires auth → 401 without token
- Kids list does not expose password fields

---

## Failures

None. All 44 tests passed on the first run.

---

## How to Run

### Prerequisites
The backend must NOT be running separately — the test harness starts and stops it automatically via globalSetup.js / globalTeardown.js.

### Steps

```bash
# 1. Install dependencies (one-time)
cd C:\Users\ravin\Claude\ParentShopee\tests
npm install

# 2. Run all tests
npm test
```

### File layout

```
tests/
  package.json        # Jest + node-fetch dependencies
  jest.config.js      # Points to globalSetup / globalTeardown
  globalSetup.js      # Spawns the Express server before tests
  globalTeardown.js   # Kills the server process after tests
  setup.js            # Shared login() and api() helpers
  api.test.js         # 44 tests across 6 suites
  report.md           # This file
```

### Notes
- Tests run serially (--runInBand) so state changes are predictable within a suite.
- Each mutating test creates fresh resources (chores, shop items) to stay self-contained.
- Wallet balance tests snapshot the before-balance first, so they are order-independent.
