#!/usr/bin/env python3
"""
Quick test script to verify the Teams API is working
"""
import requests
import json

BASE_URL = "http://localhost:8080"

def test_get_teams():
    """Test GET /api/v2/teams endpoint"""
    print("\n=== Testing GET /api/v2/teams ===")
    try:
        response = requests.get(f"{BASE_URL}/api/v2/teams")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_create_team():
    """Test POST /api/v2/teams endpoint"""
    print("\n=== Testing POST /api/v2/teams ===")
    
    team_data = {
        "id": "team_test_backend",
        "name": "Backend Engineering Team",
        "description": "Responsible for backend services and APIs",
        "department": "Engineering",
        "created_by": "admin"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v2/teams",
            json=team_data
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_create_sample_teams():
    """Create multiple sample teams"""
    print("\n=== Creating Sample Teams ===")
    
    teams = [
        {
            "id": "team_backend",
            "name": "Backend Engineering",
            "description": "Backend services, APIs, and microservices",
            "department": "Engineering",
            "created_by": "admin"
        },
        {
            "id": "team_frontend",
            "name": "Frontend Engineering",
            "description": "Web and mobile user interfaces",
            "department": "Engineering",
            "created_by": "admin"
        },
        {
            "id": "team_devops",
            "name": "DevOps & Infrastructure",
            "description": "Cloud infrastructure and deployment pipelines",
            "department": "Operations",
            "created_by": "admin"
        }
    ]
    
    for team in teams:
        print(f"\nCreating team: {team['name']}")
        try:
            response = requests.post(
                f"{BASE_URL}/api/v2/teams",
                json=team
            )
            if response.status_code == 201:
                print(f"✓ Created successfully")
            else:
                print(f"✗ Failed: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"✗ Error: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("Team Management API Test")
    print("=" * 60)
    
    # First, check if any teams exist
    result = test_get_teams()
    
    if result and result.get('count', 0) == 0:
        print("\n⚠️  No teams found. Creating sample teams...")
        test_create_sample_teams()
        
        # Check again
        print("\n=== Verifying teams were created ===")
        test_get_teams()
    else:
        print(f"\n✓ Found {result.get('count', 0)} existing teams")
    
    print("\n" + "=" * 60)
    print("Test complete!")
    print("=" * 60)

# Made with Bob
