#!/usr/bin/env python3
"""
Simple Jasmin Manager for Admin Backend
----------------------------------------
Global connection maintain karta hai aur simple functions provide karta hai
"""

import pexpect
import time
import sys
import json

# jCli Configuration
TELNET_HOST = 'localhost'
TELNET_PORT = 8990
TELNET_USERNAME = 'jcliadmin'
TELNET_PASSWORD = 'jclipwd'
TELNET_TIMEOUT = 10

STANDARD_PROMPT = 'jcli : '
INTERACTIVE_PROMPT = '> '

class JasminManager:
    def __init__(self):
        self.telnet = None
        self.connected = False
        
    def connect(self):
        """Connect to Jasmin jCli"""
        try:
            self.telnet = pexpect.spawn(
                f"telnet {TELNET_HOST} {TELNET_PORT}", 
                timeout=TELNET_TIMEOUT
            )
            
            self.telnet.expect_exact('Username: ')
            self.telnet.sendline(TELNET_USERNAME)
            self.telnet.expect_exact('Password: ')
            self.telnet.sendline(TELNET_PASSWORD)
            self.telnet.expect_exact(STANDARD_PROMPT)
            
            self.connected = True
            return True
            
        except Exception as e:
            self.connected = False
            return False
    
    def _send_interactive_command(self, command, interactive_data):
        """Send interactive command"""
        try:
            if not self.connected:
                self.connect()
            
            self.telnet.sendline(command)
            self.telnet.expect(INTERACTIVE_PROMPT, timeout=TELNET_TIMEOUT)
            
            # Send all interactive data except the last 'ok'
            for i, data in enumerate(interactive_data[:-1]):
                self.telnet.sendline(data)
                self.telnet.expect(INTERACTIVE_PROMPT, timeout=TELNET_TIMEOUT)
            
            # Send 'ok' and wait for completion
            self.telnet.sendline(interactive_data[-1])  # This should be 'ok'
            time.sleep(0.5)  # Brief pause for command to execute
            
            # Now read everything until we get back to standard prompt
            self.telnet.expect(STANDARD_PROMPT, timeout=TELNET_TIMEOUT)
            
            # Get the full response
            response = self.telnet.before.decode() if isinstance(self.telnet.before, bytes) else self.telnet.before
            
            if 'Successfully' in response:
                # Extract the result (group/user name) from response
                import re
                match = re.search(r'\[(.+?)\]', response)
                if match:
                    result = match.group(1).strip()
                    return {'success': True, 'result': result}
                return {'success': True, 'result': 'Created'}
            elif 'Error' in response or 'Unknown' in response:
                return {'success': False, 'error': response.strip()}
            else:
                return {'success': True, 'result': 'Done'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _execute_command(self, command):
        """Execute simple command"""
        try:
            if not self.connected:
                self.connect()
            
            self.telnet.sendline(command)
            self.telnet.expect([STANDARD_PROMPT, INTERACTIVE_PROMPT], timeout=TELNET_TIMEOUT)
            response = self.telnet.before.decode().strip() if isinstance(self.telnet.before, bytes) else self.telnet.before.strip()
            
            return {'success': True, 'response': response}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def create_group(self, group_id):
        """Create a group"""
        interactive_data = [f'gid {group_id}', 'ok']
        result = self._send_interactive_command('group -a', interactive_data)
        
        if result['success']:
            persist_result = self._execute_command('persist')
            if persist_result['success']:
                return {'success': True, 'group_id': group_id}
        
        return result
    
    def create_user(self, uid, gid, username, password):
        """Create a user"""
        interactive_data = [
            f'uid {uid}',
            f'gid {gid}',
            f'username {username}',
            f'password {password}',
            'ok'
        ]
        result = self._send_interactive_command('user -a', interactive_data)
        
        if result['success']:
            persist_result = self._execute_command('persist')
            if persist_result['success']:
                return {'success': True, 'username': username}
        
        return result
    
    def delete_user(self, uid):
        """Delete a user"""
        result = self._execute_command(f'user -r {uid}')
        if result['success']:
            self._execute_command('persist')
        return result
    
    def delete_group(self, gid):
        """Delete a group"""
        result = self._execute_command(f'group -r {gid}')
        if result['success']:
            self._execute_command('persist')
        return result
    
    def create_customer(self, username, password, wait_time=1):
        """Create complete customer: group + user with delay"""
        group_id = f"{username}_group"
        uid = f"{username}_user"
        
        # Step 1: Create group
        group_result = self.create_group(group_id)
        if not group_result['success']:
            return group_result
        
        # Step 2: Wait for group to be ready
        time.sleep(wait_time)
        
        # Step 3: Create user
        user_result = self.create_user(uid, group_id, username, password)
        if not user_result['success']:
            return {'success': False, 'error': f"Group created but user failed: {user_result.get('error')}"}
        
        return {'success': True, 'group_id': group_id, 'user_id': uid, 'username': username}
    
    def delete_customer(self, username):
        """Delete complete customer: user + group"""
        uid = f"{username}_user"
        group_id = f"{username}_group"
        
        # Delete user first, then group
        self.delete_user(uid)
        self.delete_group(group_id)
        
        return {'success': True, 'message': 'Customer deleted'}
    
    def list_users(self):
        """List all users"""
        result = self._execute_command('user -l')
        if result['success']:
            response = result['response']
            lines = response.split('\n')
            users = []
            for line in lines:
                line = line.strip()
                if line and not line.startswith('#') and 'Total' not in line:
                    user_id = line.lstrip('!#')
                    if user_id:
                        users.append(user_id)
            return {'success': True, 'users': users, 'count': len(users)}
        return result
    
    def list_groups(self):
        """List all groups"""
        result = self._execute_command('group -l')
        if result['success']:
            response = result['response']
            lines = response.split('\n')
            groups = []
            for line in lines:
                line = line.strip()
                if line and not line.startswith('#') and 'Total' not in line:
                    group_id = line.lstrip('!#')
                    if group_id:
                        groups.append(group_id)
            return {'success': True, 'groups': groups, 'count': len(groups)}
        return result
    
    def disconnect(self):
        """Disconnect"""
        if self.telnet:
            try:
                self.telnet.sendline('quit')
                self.telnet.close()
            except:
                pass
            self.connected = False

# Global instance
_manager = None

def get_manager():
    global _manager
    if _manager is None:
        _manager = JasminManager()
        _manager.connect()
    return _manager

# CLI interface for Node.js to call
if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No command provided'}))
        sys.exit(1)
    
    command = sys.argv[1]
    manager = get_manager()
    result = None
    
    try:
        if command == 'create_group':
            group_id = sys.argv[2]
            result = manager.create_group(group_id)
            
        elif command == 'create_user':
            uid = sys.argv[2]
            gid = sys.argv[3]
            username = sys.argv[4]
            password = sys.argv[5]
            result = manager.create_user(uid, gid, username, password)
            
        elif command == 'create_customer':
            username = sys.argv[2]
            password = sys.argv[3]
            result = manager.create_customer(username, password, wait_time=1)
            
        elif command == 'delete_user':
            uid = sys.argv[2]
            result = manager.delete_user(uid)
            
        elif command == 'delete_group':
            gid = sys.argv[2]
            result = manager.delete_group(gid)
            
        elif command == 'delete_customer':
            username = sys.argv[2]
            result = manager.delete_customer(username)
            
        elif command == 'list_users':
            result = manager.list_users()
            
        elif command == 'list_groups':
            result = manager.list_groups()
            
        else:
            result = {'success': False, 'error': 'Unknown command'}
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
    finally:
        manager.disconnect()

