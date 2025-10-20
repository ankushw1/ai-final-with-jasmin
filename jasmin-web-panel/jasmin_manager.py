#!/usr/bin/env python3
"""
Jasmin Management Script with Persistent Connection
-------------------------------------------------
Ye script ek persistent connection maintain karta hai Jasmin jCli ke saath
so that har baar login na karna pade.
"""

import pexpect
import time
import sys
import threading
import queue

# jCli Configuration
TELNET_HOST = 'localhost'
TELNET_PORT = 8990
TELNET_USERNAME = 'jcliadmin'
TELNET_PASSWORD = 'jclipwd'
TELNET_TIMEOUT = 5  # 5 seconds timeout

STANDARD_PROMPT = 'jcli : '
INTERACTIVE_PROMPT = '> '

class JasminManager:
    def __init__(self):
        self.telnet = None
        self.connected = False
        self.command_queue = queue.Queue()
        self.response_queue = queue.Queue()
        self.worker_thread = None
        
    def connect(self):
        """Connect to Jasmin jCli with persistent connection"""
        try:
            print(f"Connecting to Jasmin jCli at {TELNET_HOST}:{TELNET_PORT}...")
            self.telnet = pexpect.spawn(
                f"telnet {TELNET_HOST} {TELNET_PORT}", 
                timeout=TELNET_TIMEOUT
            )
            
            # Login
            self.telnet.expect_exact('Username: ')
            self.telnet.sendline(TELNET_USERNAME)
            self.telnet.expect_exact('Password: ')
            self.telnet.sendline(TELNET_PASSWORD)
            self.telnet.expect_exact(STANDARD_PROMPT)
            
            self.connected = True
            print("✓ Successfully connected to jCli")
            
            # Start worker thread for command processing
            self.worker_thread = threading.Thread(target=self._command_worker)
            self.worker_thread.daemon = True
            self.worker_thread.start()
            
            return True
            
        except Exception as e:
            print(f"✗ Connection failed: {str(e)}")
            self.connected = False
            return False
    
    def _command_worker(self):
        """Worker thread to process commands"""
        while self.connected:
            try:
                # Wait for command with timeout
                command_data = self.command_queue.get(timeout=1)
                if command_data is None:  # Shutdown signal
                    break
                    
                command, callback = command_data
                result = self._execute_command(command)
                
                if callback:
                    callback(result)
                    
                self.command_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                print(f"Worker thread error: {str(e)}")
    
    def _execute_command(self, command):
        """Execute a single command"""
        try:
            if not self.connected or not self.telnet:
                return {'success': False, 'error': 'Not connected'}
            
            # Send command
            self.telnet.sendline(command)
            
            # Wait for response
            self.telnet.expect([STANDARD_PROMPT, INTERACTIVE_PROMPT], timeout=TELNET_TIMEOUT)
            response = self.telnet.before.decode().strip()
            
            return {'success': True, 'response': response}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _send_interactive_command(self, command, interactive_data):
        """Send command with interactive responses"""
        try:
            if not self.connected or not self.telnet:
                return {'success': False, 'error': 'Not connected'}
            
            # Send main command
            self.telnet.sendline(command)
            self.telnet.expect(INTERACTIVE_PROMPT)
            
            # Send interactive data
            for data in interactive_data:
                self.telnet.sendline(data)
                self.telnet.expect(INTERACTIVE_PROMPT)
            
            # Wait for completion
            matched_index = self.telnet.expect([
                r'.+Successfully(.+)\[(.+)\][\n\r]+' + STANDARD_PROMPT,
                r'.+Error: (.+)[\n\r]+' + INTERACTIVE_PROMPT,
                r'.+(.*)(' + INTERACTIVE_PROMPT + '|' + STANDARD_PROMPT + ')',
            ], timeout=TELNET_TIMEOUT)
            
            if matched_index == 0:
                # Success
                result = self.telnet.match.group(2).decode().strip()
                return {'success': True, 'result': result}
            else:
                # Error
                error = self.telnet.match.group(1).decode().strip()
                return {'success': False, 'error': error}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def create_group(self, group_id):
        """Create a group"""
        print(f"Creating group: {group_id}")
        
        interactive_data = ['gid ' + group_id, 'ok']
        result = self._send_interactive_command('group -a', interactive_data)
        
        if result['success']:
            # Persist configuration
            persist_result = self._execute_command('persist')
            if persist_result['success']:
                print(f"✓ Group successfully created: [{result['result']}]")
                return {
                    'success': True,
                    'group_id': result['result'],
                    'message': f'Group {result["result"]} successfully created'
                }
            else:
                print(f"✗ Group created but failed to persist: {persist_result['error']}")
                return {'success': False, 'error': 'Failed to persist configuration'}
        else:
            print(f"✗ Error creating group: {result['error']}")
            return result
    
    def create_customer(self, uid, gid, username, password):
        """Create a customer/user"""
        print(f"Creating customer: {username} (UID: {uid}, GID: {gid})")
        
        interactive_data = [
            f'uid {uid}',
            f'gid {gid}',
            f'username {username}',
            f'password {password}',
            'ok'
        ]
        result = self._send_interactive_command('user -a', interactive_data)
        
        if result['success']:
            # Persist configuration
            persist_result = self._execute_command('persist')
            if persist_result['success']:
                print(f"✓ Customer successfully created: [{username}]")
                return {
                    'success': True,
                    'username': username,
                    'uid': uid,
                    'gid': gid,
                    'message': f'Customer {username} successfully created'
                }
            else:
                print(f"✗ Customer created but failed to persist: {persist_result['error']}")
                return {'success': False, 'error': 'Failed to persist configuration'}
        else:
            print(f"✗ Error creating customer: {result['error']}")
            return result
    
    def list_groups(self):
        """List all groups"""
        print("Listing groups...")
        result = self._execute_command('group -l')
        
        if result['success']:
            response = result['response']
            lines = response.split('\n')
            
            groups = []
            for line in lines:
                line = line.strip()
                if line and not line.startswith('#') and not line.startswith('Total'):
                    group_name = line.lstrip('!#')
                    if group_name:
                        groups.append(group_name)
            
            print(f"✓ Found {len(groups)} groups")
            for group in groups:
                print(f"  - {group}")
            
            return groups
        else:
            print(f"✗ Error listing groups: {result['error']}")
            return []
    
    def list_users(self):
        """List all users"""
        print("Listing users...")
        result = self._execute_command('user -l')
        
        if result['success']:
            response = result['response']
            lines = response.split('\n')
            
            users = []
            for line in lines:
                line = line.strip()
                if line and not line.startswith('#') and not line.startswith('Total'):
                    user_name = line.lstrip('!#')
                    if user_name:
                        users.append(user_name)
            
            print(f"✓ Found {len(users)} users")
            for user in users:
                print(f"  - {user}")
            
            return users
        else:
            print(f"✗ Error listing users: {result['error']}")
            return []
    
    def disconnect(self):
        """Disconnect from jCli"""
        if self.connected and self.telnet:
            try:
                self.telnet.sendline('quit')
                self.telnet.close()
                self.connected = False
                print("✓ Disconnected from jCli")
            except:
                pass
        
        # Stop worker thread
        if self.worker_thread:
            self.command_queue.put(None)  # Shutdown signal
            self.worker_thread.join(timeout=1)
    
    def __del__(self):
        """Cleanup on object destruction"""
        self.disconnect()

