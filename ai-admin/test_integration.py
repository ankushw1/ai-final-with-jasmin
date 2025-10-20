#!/usr/bin/env python3
"""
Simple test for Jasmin integration
Same as working group creation script
"""

import pexpect
import sys

# jCli Configuration
TELNET_HOST = 'localhost'
TELNET_PORT = 8990
TELNET_USERNAME = 'jcliadmin'
TELNET_PASSWORD = 'jclipwd'
TELNET_TIMEOUT = 5

STANDARD_PROMPT = 'jcli : '
INTERACTIVE_PROMPT = '> '

def create_group(group_id):
    """Create a group - same as working script"""
    try:
        print(f"Creating group: {group_id}")
        telnet = pexpect.spawn(
            f"telnet {TELNET_HOST} {TELNET_PORT}", 
            timeout=TELNET_TIMEOUT
        )
        
        # Login
        telnet.expect_exact('Username: ')
        telnet.sendline(TELNET_USERNAME)
        telnet.expect_exact('Password: ')
        telnet.sendline(TELNET_PASSWORD)
        telnet.expect_exact(STANDARD_PROMPT)
        print("✓ Connected to jCli")
        
        # Create group
        telnet.sendline('group -a')
        telnet.expect(r'Adding a new Group(.+)\n' + INTERACTIVE_PROMPT)
        telnet.sendline(f'gid {group_id}')
        telnet.expect(INTERACTIVE_PROMPT)
        telnet.sendline('ok')
        
        # Check result
        matched_index = telnet.expect([
            r'.+Successfully added(.+)\[(.+)\][\n\r]+' + STANDARD_PROMPT,
            r'.+Error: (.+)[\n\r]+' + INTERACTIVE_PROMPT,
            r'.+(.*)(' + INTERACTIVE_PROMPT + '|' + STANDARD_PROMPT + ')',
        ])
        
        if matched_index == 0:
            created_gid = telnet.match.group(2).decode().strip()
            print(f"✓ Group successfully created: [{created_gid}]")
            
            # Persist
            telnet.sendline('persist')
            telnet.expect(STANDARD_PROMPT)
            print("✓ Configuration persisted")
            
            telnet.sendline('quit')
            telnet.close()
            
            return {'success': True, 'group_id': created_gid}
        else:
            error_msg = telnet.match.group(1).decode().strip()
            print(f"✗ Error creating group: {error_msg}")
            telnet.sendline('quit')
            telnet.close()
            
            return {'success': False, 'error': error_msg}
            
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return {'success': False, 'error': str(e)}

def create_user(uid, gid, username, password):
    """Create a user"""
    try:
        print(f"Creating user: {username} (UID: {uid}, GID: {gid})")
        telnet = pexpect.spawn(
            f"telnet {TELNET_HOST} {TELNET_PORT}", 
            timeout=TELNET_TIMEOUT
        )
        
        # Login
        telnet.expect_exact('Username: ')
        telnet.sendline(TELNET_USERNAME)
        telnet.expect_exact('Password: ')
        telnet.sendline(TELNET_PASSWORD)
        telnet.expect_exact(STANDARD_PROMPT)
        print("✓ Connected to jCli")
        
        # Create user
        telnet.sendline('user -a')
        telnet.expect(r'Adding a new User(.+)\n' + INTERACTIVE_PROMPT)
        
        telnet.sendline(f'uid {uid}')
        telnet.expect(INTERACTIVE_PROMPT)
        telnet.sendline(f'gid {gid}')
        telnet.expect(INTERACTIVE_PROMPT)
        telnet.sendline(f'username {username}')
        telnet.expect(INTERACTIVE_PROMPT)
        telnet.sendline(f'password {password}')
        telnet.expect(INTERACTIVE_PROMPT)
        telnet.sendline('ok')
        
        # Check result
        matched_index = telnet.expect([
            r'.+Successfully added(.+)\[(.+)\][\n\r]+' + STANDARD_PROMPT,
            r'.+Error: (.+)[\n\r]+' + INTERACTIVE_PROMPT,
            r'.+(.*)(' + INTERACTIVE_PROMPT + '|' + STANDARD_PROMPT + ')',
        ])
        
        if matched_index == 0:
            created_uid = telnet.match.group(2).decode().strip()
            print(f"✓ User successfully created: [{created_uid}]")
            
            # Persist
            telnet.sendline('persist')
            telnet.expect(STANDARD_PROMPT)
            print("✓ Configuration persisted")
            
            telnet.sendline('quit')
            telnet.close()
            
            return {'success': True, 'uid': created_uid}
        else:
            error_msg = telnet.match.group(1).decode().strip()
            print(f"✗ Error creating user: {error_msg}")
            telnet.sendline('quit')
            telnet.close()
            
            return {'success': False, 'error': error_msg}
            
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return {'success': False, 'error': str(e)}

if __name__ == '__main__':
    print("=" * 60)
    print("Testing Jasmin Integration - anksuh")
    print("=" * 60)
    print()
    
    try:
        # Create group
        print("1. Creating group: anksuhgroup")
        group_result = create_group('anksuhgroup')
        
        if group_result['success']:
            print(f"✅ Group created: {group_result['group_id']}")
            
            # Create user
            print("\n2. Creating user: anksuh")
            user_result = create_user('anksuhuser', 'anksuhgroup', 'anksuh', 'anksuh123')
            
            if user_result['success']:
                print(f"✅ User created: {user_result['uid']}")
            else:
                print(f"❌ User creation failed: {user_result['error']}")
        else:
            print(f"❌ Group creation failed: {group_result['error']}")
            
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
    
    print()
    print("=" * 60)
    print("Test completed!")
    print("=" * 60)
