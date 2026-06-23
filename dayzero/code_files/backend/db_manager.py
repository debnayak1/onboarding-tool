"""
Simple JSON-based database manager for persistent storage
No external dependencies required - uses only Python standard library
"""
import json
import os
from datetime import datetime
from typing import Dict, Any

class JSONDatabase:
    """Simple JSON file-based database"""
    
    def __init__(self, db_dir: str = "data"):
        self.db_dir = db_dir
        self.ensure_db_directory()
        
    def ensure_db_directory(self):
        """Create database directory if it doesn't exist"""
        if not os.path.exists(self.db_dir):
            os.makedirs(self.db_dir)
            print(f"✓ Created database directory: {self.db_dir}")
    
    def get_file_path(self, collection: str) -> str:
        """Get file path for a collection"""
        return os.path.join(self.db_dir, f"{collection}.json")
    
    def load(self, collection: str) -> Dict[str, Any]:
        """Load data from a collection"""
        file_path = self.get_file_path(collection)
        try:
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    print(f"✓ Loaded {len(data)} items from {collection}")
                    return data
            else:
                print(f"ℹ No existing data for {collection}, starting fresh")
                return {}
        except Exception as e:
            print(f"⚠ Error loading {collection}: {e}")
            return {}
    
    def save(self, collection: str, data: Dict[str, Any]):
        """Save data to a collection"""
        file_path = self.get_file_path(collection)
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"✓ Saved {len(data)} items to {collection}")
        except Exception as e:
            print(f"⚠ Error saving {collection}: {e}")
    
    def initialize_sample_data(self, collection: str, sample_data: Dict[str, Any]):
        """Initialize collection with sample data if empty"""
        existing_data = self.load(collection)
        if not existing_data:
            self.save(collection, sample_data)
            print(f"✓ Initialized {collection} with sample data")
            return sample_data
        return existing_data

# Global database instance
db = JSONDatabase()

def get_sample_teams():
    """Get sample teams data"""
    return {
        "team_backend": {
            "id": "team_backend",
            "name": "Backend Engineering",
            "description": "Backend development team working on microservices",
            "department": "Engineering",
            "created_at": datetime.now().isoformat(),
            "created_by": "admin"
        },
        "team_frontend": {
            "id": "team_frontend",
            "name": "Frontend Engineering",
            "description": "Frontend development team working on React applications",
            "department": "Engineering",
            "created_at": datetime.now().isoformat(),
            "created_by": "admin"
        }
    }

def get_sample_repositories():
    """Get sample repositories data"""
    return {
        "repo_api_gateway": {
            "id": "repo_api_gateway",
            "name": "api-gateway",
            "url": "https://github.com/company/api-gateway",
            "team_id": "team_backend",
            "language": "python",
            "description": "Main API Gateway service",
            "created_at": datetime.now().isoformat()
        },
        "repo_user_service": {
            "id": "repo_user_service",
            "name": "user-service",
            "url": "https://github.com/company/user-service",
            "team_id": "team_backend",
            "language": "java",
            "description": "User management microservice",
            "created_at": datetime.now().isoformat()
        },
        "repo_frontend_app": {
            "id": "repo_frontend_app",
            "name": "frontend-app",
            "url": "https://github.com/company/frontend-app",
            "team_id": "team_frontend",
            "language": "javascript",
            "description": "Main React frontend application",
            "created_at": datetime.now().isoformat()
        }
    }

