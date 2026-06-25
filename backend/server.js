'use strict';

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:5173'] }));
app.use(express.json());

// ─── In-Memory Data Store ─────────────────────────────────────────────────────

const users = [
  { id: 'parent1', name: 'Mom',     username: 'parent1', password: 'pass1', role: 'parent' },
  { id: 'parent2', name: 'Dad',     username: 'parent2', password: 'pass2', role: 'parent' },
  { id: 'kid1',    name: 'Alice',   username: 'kid1',    password: 'pass1', role: 'kid' },
  { id: 'kid2',    name: 'Bob',     username: 'kid2',    password: 'pass1', role: 'kid' },
  { id: 'kid3',    name: 'Charlie', username: 'kid3',    password: 'pass1', role: 'kid' },
];

const chores = [
  // ── Open chores ────────────────────────────────────────────────────────────
  {
    id: uuidv4(),
    title: 'Wash the dishes',
    description: 'Wash and dry all dishes after dinner.',
    points: 10,
    status: 'open',
    assignedKidId: 'kid1',
    completedByKidId: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Take out the trash',
    description: 'Take all trash bags to the bin outside.',
    points: 5,
    status: 'open',
    assignedKidId: null,
    completedByKidId: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Make your bed',
    description: 'Straighten sheets, fluff pillows, and tidy your bedroom.',
    points: 5,
    status: 'open',
    assignedKidId: 'kid1',
    completedByKidId: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Water the plants',
    description: 'Water all indoor and balcony plants.',
    points: 8,
    status: 'open',
    assignedKidId: 'kid2',
    completedByKidId: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Set the dinner table',
    description: 'Lay out plates, cutlery, and glasses for the whole family.',
    points: 5,
    status: 'open',
    assignedKidId: null,
    completedByKidId: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Fold the laundry',
    description: 'Fold clean clothes from the dryer and put them away.',
    points: 12,
    status: 'open',
    assignedKidId: 'kid3',
    completedByKidId: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Feed the pet',
    description: 'Fill the food and water bowl for the family pet.',
    points: 6,
    status: 'open',
    assignedKidId: null,
    completedByKidId: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Sweep the porch',
    description: 'Sweep leaves and dirt off the front porch.',
    points: 8,
    status: 'open',
    assignedKidId: 'kid2',
    completedByKidId: null,
    createdAt: new Date().toISOString(),
  },
  // ── Pending chores (completed by kid, awaiting parent approval) ────────────
  {
    id: uuidv4(),
    title: 'Vacuum the living room',
    description: 'Vacuum carpets and clean under the sofa.',
    points: 15,
    status: 'pending',
    assignedKidId: 'kid2',
    completedByKidId: 'kid2',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Wipe down the kitchen counter',
    description: 'Clean all kitchen surfaces with a damp cloth.',
    points: 7,
    status: 'pending',
    assignedKidId: null,
    completedByKidId: 'kid1',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Organise the bookshelf',
    description: 'Sort books by size and put them back neatly.',
    points: 10,
    status: 'pending',
    assignedKidId: 'kid3',
    completedByKidId: 'kid3',
    createdAt: new Date().toISOString(),
  },
  // ── Complete chores (approved, points already credited) ───────────────────
  {
    id: uuidv4(),
    title: 'Clean the bathroom',
    description: 'Scrub the sink, toilet, and wipe down surfaces.',
    points: 20,
    status: 'complete',
    assignedKidId: 'kid3',
    completedByKidId: 'kid3',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Take out recycling',
    description: 'Sort and take the recycling bins to the kerb.',
    points: 8,
    status: 'complete',
    assignedKidId: null,
    completedByKidId: 'kid1',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Mop the kitchen floor',
    description: 'Mop the kitchen floor after sweeping.',
    points: 15,
    status: 'complete',
    assignedKidId: 'kid2',
    completedByKidId: 'kid2',
    createdAt: new Date().toISOString(),
  },
];

