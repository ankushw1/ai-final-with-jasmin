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
        """List all users with details"""
        result = self._execute_command('user -l')
        if result['success']:
            response = result['response']
            lines = response.split('\n')
            users = []
            for line in lines:
                line = line.strip()
                # Skip headers, empty lines, and totals
                if (line and 
                    'Total' not in line and
                    'User id' not in line and
                    'Group id' not in line and
                    'Username' not in line and
                    'Balance' not in line and
                    'MT SMS' not in line and
                    'Throughput' not in line and
                    '---' not in line):
                    
                    # Parse user details from the line
                    parts = line.split()
                    if parts and len(parts) >= 3:
                        user_id = parts[0].lstrip('!#')
                        group_id = parts[1] if len(parts) > 1 else 'unknown'
                        username = parts[2] if len(parts) > 2 else user_id
                        
                        if user_id and user_id != 'user' and user_id != '-l':
                            # Determine status based on prefix
                            # #! = disabled, # = enabled
                            if line.startswith('#!'):
                                status = 'disabled'
                            elif line.startswith('#'):
                                status = 'enabled'
                            else:
                                status = 'disabled'  # Default for no prefix
                            
                            # Get detailed info using user -s command
                            user_detail = self._execute_command(f'user -s {user_id}')
                            balance = 'ND'
                            sms_count = 'ND'
                            early_percent = 'ND'
                            http_throughput = 'ND'
                            smpps_throughput = 'ND'
                            
                            # Initialize permissions
                            permissions = {
                                'http_send': '0',
                                'dlr_method': '0',
                                'http_balance': '0',
                                'smpps_send': '0',
                                'priority': '0',
                                'http_long_content': '0',
                                'src_addr': '0',
                                'dlr_level': '0',
                                'http_rate': '0',
                                'validity_period': '0',
                                'http_bulk': '0',
                                'hex_content': '0'
                            }
                            
                            if user_detail['success']:
                                detail_response = user_detail['response']
                                # Parse balance, throughput, and permissions from user -s output
                                for detail_line in detail_response.split('\n'):
                                    if 'mt_messaging_cred quota balance' in detail_line:
                                        balance = detail_line.split()[-1]
                                    elif 'mt_messaging_cred quota sms_count' in detail_line:
                                        sms_count = detail_line.split()[-1]
                                    elif 'mt_messaging_cred quota early_percent' in detail_line:
                                        early_percent = detail_line.split()[-1]
                                    elif 'mt_messaging_cred quota http_throughput' in detail_line:
                                        http_throughput = detail_line.split()[-1]
                                    elif 'mt_messaging_cred quota smpps_throughput' in detail_line:
                                        smpps_throughput = detail_line.split()[-1]
                                    # Parse permissions
                                    elif 'mt_messaging_cred authorization http_send' in detail_line:
                                        permissions['http_send'] = '1' if 'True' in detail_line else '0'
                                    elif 'mt_messaging_cred authorization http_dlr_method' in detail_line:
                                        permissions['dlr_method'] = '1' if 'True' in detail_line else '0'
                                    elif 'mt_messaging_cred authorization http_balance' in detail_line:
                                        permissions['http_balance'] = '1' if 'True' in detail_line else '0'
                                    elif 'mt_messaging_cred authorization smpps_send' in detail_line:
                                        permissions['smpps_send'] = '1' if 'True' in detail_line else '0'
                                    elif 'mt_messaging_cred authorization priority' in detail_line:
                                        permissions['priority'] = '1' if 'True' in detail_line else '0'
                                    elif 'mt_messaging_cred authorization http_long_content' in detail_line:
                                        permissions['http_long_content'] = '1' if 'True' in detail_line else '0'
                                    elif 'mt_messaging_cred authorization src_addr' in detail_line:
                                        permissions['src_addr'] = '1' if 'True' in detail_line else '0'
                                    elif 'mt_messaging_cred authorization dlr_level' in detail_line:
                                        permissions['dlr_level'] = '1' if 'True' in detail_line else '0'
                                    elif 'mt_messaging_cred authorization http_rate' in detail_line:
                                        permissions['http_rate'] = '1' if 'True' in detail_line else '0'
                                    elif 'mt_messaging_cred authorization validity_period' in detail_line:
                                        permissions['validity_period'] = '1' if 'True' in detail_line else '0'
                                    elif 'mt_messaging_cred authorization http_bulk' in detail_line:
                                        permissions['http_bulk'] = '1' if 'True' in detail_line else '0'
                                    elif 'mt_messaging_cred authorization hex_content' in detail_line:
                                        permissions['hex_content'] = '1' if 'True' in detail_line else '0'
                            
                            users.append({
                                'uid': user_id,
                                'gid': group_id,
                                'username': username,
                                'status': status,
                                'mt_messaging_cred': {
                                    'quota': {
                                        'balance': balance,
                                        'sms_count': sms_count,
                                        'early_percent': early_percent,
                                        'http_throughput': http_throughput,
                                        'smpps_throughput': smpps_throughput
                                    },
                                    'authorization': permissions
                                }
                            })
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
                # Skip headers, empty lines, and totals
                if (line and 
                    'Total' not in line and
                    'Group id' not in line and
                    '---' not in line):
                    
                    # Extract group ID from the first column (remove # prefix)
                    parts = line.split()
                    if parts:
                        group_id = parts[0].lstrip('!#')
                        if group_id and group_id != 'group' and group_id != '-l':
                            groups.append(group_id)
            return {'success': True, 'groups': groups, 'count': len(groups)}
        return result
    
    def enable_user(self, uid):
        """Enable a user"""
        result = self._execute_command(f'user -e {uid}')
        if result['success']:
            self._execute_command('persist')
        return result
    
    def disable_user(self, uid):
        """Disable a user"""
        result = self._execute_command(f'user -d {uid}')
        if result['success']:
            self._execute_command('persist')
        return result
    
    def update_user_permissions(self, uid, permissions):
        """Update user permissions using interactive mode"""
        # permissions is a dict with permission names and values (0/1)
        updates = []
        for perm_name, value in permissions.items():
            if value in [0, 1, "0", "1"]:
                updates.append(f'mt_messaging_cred authorization {perm_name} {value}')
        
        if not updates:
            return {'success': False, 'error': 'No valid permissions to update'}
        
        # Add 'ok' at the end of interactive data
        updates.append('ok')
        
        # Use interactive mode to update user
        result = self._send_interactive_command(f'user -u {uid}', updates)
        
        if result['success']:
            # Persist changes
            persist_result = self._execute_command('persist')
            if persist_result['success']:
                return {'success': True, 'message': 'Permissions updated successfully', 'permissions': permissions}
            else:
                return persist_result
        else:
            return result
    
    def update_user_balance(self, uid, balance_data):
        """Update user balance and throughput settings using interactive mode"""
        # balance_data is a dict with balance settings
        updates = []
        for key, value in balance_data.items():
            if value is not None and value != 'ND':
                if key == 'balance_amt':
                    updates.append(f'mt_messaging_cred quota balance {value}')
                elif key == 'balance_sms':
                    updates.append(f'mt_messaging_cred quota sms_count {value}')
                elif key == 'balance_percent':
                    updates.append(f'mt_messaging_cred quota early_percent {value}')
                elif key == 'http_tput':
                    updates.append(f'mt_messaging_cred quota http_throughput {value}')
                elif key == 'smpp_tput':
                    updates.append(f'mt_messaging_cred quota smpps_throughput {value}')
        
        if not updates:
            return {'success': False, 'error': 'No valid balance settings to update'}
        
        # Add 'ok' at the end of interactive data
        updates.append('ok')
        
        # Use interactive mode to update user
        result = self._send_interactive_command(f'user -u {uid}', updates)
        
        if result['success']:
            # Persist changes
            persist_result = self._execute_command('persist')
            if persist_result['success']:
                return {'success': True, 'message': 'Balance updated successfully', 'balance_data': balance_data}
            else:
                return persist_result
        else:
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
            
        elif command == 'enable_user':
            uid = sys.argv[2]
            result = manager.enable_user(uid)
            
        elif command == 'disable_user':
            uid = sys.argv[2]
            result = manager.disable_user(uid)
            
        elif command == 'update_permissions':
            uid = sys.argv[2]
            # Parse permissions from remaining args (format: perm1=value1 perm2=value2)
            permissions = {}
            for arg in sys.argv[3:]:
                if '=' in arg:
                    key, value = arg.split('=', 1)
                    permissions[key] = value
            result = manager.update_user_permissions(uid, permissions)
            
        elif command == 'update_balance':
            uid = sys.argv[2]
            # Parse balance data from remaining args (format: key=value)
            balance_data = {}
            for arg in sys.argv[3:]:
                if '=' in arg:
                    key, value = arg.split('=', 1)
                    balance_data[key] = value
            result = manager.update_user_balance(uid, balance_data)
            
        elif command == 'show_user':
            uid = sys.argv[2]
            result = manager._execute_command(f'user -s {uid}')
            
        else:
            result = {'success': False, 'error': 'Unknown command'}
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
    finally:
        manager.disconnect()

