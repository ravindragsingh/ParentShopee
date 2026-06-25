'use strict';

const fetch = require('node-fetch');

const BASE = 'http://localhost:3001/api';

/**
 * Log in with the given credentials; returns { token, user }.
 */
async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(`Login failed for ${username}: ${json.error}`);
  return { token: json.data.token, user: json.data.user };
}

/**
 * Make an authenticated API request.
 * @param {string} path  - e.g. '/chores'
 * @param {string} method - GET | POST | PUT | DELETE
 * @param {object|null} body
 * @param {string|null} token
 * @returns {{ status: number, body: object }}
 */
async function api(path, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body !== null) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json();
  return { status: res.status, body: json };
}

module.exports = { BASE, login, api };
