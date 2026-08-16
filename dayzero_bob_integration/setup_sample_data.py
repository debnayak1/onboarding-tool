#!/usr/bin/env python3
"""
Setup script to create sample teams with full configuration
This will create teams with access requirements, repositories, and learning modules
"""
import requests
import json

BASE_URL = "http://localhost:8080"

def create_repositories():
    """Create sample repositories"""
    print("\n=== Creating Repositories ===")
    
    repos = [
        {
            "id": "repo_api_gateway",
            "name": "api-gateway",
            "url": "https://github.com/company/api-gateway",
            "language": "python",
            "description": "Main API Gateway service"
        },
        {
            "id": "repo_user_service",
            "name": "user-service",
            "url": "https://github.com/company/user-service",
            "language": "java",
            "description": "User management microservice"
        },
        {
            "id": "repo_frontend_app",
            "name": "frontend-app",
            "url": "https://github.com/company/frontend-app",
            "language": "javascript",
            "description": "Main React frontend application"
        },
        {
            "id": "repo_data_pipeline",
            "name": "data-pipeline",
            "url": "https://github.com/company/data-pipeline",
            "language": "python",
            "description": "Data processing pipeline"
        }
    ]
    
    for repo in repos:
        try:
            response = requests.post(f"{BASE_URL}/api/v2/repositories", json=repo)
            if response.status_code == 201:
                print(f"✓ Created repository: {repo['name']}")
            else:
                print(f"✗ Failed to create {repo['name']}: {response.text}")
        except Exception as e:
            print(f"✗ Error creating {repo['name']}: {e}")

def create_learning_modules():
    """Create sample learning modules"""
    print("\n=== Creating Learning Modules ===")
    
    modules = [
        {
            "id": "module_python_basics",
            "title": "Python Fundamentals",
            "description": "Learn Python basics for backend development",
            "content": "<h2>Python Basics</h2><p>Introduction to Python programming...</p>",
            "language": "python",
            "difficulty": "beginner",
            "estimated_duration": 45,
            "prerequisites": [],
            "learning_objectives": ["Understand Python syntax", "Work with data structures", "Write functions and classes"]
        },
        {
            "id": "module_fastapi",
            "title": "FastAPI Development",
            "description": "Build REST APIs with FastAPI",
            "content": "<h2>FastAPI</h2><p>Learn to build modern APIs...</p>",
            "language": "python",
            "difficulty": "intermediate",
            "estimated_duration": 60,
            "prerequisites": ["module_python_basics"],
            "learning_objectives": ["Create REST APIs", "Handle authentication", "Write API documentation"]
        },
        {
            "id": "module_react_basics",
            "title": "React Fundamentals",
            "description": "Build modern web UIs with React",
            "content": "<h2>React Basics</h2><p>Learn React fundamentals...</p>",
            "language": "javascript",
            "difficulty": "beginner",
            "estimated_duration": 90,
            "prerequisites": [],
            "learning_objectives": ["Understand components", "Manage state", "Handle events"]
        },
        {
            "id": "module_java_spring",
            "title": "Spring Boot Essentials",
            "description": "Build microservices with Spring Boot",
            "content": "<h2>Spring Boot</h2><p>Learn Spring Boot development...</p>",
            "language": "java",
            "difficulty": "intermediate",
            "estimated_duration": 120,
            "prerequisites": [],
            "learning_objectives": ["Create microservices", "Implement REST APIs", "Use Spring Data"]
        }
    ]
    
    for module in modules:
        try:
            response = requests.post(f"{BASE_URL}/api/v2/modules", json=module)
            if response.status_code == 201:
                print(f"✓ Created module: {module['title']}")
            else:
                print(f"✗ Failed to create {module['title']}: {response.text}")
        except Exception as e:
            print(f"✗ Error creating {module['title']}: {e}")

def create_team_with_config(team_data, config_data):
    """Create a team and configure it"""
    print(f"\n=== Creating Team: {team_data['name']} ===")
    
    # Create team
    try:
        response = requests.post(f"{BASE_URL}/api/v2/teams", json=team_data)
        if response.status_code == 201:
            print(f"✓ Created team: {team_data['name']}")
        else:
            print(f"✗ Failed to create team: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error creating team: {e}")
        return False
    
    # Configure team
    try:
        response = requests.put(
            f"{BASE_URL}/api/v2/teams/{team_data['id']}/configuration",
            json=config_data
        )
        if response.status_code == 200:
            print(f"✓ Configured team with:")
            print(f"  - {len(config_data['access_requirements'])} access requirements")
            print(f"  - {len(config_data['repositories'])} repositories")
            print(f"  - {len(config_data['required_modules'])} required modules")
            return True
        else:
            print(f"✗ Failed to configure team: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error configuring team: {e}")
        return False