const shopItems = [
  {
    id: uuidv4(),
    name: 'Extra Screen Time (30 min)',
    description: 'Get 30 extra minutes of screen time today.',
    cost: 10,
    imageEmoji: '📱',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Choose Dinner',
    description: 'Pick what the family eats for dinner tonight.',
    cost: 25,
    imageEmoji: '🍕',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Stay Up 1 Hour Later',
    description: 'Extend bedtime by one hour on a weekend.',
    cost: 20,
    imageEmoji: '🌙',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Movie Night Pick',
    description: 'Choose the movie for family movie night.',
    cost: 15,
    imageEmoji: '🎬',
    createdAt: new Date().toISOString(),
  },
];

// Wallets: keyed by kidId
const wallets = {
  kid1: { balance: 30, transactions: [] },
  kid2: { balance: 0,  transactions: [] },
  kid3: { balance: 0,  transactions: [] },
};

// Pre-populate a transaction for kid1 and kid3 to match seed chore data
wallets.kid1.transactions.push({
  id: uuidv4(),
  type: 'earned',
  amount: 30,
  description: 'Bonus points (seed)',
  timestamp: new Date().toISOString(),
});
wallets.kid3.transactions.push({
  id: uuidv4(),
  type: 'earned',
  amount: 20,
  description: 'Earned: Clean the bathroom',
  timestamp: new Date().toISOString(),
});
wallets.kid3.balance = 20;

// Sessions: token → user id
const sessions = {};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function fail(res, error, status = 400) {
  return res.status(status).json({ success: false, error });
}

function getUserFromToken(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const userId = sessions[token];
  if (!userId) return null;
  return users.find((u) => u.id === userId) || null;
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const user = getUserFromToken(req);
  if (!user) return fail(res, 'Unauthorized — valid Bearer token required', 401);
  req.user = user;
  next();
}

function requireParent(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'parent') return fail(res, 'Forbidden — parents only', 403);
    next();
  });
}

function requireKid(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'kid') return fail(res, 'Forbidden — kids only', 403);
    next();
  });
}

// ─── Auth Routes ─────────────────────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return fail(res, 'username and password are required');

  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) return fail(res, 'Invalid credentials', 401);

  const token = uuidv4();
  sessions[token] = user.id;

  return ok(res, {
    token,
    user: { id: user.id, name: user.name, role: user.role },
  });
});

// ─── User Routes ─────────────────────────────────────────────────────────────

app.get('/api/users/kids', requireAuth, (req, res) => {
  const kids = users
    .filter((u) => u.role === 'kid')
    .map(({ id, name, username, role }) => ({ id, name, username, role }));
  return ok(res, kids);
});

app.get('/api/users/parents', requireAuth, (req, res) => {
  const parents = users
    .filter((u) => u.role === 'parent')
    .map(({ id, name, username, role }) => ({ id, name, username, role }));
  return ok(res, parents);
});

// ─── Chore Routes ─────────────────────────────────────────────────────────────

// GET /api/chores?status=open|pending|complete&kidId=
app.get('/api/chores', requireAuth, (req, res) => {
  let result = [...chores];
  const { status, kidId } = req.query;
  if (status) result = result.filter((c) => c.status === status);
  if (kidId)  result = result.filter((c) => c.assignedKidId === kidId || c.completedByKidId === kidId);
  return ok(res, result);
});

// POST /api/chores — parent creates
app.post('/api/chores', requireParent, (req, res) => {
  const { title, description, points, assignedKidId } = req.body || {};
  if (!title || points === undefined) return fail(res, 'title and points are required');
  if (typeof points !== 'number' || points < 0) return fail(res, 'points must be a non-negative number');

  if (assignedKidId) {
    const kid = users.find((u) => u.id === assignedKidId && u.role === 'kid');
    if (!kid) return fail(res, 'assignedKidId does not match any kid', 404);
  }

  const chore = {
    id: uuidv4(),
    title,
    description: description || '',
    points,
    status: 'open',
    assignedKidId: assignedKidId || null,
    completedByKidId: null,
    createdAt: new Date().toISOString(),
  };
  chores.push(chore);
  return ok(res, chore, 201);
});

