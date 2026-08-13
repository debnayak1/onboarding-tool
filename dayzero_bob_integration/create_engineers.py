#!/usr/bin/env python3
"""
Create sample engineer users
"""
import requests
import json

BASE_URL = "http://localhost:8080"

def create_engineer(username, full_name, email):
    """Create an engineer user"""
    user_data = {
        "username": username,
        "password": "password123",  # Default password
        "email": email,
        "full_name": full_name,
        "role": "engineer"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
        if response.status_code == 201:
            print(f"✓ Created engineer: {full_name} ({username})")
            return True
        else:
            print(f"✗ Failed to create {full_name}: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error creating {full_name}: {e}")
        return False

def main():
    print("=" * 60)
    print("Creating Sample Engineers")
    print("=" * 60)
    print()
    
    engineers = [
        ("john.doe", "John Doe", "john.doe@company.com"),
        ("jane.smith", "Jane Smith", "jane.smith@company.com"),
        ("bob.wilson", "Bob Wilson", "bob.wilson@company.com"),
        ("alice.johnson", "Alice Johnson", "alice.johnson@company.com"),
        ("charlie.brown", "Charlie Brown", "charlie.brown@company.com"),
    ]
    
    created = 0
    for username, full_name, email in engineers:
        if create_engineer(username, full_name, email):
            created += 1
    
    print()
    print("=" * 60)
    print(f"Created {created}/{len(engineers)} engineers")
    print("=" * 60)
    print()
    print("Default password for all engineers: password123")
    print()
    print("Next steps:")
    print("1. Refresh the Admin Teams page")
    print("2. Click 'Assign Engineer' on any team")
    print("3. You'll now see engineers in the dropdown!")
    print()

if __name__ == "__main__":
    main()

# Made with Bob
