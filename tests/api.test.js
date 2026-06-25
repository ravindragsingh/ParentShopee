'use strict';

const { login, api } = require('./setup');

// ─── Shared state ────────────────────────────────────────────────────────────

let parentToken; // parent1
let parent2Token; // parent2
let kidToken;   // kid1 (balance 30)
let kid2Token;  // kid2 (balance 0)
let kid3Token;  // kid3 (balance 20)

let parentUser;
let kidUser;

// ─── Global beforeAll ────────────────────────────────────────────────────────

beforeAll(async () => {
  const p1 = await login('parent1', 'pass1');
  parentToken = p1.token;
  parentUser = p1.user;

  const p2 = await login('parent2', 'pass2');
  parent2Token = p2.token;

  const k1 = await login('kid1', 'pass1');
  kidToken = k1.token;
  kidUser = k1.user;

  const k2 = await login('kid2', 'pass1');
  kid2Token = k2.token;

  const k3 = await login('kid3', 'pass1');
  kid3Token = k3.token;
});

// ══════════════════════════════════════════════════════════════════════════════
// AUTH TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe('Auth', () => {
  test('login with valid parent credentials returns 200 with token and user', async () => {
    const { status, body } = await api('/auth/login', 'POST', {
      username: 'parent1',
      password: 'pass1',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('token');
    expect(body.data.user).toMatchObject({ role: 'parent' });
  });

  test('login with valid kid credentials returns 200 with token and user', async () => {
    const { status, body } = await api('/auth/login', 'POST', {
      username: 'kid1',
      password: 'pass1',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('token');
    expect(body.data.user).toMatchObject({ role: 'kid' });
  });

  test('login with wrong password returns 401', async () => {
    const { status, body } = await api('/auth/login', 'POST', {
      username: 'parent1',
      password: 'wrongpassword',
    });
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  test('login with unknown username returns 401', async () => {
    const { status, body } = await api('/auth/login', 'POST', {
      username: 'nobody',
      password: 'pass1',
    });
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  test('accessing protected route without token returns 401', async () => {
    const { status, body } = await api('/chores', 'GET', null, null);
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  test('login with missing fields returns 400', async () => {
    const { status, body } = await api('/auth/login', 'POST', { username: 'parent1' });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CHORES — PARENT
// ══════════════════════════════════════════════════════════════════════════════

describe('Chores - Parent', () => {
  test('GET /chores returns an array', async () => {
    const { status, body } = await api('/chores', 'GET', null, parentToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('POST /chores creates a chore with title, description, points', async () => {
    const { status, body } = await api(
      '/chores',
      'POST',
      { title: 'Test Chore A', description: 'Do something', points: 7 },
      parentToken
    );
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      title: 'Test Chore A',
      description: 'Do something',
      points: 7,
      status: 'open',
    });
    expect(body.data).toHaveProperty('id');
  });

  test('POST /chores without auth returns 401', async () => {
    const { status, body } = await api(
      '/chores',
      'POST',
      { title: 'Sneaky Chore', points: 5 },
      null
    );
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  test('PUT /chores/:id updates chore points', async () => {
    // Create a fresh chore to update
    const createRes = await api(
      '/chores',
      'POST',
      { title: 'Chore to Update', points: 5 },
      parentToken
    );
    const choreId = createRes.body.data.id;

    const { status, body } = await api(
      `/chores/${choreId}`,
      'PUT',
      { points: 99 },
      parentToken
    );
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.points).toBe(99);
  });

  test('DELETE /chores/:id removes an open chore', async () => {
    const createRes = await api(
      '/chores',
      'POST',
      { title: 'Chore to Delete', points: 3 },
      parentToken
    );
    const choreId = createRes.body.data.id;

    const { status, body } = await api(`/chores/${choreId}`, 'DELETE', null, parentToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(choreId);

    // Verify it no longer appears in list
    const listRes = await api('/chores', 'GET', null, parentToken);
    const found = listRes.body.data.find((c) => c.id === choreId);
    expect(found).toBeUndefined();
  });

  test('DELETE /chores/:id returns 400 when chore is not open', async () => {
    // Create chore, have a kid mark it complete, then attempt delete
    const createRes = await api(
      '/chores',
      'POST',
      { title: 'Chore Non-Open', points: 4 },
      parentToken
    );
    const choreId = createRes.body.data.id;

    // kid1 marks it complete (open → pending)
    await api(`/chores/${choreId}/complete`, 'POST', null, kidToken);

    // Parent tries to delete a pending chore — should fail
    const { status, body } = await api(`/chores/${choreId}`, 'DELETE', null, parentToken);
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  test('GET /chores?status=open returns only open chores', async () => {
    const { status, body } = await api('/chores?status=open', 'GET', null, parentToken);
    expect(status).toBe(200);
    expect(body.data.every((c) => c.status === 'open')).toBe(true);
  });

  test('GET /chores?status=pending returns only pending chores', async () => {
    const { status, body } = await api('/chores?status=pending', 'GET', null, parentToken);
    expect(status).toBe(200);
    expect(body.data.every((c) => c.status === 'pending')).toBe(true);
  });

  test('POST /chores with invalid points returns 400', async () => {
    const { status, body } = await api(
      '/chores',
      'POST',
      { title: 'Bad Points', points: -5 },
      parentToken
    );
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  test('PUT /chores/:id returns 404 for unknown chore', async () => {
    const { status, body } = await api('/chores/nonexistent-id', 'PUT', { points: 10 }, parentToken);
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CHORES — KID
// ══════════════════════════════════════════════════════════════════════════════

describe('Chores - Kid', () => {
  test('kid can GET /chores', async () => {
    const { status, body } = await api('/chores', 'GET', null, kidToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('kid can POST /chores/:id/complete to mark an open chore pending', async () => {
    // Parent creates a fresh unassigned open chore
    const createRes = await api(
      '/chores',
      'POST',
      { title: 'Kid Complete Test', points: 8 },
      parentToken
    );
    const choreId = createRes.body.data.id;

    const { status, body } = await api(`/chores/${choreId}/complete`, 'POST', null, kidToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('pending');
    expect(body.data.completedByKidId).toBe(kidUser.id);
  });

  test('kid cannot POST /chores (create) — returns 403', async () => {
    const { status, body } = await api(
      '/chores',
      'POST',
      { title: 'Kid created chore', points: 5 },
      kidToken
    );
    expect(status).toBe(403);
    expect(body.success).toBe(false);
  });

  test('parent can approve a pending chore — chore becomes complete', async () => {
    // Create chore → kid completes → parent approves
    const createRes = await api(
      '/chores',
      'POST',
      { title: 'Approve Test Chore', points: 6 },
      parentToken
    );
    const choreId = createRes.body.data.id;

    // kid2 marks it complete
    await api(`/chores/${choreId}/complete`, 'POST', null, kid2Token);

    const { status, body } = await api(`/chores/${choreId}/approve`, 'POST', null, parentToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.chore.status).toBe('complete');
  });

  test('parent can reject a pending chore — chore goes back to open', async () => {
    const createRes = await api(
      '/chores',
      'POST',
      { title: 'Reject Test Chore', points: 6 },
      parentToken
    );
    const choreId = createRes.body.data.id;

    await api(`/chores/${choreId}/complete`, 'POST', null, kidToken);

    const { status, body } = await api(`/chores/${choreId}/reject`, 'POST', null, parentToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('open');
    expect(body.data.completedByKidId).toBeNull();
  });

  test('kid cannot complete a chore assigned to a different kid', async () => {
    // Create a chore assigned to kid2
    const createRes = await api(
      '/chores',
      'POST',
      { title: 'Assigned to kid2', points: 5, assignedKidId: 'kid2' },
      parentToken
    );
    const choreId = createRes.body.data.id;

    // kid1 tries to complete it
    const { status, body } = await api(`/chores/${choreId}/complete`, 'POST', null, kidToken);
    expect(status).toBe(403);
    expect(body.success).toBe(false);
  });

  test('kid cannot complete an already-pending chore', async () => {
    const createRes = await api(
      '/chores',
      'POST',
      { title: 'Already Pending', points: 5 },
      parentToken
    );
    const choreId = createRes.body.data.id;

    await api(`/chores/${choreId}/complete`, 'POST', null, kidToken);

    // Try again
    const { status, body } = await api(`/chores/${choreId}/complete`, 'POST', null, kidToken);
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SHOP
// ══════════════════════════════════════════════════════════════════════════════

describe('Shop', () => {
  test('GET /shop returns items array', async () => {
    const { status, body } = await api('/shop', 'GET', null, parentToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('parent can POST /shop to add item', async () => {
    const { status, body } = await api(
      '/shop',
      'POST',
      { name: 'Test Item', description: 'A test reward', cost: 15, imageEmoji: '🎯' },
      parentToken
    );
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({ name: 'Test Item', cost: 15 });
    expect(body.data).toHaveProperty('id');
  });

  test('parent can PUT /shop/:id to update cost', async () => {
    const createRes = await api(
      '/shop',
      'POST',
      { name: 'Item to Update', cost: 10 },
      parentToken
    );
    const itemId = createRes.body.data.id;

    const { status, body } = await api(`/shop/${itemId}`, 'PUT', { cost: 50 }, parentToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.cost).toBe(50);
  });

  test('parent can DELETE /shop/:id', async () => {
    const createRes = await api(
      '/shop',
      'POST',
      { name: 'Item to Delete', cost: 5 },
      parentToken
    );
    const itemId = createRes.body.data.id;

    const { status, body } = await api(`/shop/${itemId}`, 'DELETE', null, parentToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(itemId);
  });

  test('kid can GET /shop', async () => {
    const { status, body } = await api('/shop', 'GET', null, kidToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('kid cannot DELETE /shop/:id — returns 403', async () => {
    // First, parent creates item
    const createRes = await api(
      '/shop',
      'POST',
      { name: 'Protected Item', cost: 10 },
      parentToken
    );
    const itemId = createRes.body.data.id;

    const { status, body } = await api(`/shop/${itemId}`, 'DELETE', null, kidToken);
    expect(status).toBe(403);
    expect(body.success).toBe(false);
  });

  test('POST /shop without auth returns 401', async () => {
    const { status } = await api('/shop', 'POST', { name: 'Sneaky', cost: 5 }, null);
    expect(status).toBe(401);
  });

  test('POST /shop with negative cost returns 400', async () => {
    const { status, body } = await api(
      '/shop',
      'POST',
      { name: 'Bad Cost Item', cost: -10 },
      parentToken
    );
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  test('PUT /shop/:id returns 404 for unknown item', async () => {
    const { status, body } = await api('/shop/nonexistent-id', 'PUT', { cost: 10 }, parentToken);
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// WALLET
// ══════════════════════════════════════════════════════════════════════════════

describe('Wallet', () => {
  test('GET /wallet/:kidId returns balance and transactions for a kid', async () => {
    const { status, body } = await api('/wallet/kid1', 'GET', null, parentToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('balance');
    expect(body.data).toHaveProperty('transactions');
    expect(Array.isArray(body.data.transactions)).toBe(true);
    expect(body.data.kidId).toBe('kid1');
  });

  test('after approving a chore, kid balance increases by chore points', async () => {
    // Get kid2 starting balance
    const walletBefore = await api('/wallet/kid2', 'GET', null, parentToken);
    const balanceBefore = walletBefore.body.data.balance;

    // Create chore with known points
    const points = 12;
    const createRes = await api(
      '/chores',
      'POST',
      { title: 'Wallet Test Chore', points },
      parentToken
    );
    const choreId = createRes.body.data.id;

    // kid2 marks complete
    await api(`/chores/${choreId}/complete`, 'POST', null, kid2Token);

    // Parent approves
    const approveRes = await api(`/chores/${choreId}/approve`, 'POST', null, parentToken);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.newBalance).toBe(balanceBefore + points);

    // Verify via wallet endpoint
    const walletAfter = await api('/wallet/kid2', 'GET', null, parentToken);
    expect(walletAfter.body.data.balance).toBe(balanceBefore + points);
  });

  test('after buying a shop item, kid balance decreases by item cost', async () => {
    // kid1 starts with 30 points; create a cheap item
    const walletBefore = await api('/wallet/kid1', 'GET', null, parentToken);
    const balanceBefore = walletBefore.body.data.balance;

    const cost = 5;
    const createItem = await api(
      '/shop',
      'POST',
      { name: 'Cheap Reward', cost },
      parentToken
    );
    const itemId = createItem.body.data.id;

    const { status, body } = await api(`/shop/${itemId}/buy`, 'POST', null, kidToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.newBalance).toBe(balanceBefore - cost);

    // Verify via wallet endpoint
    const walletAfter = await api('/wallet/kid1', 'GET', null, parentToken);
    expect(walletAfter.body.data.balance).toBe(balanceBefore - cost);
  });

  test('buying an item with insufficient balance returns 400', async () => {
    // kid2 balance is 0 at start (may have been increased in prior test; use fresh kid3 with known low balance)
    // We'll check kid2 whose base balance is 0 – but prior tests may have added to it
    // To be safe, create an expensive item (cost = 9999)
    const expensiveItem = await api(
      '/shop',
      'POST',
      { name: 'Very Expensive', cost: 9999 },
      parentToken
    );
    const itemId = expensiveItem.body.data.id;

    const { status, body } = await api(`/shop/${itemId}/buy`, 'POST', null, kidToken);
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  test('kid can view own wallet', async () => {
    const { status, body } = await api('/wallet/kid1', 'GET', null, kidToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.kidId).toBe('kid1');
  });

  test('kid cannot view another kid wallet — returns 403', async () => {
    // kid1 tries to view kid2 wallet
    const { status, body } = await api('/wallet/kid2', 'GET', null, kidToken);
    expect(status).toBe(403);
    expect(body.success).toBe(false);
  });

  test('GET /wallet returns summary for all kids', async () => {
    const { status, body } = await api('/wallet', 'GET', null, parentToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    // Each entry should have kidId, name, balance, transactionCount
    body.data.forEach((entry) => {
      expect(entry).toHaveProperty('kidId');
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('balance');
      expect(entry).toHaveProperty('transactionCount');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════════════════════════

describe('Users', () => {
  test('GET /users/kids returns list of kids', async () => {
    const { status, body } = await api('/users/kids', 'GET', null, parentToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    body.data.forEach((u) => expect(u.role).toBe('kid'));
  });

  test('GET /users/parents returns list of parents', async () => {
    const { status, body } = await api('/users/parents', 'GET', null, parentToken);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    body.data.forEach((u) => expect(u.role).toBe('parent'));
  });

  test('GET /users/kids requires auth', async () => {
    const { status } = await api('/users/kids', 'GET', null, null);
    expect(status).toBe(401);
  });

  test('GET /users/parents requires auth', async () => {
    const { status } = await api('/users/parents', 'GET', null, null);
    expect(status).toBe(401);
  });

  test('kids list does not expose passwords', async () => {
    const { body } = await api('/users/kids', 'GET', null, parentToken);
    body.data.forEach((u) => {
      expect(u).not.toHaveProperty('password');
    });
  });
});