// PUT /api/chores/:id — parent updates
app.put('/api/chores/:id', requireParent, (req, res) => {
  const chore = chores.find((c) => c.id === req.params.id);
  if (!chore) return fail(res, 'Chore not found', 404);

  const { title, description, points, assignedKidId, status } = req.body || {};

  if (title !== undefined)       chore.title = title;
  if (description !== undefined) chore.description = description;
  if (points !== undefined) {
    if (typeof points !== 'number' || points < 0) return fail(res, 'points must be a non-negative number');
    chore.points = points;
  }
  if (assignedKidId !== undefined) {
    if (assignedKidId !== null) {
      const kid = users.find((u) => u.id === assignedKidId && u.role === 'kid');
      if (!kid) return fail(res, 'assignedKidId does not match any kid', 404);
    }
    chore.assignedKidId = assignedKidId;
  }
  if (status !== undefined) {
    const validStatuses = ['open', 'pending', 'complete'];
    if (!validStatuses.includes(status)) return fail(res, 'status must be open, pending, or complete');
    chore.status = status;
  }

  return ok(res, chore);
});

// DELETE /api/chores/:id — parent deletes (only if open)
app.delete('/api/chores/:id', requireParent, (req, res) => {
  const idx = chores.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return fail(res, 'Chore not found', 404);
  if (chores[idx].status !== 'open') return fail(res, 'Only open chores can be deleted');

  const [deleted] = chores.splice(idx, 1);
  return ok(res, deleted);
});

// POST /api/chores/:id/complete — kid marks complete (open → pending)
app.post('/api/chores/:id/complete', requireKid, (req, res) => {
  const chore = chores.find((c) => c.id === req.params.id);
  if (!chore) return fail(res, 'Chore not found', 404);
  if (chore.status !== 'open') return fail(res, 'Only open chores can be marked complete');
  if (chore.assignedKidId && chore.assignedKidId !== req.user.id) {
    return fail(res, 'This chore is assigned to a different kid', 403);
  }

  chore.status = 'pending';
  chore.completedByKidId = req.user.id;
  return ok(res, chore);
});

// POST /api/chores/:id/approve — parent approves (pending → complete, adds points)
app.post('/api/chores/:id/approve', requireParent, (req, res) => {
  const chore = chores.find((c) => c.id === req.params.id);
  if (!chore) return fail(res, 'Chore not found', 404);
  if (chore.status !== 'pending') return fail(res, 'Only pending chores can be approved');

  const kidId = chore.completedByKidId;
  if (!kidId) return fail(res, 'No kid associated with this chore completion');

  // Credit points to kid wallet
  if (!wallets[kidId]) wallets[kidId] = { balance: 0, transactions: [] };
  wallets[kidId].balance += chore.points;
  wallets[kidId].transactions.push({
    id: uuidv4(),
    type: 'earned',
    amount: chore.points,
    description: `Earned: ${chore.title}`,
    timestamp: new Date().toISOString(),
  });

  chore.status = 'complete';
  return ok(res, { chore, newBalance: wallets[kidId].balance });
});

// POST /api/chores/:id/reject — parent rejects (pending → open)
app.post('/api/chores/:id/reject', requireParent, (req, res) => {
  const chore = chores.find((c) => c.id === req.params.id);
  if (!chore) return fail(res, 'Chore not found', 404);
  if (chore.status !== 'pending') return fail(res, 'Only pending chores can be rejected');

  chore.status = 'open';
  chore.completedByKidId = null;
  return ok(res, chore);
});

// ─── Shop Routes ─────────────────────────────────────────────────────────────

// GET /api/shop
app.get('/api/shop', requireAuth, (req, res) => {
  return ok(res, shopItems);
});

