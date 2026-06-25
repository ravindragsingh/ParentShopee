'use strict';

module.exports = async () => {
  const pid = parseInt(process.env.SERVER_PID, 10);
  if (pid) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch (e) {
      // Process may have already exited; ignore
    }
  }
  // Also try via global reference if available
  if (global.__SERVER__) {
    try {
      global.__SERVER__.kill('SIGTERM');
    } catch (e) {
      // ignore
    }
  }
  // Short pause to let the port release
  await new Promise((r) => setTimeout(r, 300));
};
