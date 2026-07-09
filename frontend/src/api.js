const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function getToken() {
  return localStorage.getItem('token')
}

function authHeaders() {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

async function request(method, path, body) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25000)
  const options = {
    method,
    headers: authHeaders(),
    signal: controller.signal,
  }
  if (body !== undefined) {
    options.body = JSON.stringify(body)
  }
  try {
    const res = await fetch(`${BASE_URL}${path}`, options)
    clearTimeout(timeoutId)

    // 401 while a token exists = backend restarted and lost the in-memory session
    if (res.status === 401 && localStorage.getItem('token')) {
      window.dispatchEvent(new CustomEvent('auth:expired'))
      throw new Error('Your session has expired. Please log in again.')
    }

    const data = await res.json()
    if (!data.success) {
      throw new Error(data.error || 'Request failed')
    }
    return data.data
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.')
    }
    throw err
  }
}

export const api = {
  // Auth
  login: (username, password) =>
    request('POST', '/api/auth/login', { username, password }),
  register: (body) =>
    request('POST', '/api/auth/register', body),

  // Add-limits
  getLimits: () => request('GET', '/api/limits'),

  // Chores
  getChores: (status) =>
    request('GET', `/api/chores${status ? `?status=${status}` : ''}`),
  createChore: (body) => request('POST', '/api/chores', body),
  updateChore: (id, body) => request('PUT', `/api/chores/${id}`, body),
  deleteChore: (id) => request('DELETE', `/api/chores/${id}`),
  completeChore: (id) => request('POST', `/api/chores/${id}/complete`),
  approveChore: (id) => request('POST', `/api/chores/${id}/approve`),
  rejectChore: (id) => request('POST', `/api/chores/${id}/reject`),

  // Shop
  getShopItems: () => request('GET', '/api/shop'),
  createShopItem: (body) => request('POST', '/api/shop', body),
  updateShopItem: (id, body) => request('PUT', `/api/shop/${id}`, body),
  deleteShopItem: (id) => request('DELETE', `/api/shop/${id}`),
  buyShopItem: (id) => request('POST', `/api/shop/${id}/buy`),

  // Wallet
  getWallet: (kidId) => request('GET', `/api/wallet/${kidId}`),
  getAllWallets: () => request('GET', '/api/wallet'),

  // Users & kids management
  getKids:           ()                    => request('GET',  '/api/users/kids'),
  addKid:            (body)               => request('POST', '/api/kids', body),
  updateKidPassword: (kidId, pwd)         => request('PUT',  `/api/kids/${kidId}/password`, { password: pwd }),
  awardBonus:        (kidId, points, reason) => request('POST', `/api/kids/${kidId}/bonus`, { points, reason }),
  adjustWallet:      (kidId, amount, reason) => request('POST', `/api/kids/${kidId}/wallet/adjust`, { amount, reason }),

  // Account
  changeOwnPassword: (password) => request('PUT', '/api/auth/password', { password }),

  // Messaging
  getContacts:  ()                       => request('GET',  '/api/messages/contacts'),
  getMessages:  (contactId)              => request('GET',  `/api/messages/${contactId}`),
  sendMessage:  (receiverId, content, quoteContent) => request('POST', '/api/messages', { receiver_id: receiverId, content, quote_content: quoteContent || null }),
  markRead:     (contactId)              => request('PUT',  `/api/messages/${contactId}/read`),

  // Support tickets
  submitContact: (body) => request('POST', '/api/contact', body),

  // Co-parent management
  getCoParent:            ()           => request('GET',    '/api/family/co-parent'),
  addCoParent:            (body)       => request('POST',   '/api/family/co-parent', body),
  updateCoParentPassword: (pwd)        => request('PUT',    '/api/family/co-parent/password', { password: pwd }),
  removeCoParent:         ()           => request('DELETE', '/api/family/co-parent'),

  // Recurring chore templates
  createRecurring: (body) => request('POST',   '/api/recurring', body),
  getRecurring:    ()     => request('GET',    '/api/recurring'),
  deleteRecurring: (id)   => request('DELETE', `/api/recurring/${id}`),

  // Admin
  adminFamilies:           ()              => request('GET', '/api/admin/families'),
  adminFamilyChores:       (familyId)      => request('GET', `/api/admin/family/${familyId}/chores`),
  adminFamilyTransactions: (familyId)      => request('GET', `/api/admin/family/${familyId}/transactions`),
  adminUpdateUser:         (userId, body)  => request('PUT', `/api/admin/user/${userId}`, body),
  adminUpdateChore:        (choreId, body) => request('PUT', `/api/admin/chore/${choreId}`, body),
}