// POST /api/shop — parent adds item
app.post('/api/shop', requireParent, (req, res) => {
  const { name, description, cost, imageEmoji } = req.body || {};
  if (!name || cost === undefined) return fail(res, 'name and cost are required');
  if (typeof cost !== 'number' || cost < 0) return fail(res, 'cost must be a non-negative number');

  const item = {
    id: uuidv4(),
    name,
    description: description || '',
    cost,
    imageEmoji: imageEmoji || '🎁',
    createdAt: new Date().toISOString(),
  };
  shopItems.push(item);
  return ok(res, item, 201);
});

// PUT /api/shop/:id — parent updates item
app.put('/api/shop/:id', requireParent, (req, res) => {
  const item = shopItems.find((i) => i.id === req.params.id);
  if (!item) return fail(res, 'Shop item not found', 404);

  const { name, description, cost, imageEmoji } = req.body || {};
  if (name !== undefined)        item.name = name;
  if (description !== undefined) item.description = description;
  if (cost !== undefined) {
    if (typeof cost !== 'number' || cost < 0) return fail(res, 'cost must be a non-negative number');
    item.cost = cost;
  }
  if (imageEmoji !== undefined)  item.imageEmoji = imageEmoji;

  return ok(res, item);
});

// DELETE /api/shop/:id — parent removes item
app.delete('/api/shop/:id', requireParent, (req, res) => {
  const idx = shopItems.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return fail(res, 'Shop item not found', 404);

  const [deleted] = shopItems.splice(idx, 1);
  return ok(res, deleted);
});

// POST /api/shop/:id/buy — kid buys item
app.post('/api/shop/:id/buy', requireKid, (req, res) => {
  const item = shopItems.find((i) => i.id === req.params.id);
  if (!item) return fail(res, 'Shop item not found', 404);

  // Allow body kidId override, but fall back to authenticated kid
  const kidId = (req.body && req.body.kidId) ? req.body.kidId : req.user.id;

  // Verify the authenticated user is the kid making the purchase (or it matches)
  if (kidId !== req.user.id) return fail(res, 'You can only buy items for yourself', 403);

  if (!wallets[kidId]) wallets[kidId] = { balance: 0, transactions: [] };

  if (wallets[kidId].balance < item.cost) {
    return fail(res, `Insufficient points. Need ${item.cost}, have ${wallets[kidId].balance}`);
  }

  wallets[kidId].balance -= item.cost;
  wallets[kidId].transactions.push({
    id: uuidv4(),
    type: 'spent',
    amount: item.cost,
    description: `Bought: ${item.name}`,
    timestamp: new Date().toISOString(),
  });

  return ok(res, { item, newBalance: wallets[kidId].balance });
});

// ─── Wallet Routes ────────────────────────────────────────────────────────────

// GET /api/wallet — all kids wallets summary
app.get('/api/wallet', requireAuth, (req, res) => {
  const kids = users.filter((u) => u.role === 'kid');
  const summary = kids.map((kid) => {
    const wallet = wallets[kid.id] || { balance: 0, transactions: [] };
    return {
      kidId: kid.id,
      name: kid.name,
      balance: wallet.balance,
      transactionCount: wallet.transactions.length,
    };
  });
  return ok(res, summary);
});

// GET /api/wallet/:kidId — get specific kid wallet
app.get('/api/wallet/:kidId', requireAuth, (req, res) => {
  const { kidId } = req.params;

  // Kids can only view their own wallet; parents can view any
  if (req.user.role === 'kid' && req.user.id !== kidId) {
    return fail(res, 'Forbidden — you can only view your own wallet', 403);
  }

  const kid = users.find((u) => u.id === kidId && u.role === 'kid');
  if (!kid) return fail(res, 'Kid not found', 404);

  const wallet = wallets[kidId] || { balance: 0, transactions: [] };
  return ok(res, {
    kidId,
    name: kid.name,
    balance: wallet.balance,
    transactions: wallet.transactions,
  });
});

// ─── 404 Fallback ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  return fail(res, `Route ${req.method} ${req.path} not found`, 404);
});

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`ParentShopee backend running on http://localhost:${PORT}`);
});

module.exports = app;
