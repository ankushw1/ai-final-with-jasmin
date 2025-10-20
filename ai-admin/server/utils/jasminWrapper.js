/**
 * Simple Jasmin Wrapper for Node.js
 * Calls Python jasmin_manager.py script
 */

const { exec } = require('child_process');
const path = require('path');

const PYTHON_SCRIPT = path.join(__dirname, '../jasmin_manager.py');

/**
 * Execute Python script with command
 */
function executePythonScript(command, args = []) {
  return new Promise((resolve) => {
    const allArgs = [command, ...args].map(arg => `"${arg}"`).join(' ');
    const cmd = `python3 ${PYTHON_SCRIPT} ${allArgs}`;
    
    exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('[Jasmin Wrapper] Error:', error.message);
        resolve({ success: false, error: error.message });
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        console.error('[Jasmin Wrapper] Parse error:', e.message);
        resolve({ success: false, error: 'Failed to parse response' });
      }
    });
  });
}

/**
 * Create a group in Jasmin
 */
async function createGroup(groupId) {
  return await executePythonScript('create_group', [groupId]);
}

/**
 * Create a user in Jasmin
 */
async function createUser(uid, gid, username, password) {
  return await executePythonScript('create_user', [uid, gid, username, password]);
}

/**
 * Delete a user from Jasmin
 */
async function deleteUser(uid) {
  return await executePythonScript('delete_user', [uid]);
}

/**
 * Delete a group from Jasmin
 */
async function deleteGroup(gid) {
  return await executePythonScript('delete_group', [gid]);
}

/**
 * List all users from Jasmin
 */
async function listUsers() {
  return await executePythonScript('list_users', []);
}

/**
 * Enable a user in Jasmin
 */
async function enableUser(uid) {
  return await executePythonScript('enable_user', [uid]);
}

/**
 * Disable a user in Jasmin
 */
async function disableUser(uid) {
  return await executePythonScript('disable_user', [uid]);
}

/**
 * Create complete customer (group + user with 1 sec delay in Python)
 * This handles everything in one call
 */
async function createCustomer(username, password) {
  return await executePythonScript('create_customer', [username, password]);
}

/**
 * Delete complete customer (user + group)
 * This handles everything in one call
 */
async function deleteCustomer(username) {
  return await executePythonScript('delete_customer', [username]);
}

/**
 * Update user permissions
 */
async function updateUserPermissions(uid, permissions) {
  // Convert permissions object to command line args
  const args = [];
  for (const [key, value] of Object.entries(permissions)) {
    args.push(`${key}=${value}`);
  }
  return await executePythonScript('update_permissions', [uid, ...args]);
}

/**
 * Update user balance
 */
async function updateUserBalance(uid, balanceData) {
  // Convert balance data object to command line args
  const args = [];
  for (const [key, value] of Object.entries(balanceData)) {
    args.push(`${key}=${value}`);
  }
  return await executePythonScript('update_balance', [uid, ...args]);
}

module.exports = {
  createGroup,
  createUser,
  deleteUser,
  deleteGroup,
  createCustomer,
  deleteCustomer,
  listUsers,
  enableUser,
  disableUser,
  updateUserPermissions,
  updateUserBalance
};

