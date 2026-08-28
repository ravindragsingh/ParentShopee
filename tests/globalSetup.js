'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

const BACKEND_DIR = path.join(__dirname, '../backend');
const TEST_DB = path.join(BACKEND_DIR, 'test_ci.db');
const PORT = 4055;

// The real backend is Python/FastAPI (backend/main.py via uvicorn), not the
// legacy backend/server.js prototype these tests used to spawn -- that file
// predates the FastAPI rewrite and isn't what's actually deployed (see
// backend/render.yaml: startCommand runs uvicorn, never server.js).
function waitForPort(port, timeoutMs) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function attempt() {
      const socket = net.createConnection(port, '127.0.0.1');
      socket.once('connect', () => { socket.end(); resolve(); });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) reject(new Error(`Backend did not start within ${timeoutMs}ms`));
        else setTimeout(attempt, 300);
      });
    })();
  });
}

module.exports = async () => {
  // Fresh database every run so tests never depend on leftover state from a
  // previous run (seed_db() re-populates parent1/kid1/kid2 on a fresh DB).
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);

  const pythonCmd = process.env.PYTHON_BIN || 'python';
  const server = spawn(
    pythonCmd,
    ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', String(PORT)],
    {
      cwd: BACKEND_DIR,
      env: { ...process.env, DATABASE_URL: `sqlite:///${TEST_DB}` },
      stdio: 'pipe',
    }
  );

  global.__SERVER__ = server;
  process.env.SERVER_PID = String(server.pid);

  server.stderr.on('data', (data) => {
    process.stderr.write('[backend] ' + data.toString());
  });

  await waitForPort(PORT, 30000);
  // uvicorn accepting connections doesn't guarantee the app has finished its
  // startup event (table creation, seeding) -- give it a moment.
  await new Promise((r) => setTimeout(r, 1000));
};
