# Jasmin Group Management Guide

## Overview
This guide explains how to manage groups in Jasmin SMS Gateway using both CLI and programmatic methods.

## Prerequisites
- Jasmin Docker containers running
- jCli access (port 8990)
- Python environment with pexpect library

## Default Credentials

### Jasmin jCli
```
Host: localhost
Port: 8990
Username: jcliadmin
Password: jclipwd
```

### Jasmin Web Panel
```
URL: http://localhost:8000/account/login/
Username: admin
Password: secret
```

## Manual Group Creation via jCli

### 1. Connect to jCli
```bash
telnet localhost 8990
```

### 2. Login
```
Username: jcliadmin
Password: jclipwd
```

### 3. Create Group
```
jcli : group -a
Adding a new Group: (ok: save, ko: exit)
> gid mygroup
> ok
Successfully added Group [mygroup]
jcli : persist
```

### 4. List Groups
```
jcli : group -l
```

### 5. Exit
```
jcli : quit
```

## Programmatic Group Creation

### Python Script Usage

#### Basic Usage
```bash
# Create a specific group
python3 create_group_example.py mygroup

# Demo mode (creates test group and lists all)
python3 create_group_example.py
```

#### Integration in Your Application
```python
from create_group_example import create_group, list_groups

# Create a group
result = create_group('customer001')
if result['success']:
    print(f"Group created: {result['group_id']}")
else:
    print(f"Error: {result['error']}")

# List all groups
groups = list_groups()
print(f"Total groups: {len(groups)}")
```

### Script Functions

#### `create_group(group_id)`
Creates a new group in Jasmin.

**Parameters:**
- `group_id` (str): Group identifier (no underscores allowed)

**Returns:**
```python
{
    'success': True/False,
    'group_id': 'created_group_name',
    'message': 'Success message'
}
```

#### `list_groups()`
Lists all groups in Jasmin.

**Returns:**
```python
['group1', 'group2', 'group3']
```

## Group Naming Rules

⚠️ **Important:** Jasmin group IDs have restrictions:
- No underscores (_) allowed
- Use alphanumeric characters only
- Keep names simple and descriptive

**Valid Examples:**
- `customer001`
- `testgroup`
- `group123`

**Invalid Examples:**
- `customer_group_001` ❌ (underscore)
- `my-group` ❌ (hyphen)
- `group@123` ❌ (special characters)

## Docker Setup

### Start Containers
```bash
cd /home/ankush/sms-final/jasmin-web-panel
docker compose up -d
```

### Check Status
```bash
docker compose ps
```

### View Logs
```bash
docker compose logs jasmin-web
docker compose logs jasmin
```

## Troubleshooting

### Groups Not Visible in Web Panel

1. **Check jCli Connection:**
   ```bash
   docker compose exec jasmin-web env | grep TELNET
   ```

2. **Verify Port Configuration:**
   - jCli runs on port 8990
   - Web panel should connect to `jasmin:8990`

3. **Restart Web Panel:**
   ```bash
   docker compose restart jasmin-web
   ```

### Connection Timeout Issues

1. **Increase Timeout:**
   ```yaml
   # In docker-compose.yml
   environment:
     TELNET_TIMEOUT: 30
   ```

2. **Check Network Connectivity:**
   ```bash
   docker compose exec jasmin-web telnet jasmin 8990
   ```

## Current Groups

As of testing, the following groups exist:
- `demo_group_001`
- `customer002`

## Integration with AI-Admin

For integration with your ai-admin system:

1. **Environment Variables:**
   ```python
   TELNET_HOST = 'jasmin'  # Docker container name
   TELNET_PORT = 8990
   TELNET_USERNAME = 'jcliadmin'
   TELNET_PASSWORD = 'jclipwd'
   ```

2. **Customer Creation Flow:**
   ```python
   def create_customer_with_group(customer_data):
       # Create customer group first
       group_result = create_group(f'customer{customer_data["id"]}')
       
       if group_result['success']:
           # Create customer with group
           customer_result = create_customer({
               'username': customer_data['username'],
               'password': customer_data['password'],
               'gid': group_result['group_id']
           })
           return customer_result
       else:
           return group_result
   ```

## Security Notes

- Change default passwords in production
- Use environment variables for credentials
- Implement proper error handling
- Consider rate limiting for group creation

## Files Created

- `create_group_example.py` - Main group management script
- `JASMIN_GROUP_MANAGEMENT.md` - This documentation

## Next Steps

1. Integrate group creation with customer management
2. Implement user creation with group assignment
3. Add group-based routing rules
4. Set up monitoring and logging

---

**Last Updated:** October 19, 2025
**Version:** 1.0
**Author:** Development Team