def setup_backend_team():
    """Create Backend Engineering team with full configuration"""
    team = {
        "id": "team_backend",
        "name": "Backend Engineering",
        "description": "Backend services, APIs, and microservices development",
        "department": "Engineering",
        "created_by": "admin"
    }
    
    config = {
        "access_requirements": [
            {
                "platform": "github",
                "access_type": "write",
                "required": True,
                "auto_approve": True
            },
            {
                "platform": "cloud_platform",
                "access_type": "admin",
                "required": True,
                "auto_approve": False
            },
            {
                "platform": "artifactory",
                "access_type": "read",
                "required": True,
                "auto_approve": True
            }
        ],
        "repositories": [
            "repo_api_gateway",
            "repo_user_service",
            "repo_data_pipeline"
        ],
        "required_modules": [
            "module_python_basics",
            "module_fastapi"
        ],
        "auto_assigned_modules": []
    }
    
    return create_team_with_config(team, config)

def setup_frontend_team():
    """Create Frontend Engineering team with full configuration"""
    team = {
        "id": "team_frontend",
        "name": "Frontend Engineering",
        "description": "Web and mobile user interface development",
        "department": "Engineering",
        "created_by": "admin"
    }
    
    config = {
        "access_requirements": [
            {
                "platform": "github",
                "access_type": "write",
                "required": True,
                "auto_approve": True
            },
            {
                "platform": "jira",
                "access_type": "write",
                "required": True,
                "auto_approve": True
            }
        ],
        "repositories": [
            "repo_frontend_app"
        ],
        "required_modules": [
            "module_react_basics"
        ],
        "auto_assigned_modules": []
    }
    
    return create_team_with_config(team, config)

def setup_fullstack_team():
    """Create Full Stack team with comprehensive configuration"""
    team = {
        "id": "team_fullstack",
        "name": "Full Stack Engineering",
        "description": "End-to-end application development",
        "department": "Engineering",
        "created_by": "admin"
    }
    
    config = {
        "access_requirements": [
            {
                "platform": "github",
                "access_type": "write",
                "required": True,
                "auto_approve": True
            },
            {
                "platform": "cloud_platform",
                "access_type": "write",
                "required": True,
                "auto_approve": False
            },
            {
                "platform": "jira",
                "access_type": "write",
                "required": True,
                "auto_approve": True
            },
            {
                "platform": "artifactory",
                "access_type": "read",
                "required": False,
                "auto_approve": True
            }
        ],
        "repositories": [
            "repo_api_gateway",
            "repo_frontend_app",
            "repo_user_service"
        ],
        "required_modules": [
            "module_python_basics",
            "module_react_basics",
            "module_java_spring"
        ],
        "auto_assigned_modules": [
            "module_fastapi"
        ]
    }
    
    return create_team_with_config(team, config)

def main():
    print("=" * 70)
    print("Setting Up Sample Data with Team Configurations")
    print("=" * 70)
    
    # Step 1: Create repositories
    create_repositories()
    
    # Step 2: Create learning modules
    create_learning_modules()
    
    # Step 3: Create teams with configurations
    print("\n" + "=" * 70)
    print("Creating Teams with Full Configuration")
    print("=" * 70)
    
    backend_success = setup_backend_team()
    frontend_success = setup_frontend_team()
    fullstack_success = setup_fullstack_team()
    
    # Summary
    print("\n" + "=" * 70)
    print("Setup Complete!")
    print("=" * 70)
    
    if backend_success:
        print("✓ Backend Engineering team ready")
    if frontend_success:
        print("✓ Frontend Engineering team ready")
    if fullstack_success:
        print("✓ Full Stack Engineering team ready")
    
    print("\n📋 Next Steps:")
    print("1. Go to http://localhost:5173")
    print("2. Navigate to 'Admin Teams'")
    print("3. Click 'View Details' on any team")
    print("4. Click 'Assign Engineer' to see the activity list!")
    print("\nEach team now has:")
    print("  • Access requirements (GitHub, Cloud Platform, etc.)")
    print("  • Repositories to access")
    print("  • Learning modules to complete")
    print("\n" + "=" * 70)

if __name__ == "__main__":
    main()

