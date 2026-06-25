'use strict';

const { spawn } = require('child_process');
const path = require('path');

module.exports = async () => {
  const serverPath = path.join(__dirname, '../backend/server.js');

  const server = spawn('node', [serverPath], {
    detached: false,
    stdio: 'pipe',
    env: { ...process.env },
  });

  global.__SERVER__ = server;
  process.env.SERVER_PID = String(server.pid);

  server.stderr.on('data', (data) => {
    process.stderr.write('Server stderr: ' + data.toString());
  });

  await new Promise((resolve) => {
    server.stdout.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('3001') || msg.includes('running')) {
        resolve();
      }
    });
    // Fallback: give server 3 seconds to start regardless
    setTimeout(resolve, 3000);
  });

  // Small extra buffer to ensure port is truly open
  await new Promise((r) => setTimeout(r, 500));
};