def get_sample_modules():
    """Get sample learning modules data"""
    return {
        "module_python_basics": {
            "id": "module_python_basics",
            "title": "Python Fundamentals",
            "description": "Learn Python basics for backend development",
            "content": "<h2>Python Basics</h2><p>Introduction to Python programming...</p>",
            "language": "python",
            "difficulty": "beginner",
            "estimated_duration": 45,
            "prerequisites": [],
            "learning_objectives": ["Understand Python syntax", "Work with data structures", "Write functions and classes"],
            "created_at": datetime.now().isoformat()
        },
        "module_fastapi": {
            "id": "module_fastapi",
            "title": "FastAPI Development",
            "description": "Build REST APIs with FastAPI",
            "content": "<h2>FastAPI</h2><p>Learn to build modern APIs...</p>",
            "language": "python",
            "difficulty": "intermediate",
            "estimated_duration": 60,
            "prerequisites": ["module_python_basics"],
            "learning_objectives": ["Create REST APIs", "Handle authentication", "Write API documentation"],
            "created_at": datetime.now().isoformat()
        },
        "module_react_basics": {
            "id": "module_react_basics",
            "title": "React Fundamentals",
            "description": "Learn React for frontend development",
            "content": "<h2>React Basics</h2><p>Introduction to React...</p>",
            "language": "javascript",
            "difficulty": "beginner",
            "estimated_duration": 50,
            "prerequisites": [],
            "learning_objectives": ["Understand React components", "Manage state with hooks", "Build interactive UIs"],
            "created_at": datetime.now().isoformat()
        },
        "module_java_spring": {
            "id": "module_java_spring",
            "title": "Spring Boot Microservices",
            "description": "Build microservices with Spring Boot",
            "content": "<h2>Spring Boot</h2><p>Learn Spring Boot...</p>",
            "language": "java",
            "difficulty": "intermediate",
            "estimated_duration": 90,
            "prerequisites": [],
            "learning_objectives": ["Create Spring Boot applications", "Implement REST controllers", "Configure microservices"],
            "created_at": datetime.now().isoformat()
        }
    }

def get_sample_team_configs():
    """Get sample team configurations"""
    return {
        "team_backend": {
            "team_id": "team_backend",
            "access_requirements": [
                {"platform": "github", "access_type": "write", "required": True, "auto_approve": False},
                {"platform": "ibm_cloud", "access_type": "read", "required": True, "auto_approve": False},
                {"platform": "artifactory", "access_type": "read", "required": True, "auto_approve": True},
                {"platform": "jira", "access_type": "write", "required": True, "auto_approve": True}
            ],
            "repositories": ["repo_api_gateway", "repo_user_service"],
            "required_modules": ["module_python_basics"],
            "auto_assigned_modules": ["module_fastapi", "module_java_spring"]
        },
        "team_frontend": {
            "team_id": "team_frontend",
            "access_requirements": [
                {"platform": "github", "access_type": "write", "required": True, "auto_approve": False},
                {"platform": "ibm_cloud", "access_type": "read", "required": False, "auto_approve": True},
                {"platform": "jira", "access_type": "write", "required": True, "auto_approve": True}
            ],
            "repositories": ["repo_frontend_app"],
            "required_modules": ["module_react_basics"],
            "auto_assigned_modules": []
        }
    }

def get_sample_users():
    """Get sample users data"""
    return {
        "admin": {
            "id": "admin",
            "username": "admin",
            "full_name": "Admin User",
            "email": "admin@company.com",
            "department": "IT",
            "role": "admin",
            "password": "admin123",
            "created_at": datetime.now().isoformat()
        },
        "john_doe": {
            "id": "john_doe",
            "username": "john_doe",
            "full_name": "John Doe",
            "email": "john.doe@company.com",
            "department": "Engineering",
            "role": "engineer",
            "password": "password123",
            "created_at": datetime.now().isoformat()
        }
    }

def initialize_all_collections():
    """Initialize all database collections with sample data"""
    print("\n=== Initializing Database ===")
    
    teams = db.initialize_sample_data("teams", get_sample_teams())
    repos = db.initialize_sample_data("repositories", get_sample_repositories())
    modules = db.initialize_sample_data("learning_modules", get_sample_modules())
    configs = db.initialize_sample_data("team_configs", get_sample_team_configs())
    users = db.initialize_sample_data("users", get_sample_users())
    
    # Initialize empty collections
    access_requests = db.load("access_requests") or {}
    module_assignments = db.load("module_assignments") or {}
    engineer_progress = db.load("engineer_progress") or {}
    
    print("=== Database Ready ===\n")
    
    return teams, repos, modules, configs, users, access_requests

# Made with Bob
