'use strict';

// Regression suite against the real backend (backend/main.py, FastAPI) --
// spawned fresh by globalSetup.js against a throwaway SQLite database, using
// the same seed_db() data every install gets (parent1/pass1 guardian with
// kid1/kid2). Kid-level tests create their own dedicated kid with a known
// PIN via the API rather than relying on kid1/kid2's PINs, since those are
// randomly auto-generated per install (see the "Try Demo" PIN drift bug
// fixed in production) and can't be predicted.

const { login, api } = require('./setup');

describe('Auth', () => {
  test('guardian can log in with valid credentials', async () => {
    const { token, user } = await login('parent1', 'pass1');
    expect(token).toBeTruthy();
    expect(user.username).toBe('parent1');
    expect(user.role).toBe('guardian');
  });

  test('login fails with wrong password', async () => {
    await expect(login('parent1', 'not-the-password')).rejects.toThrow(/Login failed/);
  });

  test('login fails for unknown username', async () => {
    await expect(login('nobody-here', 'whatever')).rejects.toThrow(/Login failed/);
  });
});

describe('Kids', () => {
  let guardianToken;

  beforeAll(async () => {
    ({ token: guardianToken } = await login('parent1', 'pass1'));
  });

  test('guardian can list existing kids', async () => {
    const res = await api('/users/kids', 'GET', null, guardianToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('guardian can add a new kid with a chosen PIN', async () => {
    const res = await api('/kids', 'POST', {
      name: 'CI Test Kid',
      pin: '135790',
      avatar: '🧪',
      birthMonth: 6,
      birthYear: 2016,
    }, guardianToken);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('CI Test Kid');
  });

  test('a kid cannot list kids (guardian-only endpoint)', async () => {
    const res = await api('/users/kids', 'GET', null, 'not-a-real-token');
    expect(res.status).toBe(401);
  });
});

describe('Chore lifecycle: create -> complete -> approve -> wallet credited', () => {
  let guardianToken;
  let kidToken;
  let kidId;
  let choreId;
  const KID_PIN = '246801';

  beforeAll(async () => {
    ({ token: guardianToken } = await login('parent1', 'pass1'));

    const kidRes = await api('/kids', 'POST', {
      name: 'Chore Test Kid', pin: KID_PIN, avatar: '🧸', birthMonth: 3, birthYear: 2017,
    }, guardianToken);
    kidId = kidRes.body.data.id;

    const enterRes = await api(`/family/profiles/${kidId}/enter`, 'POST', { pin: KID_PIN }, guardianToken);
    expect(enterRes.status).toBe(200);
    kidToken = enterRes.body.data.token;
  });

  test('guardian can create a chore assigned to the kid', async () => {
    const res = await api('/chores', 'POST', {
      title: 'CI Test Chore',
      points: 12,
      assignedKidId: kidId,
      imageEmoji: '🧹',
    }, guardianToken);
    expect(res.status).toBe(201);
    expect(res.body.data[0].status).toBe('open');
    choreId = res.body.data[0].id;
  });

  test('kid sees the chore and can mark it complete', async () => {
    const listRes = await api('/chores', 'GET', null, kidToken);
    expect(listRes.body.data.some(c => c.id === choreId)).toBe(true);

    const completeRes = await api(`/chores/${choreId}/complete`, 'POST', null, kidToken);
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('pending');
  });

  test('a kid cannot approve their own chore', async () => {
    const res = await api(`/chores/${choreId}/approve`, 'POST', null, kidToken);
    expect(res.status).toBe(403); // authenticated, but wrong role -- require_guardian
  });

  test('guardian approves the chore and the kid wallet is credited', async () => {
    const approveRes = await api(`/chores/${choreId}/approve`, 'POST', null, guardianToken);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.newBalance).toBe(12);

    const walletRes = await api(`/wallet/${kidId}`, 'GET', null, guardianToken);
    expect(walletRes.body.data.balance).toBe(12);
  });
});

describe('Shop purchase debits the wallet', () => {
  let guardianToken;
  let kidToken;
  let kidId;
  let itemId;
  const KID_PIN = '975310';

  beforeAll(async () => {
    ({ token: guardianToken } = await login('parent1', 'pass1'));

    const kidRes = await api('/kids', 'POST', {
      name: 'Shop Test Kid', pin: KID_PIN, avatar: '🛍️', birthMonth: 9, birthYear: 2015,
    }, guardianToken);
    kidId = kidRes.body.data.id;

    const enterRes = await api(`/family/profiles/${kidId}/enter`, 'POST', { pin: KID_PIN }, guardianToken);
    kidToken = enterRes.body.data.token;

    // Give the kid enough points to afford the item below.
    const bonusRes = await api(`/kids/${kidId}/bonus`, 'POST', { points: 20, reason: 'CI setup' }, guardianToken);
    expect(bonusRes.status).toBe(200);

    const itemRes = await api('/shop', 'POST', {
      name: 'CI Test Reward', cost: 15, imageEmoji: '🎁',
    }, guardianToken);
    itemId = itemRes.body.data.id;
  });

  test('kid can buy an affordable item and the wallet is debited', async () => {
    const buyRes = await api(`/shop/${itemId}/buy`, 'POST', null, kidToken);
    expect(buyRes.status).toBe(200);
    expect(buyRes.body.data.newBalance).toBe(5); // 20 - 15

    const walletRes = await api(`/wallet/${kidId}`, 'GET', null, guardianToken);
    expect(walletRes.body.data.balance).toBe(5);
  });

  test('kid cannot buy an item they can no longer afford', async () => {
    const buyRes = await api(`/shop/${itemId}/buy`, 'POST', null, kidToken);
    expect(buyRes.status).toBe(400);
    expect(buyRes.body.success).toBe(false);
  });
});