# Global manager instance
jasmin_manager = None

def get_manager():
    """Get or create global manager instance"""
    global jasmin_manager
    if jasmin_manager is None:
        jasmin_manager = JasminManager()
        jasmin_manager.connect()
    return jasmin_manager

def create_group(group_id):
    """Create a group using global manager"""
    manager = get_manager()
    return manager.create_group(group_id)

def create_customer(uid, gid, username, password):
    """Create a customer using global manager"""
    manager = get_manager()
    return manager.create_customer(uid, gid, username, password)

def list_groups():
    """List groups using global manager"""
    manager = get_manager()
    return manager.list_groups()

def list_users():
    """List users using global manager"""
    manager = get_manager()
    return manager.list_users()

def disconnect():
    """Disconnect global manager"""
    global jasmin_manager
    if jasmin_manager:
        jasmin_manager.disconnect()
        jasmin_manager = None

if __name__ == '__main__':
    print("=" * 60)
    print("Jasmin Management Script with Persistent Connection")
    print("=" * 60)
    print()
    
    try:
        # Test the manager
        manager = get_manager()
        
        if manager.connected:
            print("Testing group creation...")
            result = create_group('testgroup001')
            print(f"Result: {result}")
            
            print("\nTesting customer creation...")
            result = create_customer('user001', 'testgroup001', 'testuser', 'testpass')
            print(f"Result: {result}")
            
            print("\nListing groups...")
            groups = list_groups()
            
            print("\nListing users...")
            users = list_users()
            
        else:
            print("✗ Failed to connect to Jasmin")
            
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
    finally:
        disconnect()
        print("\n" + "=" * 60)
        print("Session ended")
        print("=" * 60)
