'use strict';

const fs = require('fs');
const path = require('path');

module.exports = async () => {
  const pid = parseInt(process.env.SERVER_PID, 10);
  if (pid) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch (e) {
      // Process may have already exited; ignore
    }
  }
  if (global.__SERVER__) {
    try {
      global.__SERVER__.kill('SIGTERM');
    } catch (e) {
      // ignore
    }
  }
  // Short pause to let the port release
  await new Promise((r) => setTimeout(r, 300));

  const testDb = path.join(__dirname, '../backend/test_ci.db');
  try {
    if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
  } catch (e) {
    // Windows can hold a brief file lock right after the process exits; not
    // worth failing the test run over a leftover throwaway DB file.
  }
};
