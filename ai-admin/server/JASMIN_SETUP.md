# Jasmin Wrapper Setup for Admin Backend

## Overview
Ye simple setup hai jo Jasmin operations ko handle karta hai backend mein.

## Files Created

1. **jasmin_manager.py** - Main Python script jo Jasmin jCli ke saath communicate karta hai
2. **utils/jasminWrapper.js** - Node.js wrapper jo Python script ko call karta hai
3. **customerController.js** - Updated to use wrapper functions

## How It Works

```
Node.js Controller
      ↓
jasminWrapper.js (calls Python script)
      ↓
jasmin_manager.py (connects to Jasmin jCli)
      ↓
Jasmin Server
```

## Installation

1. Install Python dependencies:
```bash
pip3 install pexpect
```

2. Make sure Jasmin is running on localhost:8990

3. Test the Python script:
```bash
cd /home/ankush/sms-final/ai-admin/server
python3 jasmin_manager.py create_group test_group
```

## Usage in Controller

### Before (using axios):
```javascript
const groupPayload = new URLSearchParams({ gid: groupname });
await axios.post(`${JASMIN_BASE_URL}/api/groups/`, groupPayload, {
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
});
```

### After (using wrapper):
```javascript
const { createGroup } = require('../utils/jasminWrapper');
await createGroup(groupname);
```

## Available Functions

- `createGroup(groupId)` - Create a new group
- `createUser(uid, gid, username, password)` - Create a new user
- `deleteUser(uid)` - Delete a user
- `deleteGroup(gid)` - Delete a group

## Customer Creation Flow

1. Create customer in MongoDB
2. Python script creates group in Jasmin: `{username}grp` (NO underscore!)
3. Wait 1 second (in Python)
4. Python script creates user in Jasmin: `{username}usr` (NO underscore!)
5. Save CustomerUser record

**Note**: Jasmin jCli doesn't allow underscores in group/user names, so we use `grp` and `usr` suffixes instead of `_group` and `_user`.

## Customer Deletion Flow

1. Delete user from Jasmin: `{username}usr`
2. Delete group from Jasmin: `{username}grp`
3. Delete customer from MongoDB
4. Delete CustomerUser record

## Configuration

Edit `jasmin_manager.py` to change Jasmin connection settings:
```python
TELNET_HOST = 'localhost'
TELNET_PORT = 8990
TELNET_USERNAME = 'jcliadmin'
TELNET_PASSWORD = 'jclipwd'
```

## Troubleshooting

1. **Connection errors**: Make sure Jasmin is running
2. **Timeout errors**: Increase TELNET_TIMEOUT in jasmin_manager.py
3. **Command failures**: Check Jasmin logs

## Notes

- Python script connects to Jasmin jCli directly (no HTTP layer needed)
- Each command creates a new connection (simple and reliable)
- Errors are handled gracefully with try-catch blocks
- Same logic as jasmin-web-panel/jasmin_manager.py

