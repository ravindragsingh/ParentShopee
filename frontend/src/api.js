const BASE_URL = 'http://localhost:3001'

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
  const options = {
    method,
    headers: authHeaders()
  }
  if (body !== undefined) {
    options.body = JSON.stringify(body)
  }
  const res = await fetch(`${BASE_URL}${path}`, options)
  const data = await res.json()
  if (!data.success) {
    throw new Error(data.error || 'Request failed')
  }
  return data.data
}

export const api = {
  // Auth
  login: (username, password) =>
    request('POST', '/api/auth/login', { username, password }),
  register: (body) =>
    request('POST', '/api/auth/register', body),

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
  getKids:           ()           => request('GET',  '/api/users/kids'),
  addKid:            (body)       => request('POST', '/api/kids', body),
  updateKidPassword: (kidId, pwd) => request('PUT',  `/api/kids/${kidId}/password`, { password: pwd }),

  // Co-parent management
  getCoParent:            ()           => request('GET',    '/api/family/co-parent'),
  addCoParent:            (body)       => request('POST',   '/api/family/co-parent', body),
  updateCoParentPassword: (pwd)        => request('PUT',    '/api/family/co-parent/password', { password: pwd }),
  removeCoParent:         ()           => request('DELETE', '/api/family/co-parent'),
}
