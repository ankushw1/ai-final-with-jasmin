#!/usr/bin/env python3
"""
Jasmin Group Creation Script
-----------------------------
Ye script Jasmin jCli se connect karke group create karti hai.
"""

import pexpect
import sys

# jCli Configuration
TELNET_HOST = 'localhost'  # Docker container ke andar 'jasmin' hoga
TELNET_PORT = 8990
TELNET_USERNAME = 'jcliadmin'
TELNET_PASSWORD = 'jclipwd'
TELNET_TIMEOUT = 10

STANDARD_PROMPT = 'jcli : '
INTERACTIVE_PROMPT = '> '


def create_group(group_id):
    """
    Jasmin jCli se connect karke group create karta hai.
    
    Args:
        group_id (str): Group ka unique identifier (e.g., 'grp1', 'customer_group')
    
    Returns:
        dict: Success/failure status ke saath response
    """
    try:
        # Step 1: Telnet connection establish karo
        print(f"Connecting to Jasmin jCli at {TELNET_HOST}:{TELNET_PORT}...")
        telnet = pexpect.spawn(
            f"telnet {TELNET_HOST} {TELNET_PORT}", 
            timeout=TELNET_TIMEOUT
        )
        
        # Step 2: Username enter karo
        telnet.expect_exact('Username: ')
        telnet.sendline(TELNET_USERNAME)
        print(f"Username sent: {TELNET_USERNAME}")
        
        # Step 3: Password enter karo
        telnet.expect_exact('Password: ')
        telnet.sendline(TELNET_PASSWORD)
        print(f"Password sent")
        
        # Step 4: Standard prompt ka wait karo (successful login)
        telnet.expect_exact(STANDARD_PROMPT)
        print("✓ Successfully logged in to jCli")
        
        # Step 5: Group add command bhejo
        telnet.sendline('group -a')
        telnet.expect(r'Adding a new Group(.+)\n' + INTERACTIVE_PROMPT)
        print("✓ Entered group creation mode")
        
        # Step 6: Group ID set karo
        telnet.sendline(f'gid {group_id}')
        telnet.expect(INTERACTIVE_PROMPT)
        print(f"✓ Set group ID: {group_id}")
        
        # Step 7: 'ok' bhejke group create karo
        telnet.sendline('ok')
        
        # Step 8: Response check karo
        matched_index = telnet.expect([
            r'.+Successfully added(.+)\[(.+)\][\n\r]+' + STANDARD_PROMPT,
            r'.+Error: (.+)[\n\r]+' + INTERACTIVE_PROMPT,
            r'.+(.*)(' + INTERACTIVE_PROMPT + '|' + STANDARD_PROMPT + ')',
        ])
        
        if matched_index == 0:
            # Success!
            created_gid = telnet.match.group(2).decode().strip()
            print(f"✓ Group successfully created: [{created_gid}]")
            
            # Step 9: Configuration persist karo (disk pe save)
            telnet.sendline('persist')
            telnet.expect(STANDARD_PROMPT)
            print("✓ Configuration persisted to disk")
            
            # Connection close karo
            telnet.sendline('quit')
            telnet.close()
            
            return {
                'success': True,
                'group_id': created_gid,
                'message': f'Group {created_gid} successfully created'
            }
        else:
            # Error aayi
            error_msg = telnet.match.group(1).decode().strip()
            print(f"✗ Error creating group: {error_msg}")
            telnet.sendline('quit')
            telnet.close()
            
            return {
                'success': False,
                'error': error_msg
            }
            
    except pexpect.EOF:
        print("✗ Connection unexpectedly closed")
        return {'success': False, 'error': 'Telnet connection closed unexpectedly'}
    
    except pexpect.TIMEOUT:
        print("✗ Connection timeout")
        return {'success': False, 'error': 'Connection timeout'}
    
    except Exception as e:
        print(f"✗ Unexpected error: {str(e)}")
        return {'success': False, 'error': str(e)}


def list_groups():
    """
    Jasmin jCli se saare groups list karta hai.
    
    Returns:
        list: Group names ki list
    """
    try:
        print(f"Connecting to Jasmin jCli at {TELNET_HOST}:{TELNET_PORT}...")
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
        print("✓ Successfully logged in to jCli")
        
        # List groups
        telnet.sendline('group -l')
        telnet.expect([r'(.+)\n' + STANDARD_PROMPT])
        result = telnet.match.group(0).decode().strip().replace("\r", '').split("\n")
        
        # Parse groups
        if len(result) < 3:
            groups = []
        else:
            groups = [g.strip().lstrip('!#') for g in result[2:-2] if g.strip()]
        
        print(f"✓ Found {len(groups)} groups")
        for group in groups:
            print(f"  - {group}")
        
        # Cleanup
        telnet.sendline('quit')
        telnet.close()
        
        return groups
        
    except Exception as e:
        print(f"✗ Error listing groups: {str(e)}")
        return []


if __name__ == '__main__':
    print("=" * 60)
    print("Jasmin Group Management Script")
    print("=" * 60)
    print()
    
    if len(sys.argv) > 1:
        # Command line se group ID diya hai
        group_id = sys.argv[1]
        print(f"Creating group: {group_id}")
        print("-" * 60)
        result = create_group(group_id)
        print("-" * 60)
        print(f"Result: {result}")
    else:
        # Demo: Ek test group create karo
        print("Demo Mode: Creating test group 'test_group_123'")
        print("-" * 60)
        result = create_group('test_group_123')
        print("-" * 60)
        print(f"Result: {result}")
        print()
        print("Listing all groups:")
        print("-" * 60)
        list_groups()
    
    print()
    print("=" * 60)
    print("Usage: python create_group_example.py <group_id>")
    print("Example: python create_group_example.py customer_grp_001")
    print("=" * 60)

