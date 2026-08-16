"""
AI Onboarding Platform - Backend API
FastAPI application for managing onboarding, learning, and access requests
"""

from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import json
import os
import re

# Security
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Initialize FastAPI app
app = FastAPI(
    title="Onboarding Platform API",
    description="Backend API for AI-powered onboarding system",
    version="1.0.0"
)

# CORS Configuration - Allow all origins for demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (for MVP - will upgrade to Cloudant later)
progress_db = {}
quizzes_db = {}
groups_db = {}

# Persistent storage will be initialized later for users and access_requests
users_db = {}
access_requests_db = {}

# Pydantic Models
class UserLogin(BaseModel):
    username: str
    password: str

class UserRegister(BaseModel):
    username: str
    password: str
    email: EmailStr
    full_name: str
    department: str
    role: str = "engineer"

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict

class User(BaseModel):
    id: str
    username: str
    full_name: str
    email: EmailStr
    department: str
    role: str = "engineer"  # engineer, admin, manager
    group_id: Optional[str] = None
    created_at: Optional[str] = None

class LearningProgress(BaseModel):
    user_id: str
    module_id: str
    completion: int  # 0-100
    score: Optional[int] = 0
    time_spent: Optional[int] = 0  # in minutes
    last_accessed: Optional[str] = None

class QuizSubmission(BaseModel):
    quiz_id: str
    user_id: str
    answers: List[int]

class AccessRequest(BaseModel):
    user_id: str
    platform: str  # git, cloud_platform, artifactory
    access_type: str  # read, write, admin
    justification: str
    status: str = "pending"  # pending, approved, rejected, provisioned

class Group(BaseModel):
    id: str
    name: str
    description: str

# Authentication Helper Functions (simplified for demo)
def verify_password(plain_password, stored_password):
    """Verify password - using plain comparison for demo"""
    return plain_password == stored_password

def get_password_hash(password):
    """Store password - plain for demo (hash in production!)"""
    return password

def create_access_token(data: dict):
    """Create JWT token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_from_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get user from JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Authentication Endpoints
@app.post("/auth/login")
async def login(user_login: UserLogin):
    """User login"""
    username = user_login.username
    
    if username not in users_db:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    user = users_db[username]
    if not verify_password(user_login.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    # Create access token
    access_token = create_access_token(data={"sub": username})
    
    # Return user data without password
    user_data = {k: v for k, v in user.items() if k != "password"}
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data
    }

@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
async def register(user_register: UserRegister):
    """User registration"""
    if user_register.username in users_db:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Create new user
    new_user = {
        "id": user_register.username,
        "username": user_register.username,
        "full_name": user_register.full_name,
        "email": user_register.email,
        "department": user_register.department,
        "role": user_register.role,
        "password": user_register.password,  # Plain password for demo
        "created_at": datetime.now().isoformat()
    }
    
    users_db[user_register.username] = new_user
    save_users()  # Save to disk
    
    # Return user data without password
    user_data = {k: v for k, v in new_user.items() if k != "password"}
    
    return {"message": "User created successfully", "user": user_data}

@app.get("/users/me")
async def get_current_user(username: str = Depends(get_user_from_token)):
    """Get current user"""
    if username not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = users_db[username]
    user_data = {k: v for k, v in user.items() if k != "hashed_password"}
    return user_data
    access_requirements: List[Dict]
    training_modules: List[str]

# Health Check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

# User Management
@app.get("/api/users")
async def get_all_users():
    """Get all users"""
    return {"users": list(users_db.values()), "count": len(users_db)}

@app.post("/api/users", status_code=status.HTTP_201_CREATED)
async def create_user(user: User):
    """Create a new user"""
    if user.id in users_db:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user.created_at = datetime.now().isoformat()
    users_db[user.id] = user.dict()
    save_users()  # Save to disk
    return user

@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    """Get user by ID"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    return users_db[user_id]

@app.put("/api/users/{user_id}")
async def update_user(user_id: str, user: User):
    """Update user"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    users_db[user_id] = user.dict()
    save_users()  # Save to disk
    return user

# Learning Progress
@app.get("/api/progress/{user_id}")
async def get_user_progress(user_id: str):
    """Get all progress for a user"""
    user_progress = [p for p in progress_db.values() if p["user_id"] == user_id]
    return {"progress": user_progress, "count": len(user_progress)}

@app.post("/api/progress")
async def update_progress(progress: LearningProgress):
    """Update learning progress"""
    progress.last_accessed = datetime.now().isoformat()
    key = f"{progress.user_id}_{progress.module_id}"
    progress_db[key] = progress.dict()
    return progress

@app.get("/api/progress/{user_id}/{module_id}")
async def get_module_progress(user_id: str, module_id: str):
    """Get progress for specific module"""
    key = f"{user_id}_{module_id}"
    if key not in progress_db:
        return {"completion": 0, "score": 0}
    return progress_db[key]

# Quiz Management
@app.get("/api/quiz/{module_id}")
async def get_quiz(module_id: str):
    """Get quiz for a module"""
    # Sample quiz questions
    quizzes = {
        "git_basics": [
            {
                "id": 1,
                "question": "What is Git?",
                "options": ["Version control system", "Database", "IDE", "Programming language"],
                "correct": 0
            },
            {
                "id": 2,
                "question": "What is a branch in Git?",
                "options": ["A tree part", "A parallel version of code", "A bug", "A feature"],
                "correct": 1
            },
            {
                "id": 3,
                "question": "What command creates a new branch?",
                "options": ["git branch <name>", "git create", "git new", "git add"],
                "correct": 0
            },
            {
                "id": 4,
                "question": "What is a pull request?",
                "options": ["Download code", "Request to merge changes", "Delete branch", "Create repo"],
                "correct": 1
            },
            {
                "id": 5,
                "question": "What is the main branch typically called?",
                "options": ["master or main", "develop", "feature", "release"],
                "correct": 0
            }
        ],
        "backend_architecture": [
            {
                "id": 1,
                "question": "What is microservices architecture?",
                "options": ["Single large application", "Small independent services", "Database design", "UI framework"],
                "correct": 1
            },
            {
                "id": 2,
                "question": "What is an API Gateway?",
                "options": ["Database", "Entry point for APIs", "Frontend framework", "Testing tool"],
                "correct": 1
            },
            {
                "id": 3,
                "question": "What is REST?",
                "options": ["Sleep", "Architectural style for APIs", "Database", "Programming language"],
                "correct": 1
            },
            {
                "id": 4,
                "question": "What is a container?",
                "options": ["Box", "Isolated environment for apps", "Database", "Network"],
                "correct": 1
            },
            {
                "id": 5,
                "question": "What is Docker?",
                "options": ["Ship", "Container platform", "Database", "IDE"],
                "correct": 1
            }
        ]
    }
    
    if module_id not in quizzes:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    return {
        "quiz_id": f"quiz_{module_id}",
        "module_id": module_id,
        "questions": quizzes[module_id]
    }

@app.post("/api/quiz/submit")
async def submit_quiz(submission: QuizSubmission):
    """Submit quiz and get results"""
    # Get quiz questions
    module_id = submission.quiz_id.replace("quiz_", "")
    quiz_response = await get_quiz(module_id)
    questions = quiz_response["questions"]
    
    # Calculate score
    correct_count = 0
    topic_scores = {}
    
    for i, answer in enumerate(submission.answers):
        if i < len(questions):
            is_correct = answer == questions[i]["correct"]
            if is_correct:
                correct_count += 1
            
            # Track by topic (simplified)
            topic = module_id
            if topic not in topic_scores:
                topic_scores[topic] = {"correct": 0, "total": 0}
            topic_scores[topic]["total"] += 1
            if is_correct:
                topic_scores[topic]["correct"] += 1
    
    total_questions = len(questions)
    percentage = (correct_count / total_questions) * 100 if total_questions > 0 else 0
    
    # Calculate topic percentages
    topic_percentages = {
        topic: (scores["correct"] / scores["total"]) * 100
        for topic, scores in topic_scores.items()
    }
    
    # Determine weak areas
    weak_areas = [topic for topic, pct in topic_percentages.items() if pct < 70]
    
    # Save result
    result = {
        "quiz_id": submission.quiz_id,
        "user_id": submission.user_id,
        "score": correct_count,
        "total": total_questions,
        "percentage": round(percentage, 1),
        "topic_scores": topic_percentages,
        "weak_areas": weak_areas,
        "passed": percentage >= 70,
        "submitted_at": datetime.now().isoformat()
    }
    
    quizzes_db[f"{submission.user_id}_{submission.quiz_id}"] = result
    
    return result
@app.get("/quizzes")
async def get_all_quizzes():
    """Get list of all available quizzes"""
    quizzes = [
        {
            "id": "quiz_git_basics",
            "quiz_id": "quiz_git_basics",
            "module_id": "git_basics",
            "title": "Git Basics Quiz",
            "description": "Test your knowledge of Git fundamentals",
            "questions": [1, 2, 3, 4, 5],  # Array to show count
            "time_limit": 30,
            "passing_score": 70
        },
        {
            "id": "quiz_backend_architecture",
            "quiz_id": "quiz_backend_architecture",
            "module_id": "backend_architecture",
            "title": "Backend Architecture Quiz",
            "description": "Test your understanding of backend architecture concepts",
            "questions": [1, 2, 3, 4, 5],  # Array to show count
            "time_limit": 30,
            "passing_score": 70
        }
    ]
    return quizzes

@app.get("/quizzes/results/{user_id}")
async def get_quiz_results(user_id: str):
    """Get all quiz results for a user"""
    user_results = []
    
    # Filter results for this user from quizzes_db
    for key, result in quizzes_db.items():
        if result.get("user_id") == user_id:
            user_results.append(result)
    
    # Return empty array instead of 404 when no results found
    return user_results

@app.get("/quizzes/{quiz_id}")
async def get_quiz_by_id(quiz_id: str):
    """Get a specific quiz by ID for taking the quiz"""
    # Extract module_id from quiz_id (e.g., "quiz_git_basics" -> "git_basics")
    module_id = quiz_id.replace("quiz_", "")
    
    # Sample quiz questions
    quizzes_data = {
        "git_basics": {
            "id": "quiz_git_basics",
            "quiz_id": "quiz_git_basics",
            "module_id": "git_basics",
            "title": "Git Basics Quiz",
            "description": "Test your knowledge of Git fundamentals",
            "questions": [
                {
                    "id": 1,
                    "question": "What is Git?",
                    "options": ["Version control system", "Database", "IDE", "Programming language"],
                    "correct": 0
                },
                {
                    "id": 2,
                    "question": "What is a branch in Git?",
                    "options": ["A tree part", "A parallel version of code", "A bug", "A feature"],
                    "correct": 1
                },
                {
                    "id": 3,
                    "question": "What command creates a new branch?",
                    "options": ["git branch <name>", "git create", "git new", "git add"],
                    "correct": 0
                },
                {
                    "id": 4,
                    "question": "What is a pull request?",
                    "options": ["Download code", "Request to merge changes", "Delete branch", "Create repo"],
                    "correct": 1
                },
                {
                    "id": 5,
                    "question": "What is the main branch typically called?",
                    "options": ["master or main", "develop", "feature", "release"],
                    "correct": 0
                }
            ]
        },
        "backend_architecture": {
            "id": "quiz_backend_architecture",
            "quiz_id": "quiz_backend_architecture",
            "module_id": "backend_architecture",
            "title": "Backend Architecture Quiz",
            "description": "Test your understanding of backend architecture concepts",
            "questions": [
                {
                    "id": 1,
                    "question": "What is microservices architecture?",
                    "options": ["Single large application", "Small independent services", "Database design", "UI framework"],
                    "correct": 1
                },
                {
                    "id": 2,
                    "question": "What is an API Gateway?",
                    "options": ["Database", "Entry point for APIs", "Frontend framework", "Testing tool"],
                    "correct": 1
                },
                {
                    "id": 3,
                    "question": "What is REST?",
                    "options": ["Sleep", "Architectural style for APIs", "Database", "Programming language"],
                    "correct": 1
                },
                {
                    "id": 4,
                    "question": "What is a container?",
                    "options": ["Box", "Isolated environment for apps", "Database", "Network"],
                    "correct": 1
                },
                {
                    "id": 5,
                    "question": "What is Docker?",
                    "options": ["Ship", "Container platform", "Database", "IDE"],
                    "correct": 1
                }
            ]
        }
    }
    
    if module_id not in quizzes_data:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    return quizzes_data[module_id]
# Learning Module endpoints
@app.get("/learning/modules")
async def get_learning_modules():
    """Get all learning modules"""
    modules = [
        {
            "id": "git_basics",
            "title": "Git Basics",
            "description": "Learn the fundamentals of version control with Git",
            "duration": "2 hours",
            "difficulty": "Beginner",
            "topics": ["Version Control", "Branching", "Merging", "Pull Requests"],
            "content": "Introduction to Git and version control systems..."
        },
        {
            "id": "backend_architecture",
            "title": "Backend Architecture",
            "description": "Understanding backend system design and architecture patterns",
            "duration": "3 hours",
            "difficulty": "Intermediate",
            "topics": ["Microservices", "APIs", "Databases", "Scalability"],
            "content": "Learn about modern backend architecture patterns..."
        },
        {
            "id": "frontend_development",
            "title": "Frontend Development",
            "description": "Modern frontend development with React",
            "duration": "4 hours",
            "difficulty": "Intermediate",
            "topics": ["React", "Components", "State Management", "Hooks"],
            "content": "Build modern web applications with React..."
        }
    ]
    return modules

@app.get("/learning/modules/{module_id}")
async def get_module_content(module_id: str):
    """Get detailed content for a specific module"""
    modules = {
        "git_basics": {
            "id": "git_basics",
            "title": "Git Basics",
            "description": "Learn the fundamentals of version control with Git",
            "duration": "2 hours",
            "difficulty": "Beginner",
            "content": "Detailed content about Git basics...",
            "sections": [
                {"title": "Introduction to Git", "duration": "30 min"},
                {"title": "Basic Commands", "duration": "45 min"},
                {"title": "Branching and Merging", "duration": "45 min"}
            ]
        },
        "backend_architecture": {
            "id": "backend_architecture",
            "title": "Backend Architecture",
            "description": "Understanding backend system design",
            "duration": "3 hours",
            "difficulty": "Intermediate",
            "content": "Detailed content about backend architecture...",
            "sections": [
                {"title": "Microservices Overview", "duration": "60 min"},
                {"title": "API Design", "duration": "60 min"},
                {"title": "Database Design", "duration": "60 min"}
            ]
        },
        "frontend_development": {
            "id": "frontend_development",
            "title": "Frontend Development",
            "description": "Modern frontend development with React",
            "duration": "4 hours",
            "difficulty": "Intermediate",
            "content": "Detailed content about frontend development...",
            "sections": [
                {"title": "React Fundamentals", "duration": "90 min"},
                {"title": "State Management", "duration": "90 min"},
                {"title": "Advanced Patterns", "duration": "60 min"}
            ]
        }
    }
    
    if module_id not in modules:
        raise HTTPException(status_code=404, detail="Module not found")
    
    return modules[module_id]

@app.get("/learning/progress/{user_id}")
async def get_user_learning_progress(user_id: str):
    """Get learning progress for a user"""
    # Return progress from progress_db or empty array
    user_progress = [p for p in progress_db.values() if p.get("user_id") == user_id]
    return user_progress

@app.post("/learning/progress/{user_id}/{module_id}")
async def update_user_progress(user_id: str, module_id: str, progress_data: dict):
    """Update learning progress for a user"""
    progress_key = f"{user_id}_{module_id}"
    
    progress_entry = {
        "user_id": user_id,
        "module_id": module_id,
        "progress_percentage": progress_data.get("progress_percentage", 0),
        "status": progress_data.get("status", "in_progress"),
        "time_spent": progress_data.get("time_spent", 0),
        "last_accessed": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    progress_db[progress_key] = progress_entry
    return progress_entry



# Access Request Management
@app.get("/api/access-requests")
async def get_all_access_requests():
    """Get all access requests"""
    return {"requests": list(access_requests_db.values()), "count": len(access_requests_db)}

@app.get("/api/access-requests/user/{user_id}")
async def get_user_access_requests(user_id: str):
    """Get access requests for a user"""
    user_requests = [r for r in access_requests_db.values() if r["user_id"] == user_id]
    return {"requests": user_requests, "count": len(user_requests)}

@app.post("/api/access-requests", status_code=status.HTTP_201_CREATED)
async def create_access_request(request: AccessRequest):
    """Create new access request"""
    request_id = f"req_{len(access_requests_db) + 1:04d}"
    request_data = request.dict()
    request_data["id"] = request_id
    request_data["created_at"] = datetime.now().isoformat()
    request_data["updated_at"] = datetime.now().isoformat()
    
    access_requests_db[request_id] = request_data
    return request_data

@app.put("/api/access-requests/{request_id}/status")
async def update_access_request_status(request_id: str, status: str):
    """Update access request status"""
    if request_id not in access_requests_db:
        raise HTTPException(status_code=404, detail="Request not found")
    
    access_requests_db[request_id]["status"] = status
    access_requests_db[request_id]["updated_at"] = datetime.now().isoformat()
    
    return access_requests_db[request_id]
# Access Request endpoints matching frontend expectations
@app.post("/access/requests", status_code=status.HTTP_201_CREATED)
async def create_access_request_v2(request: AccessRequest):
    """Create new access request (frontend compatible route)"""
    request_id = f"req_{len(access_requests_db) + 1:04d}"
    request_data = request.dict()
    request_data["id"] = request_id
    request_data["status"] = "pending"
    request_data["requested_at"] = datetime.now().isoformat()
    request_data["created_at"] = datetime.now().isoformat()
    request_data["updated_at"] = datetime.now().isoformat()
    request_data["admin_notes"] = ""
    
    access_requests_db[request_id] = request_data
    return request_data

@app.get("/access/requests/user/{user_id}")
async def get_user_access_requests_v2(user_id: str):
    """Get access requests for a user (frontend compatible route)"""
    user_requests = [r for r in access_requests_db.values() if r.get("user_id") == user_id]
    return user_requests

@app.put("/access/requests/{request_id}")
async def update_access_request_v2(request_id: str, status: str, admin_notes: str = ""):
    """Update access request (frontend compatible route)"""
    if request_id not in access_requests_db:
        raise HTTPException(status_code=404, detail="Request not found")
    
    access_requests_db[request_id]["status"] = status
    access_requests_db[request_id]["admin_notes"] = admin_notes
    access_requests_db[request_id]["updated_at"] = datetime.now().isoformat()
    
    return access_requests_db[request_id]


# Dashboard
@app.get("/api/dashboard/{user_id}")
async def get_user_dashboard(user_id: str):
    """Get complete dashboard data for a user"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user data
    user = users_db[user_id]
    
    # Get progress
    user_progress = [p for p in progress_db.values() if p["user_id"] == user_id]
    
    # Get access requests
    user_requests = [r for r in access_requests_db.values() if r["user_id"] == user_id]
    
    # Calculate summary
    total_modules = len(user_progress)
    total_completion = sum(p["completion"] for p in user_progress)
    avg_completion = total_completion / total_modules if total_modules > 0 else 0
    
    pending_requests = len([r for r in user_requests if r["status"] == "pending"])
    approved_requests = len([r for r in user_requests if r["status"] == "approved"])
    
    return {
        "user": user,
        "progress": user_progress,
        "access_requests": user_requests,
        "summary": {
            "total_modules": total_modules,
            "avg_completion": round(avg_completion, 1),
            "pending_requests": pending_requests,
            "approved_requests": approved_requests,
            "day_number": 5,  # Calculate based on created_at
            "onboarding_days": 30
        }
    }

# Admin Endpoints
@app.get("/api/admin/stats")
async def get_admin_stats():
    """Get admin statistics"""
    total_users = len(users_db)
    total_progress = len(progress_db)
    total_requests = len(access_requests_db)
    
    pending_requests = len([r for r in access_requests_db.values() if r["status"] == "pending"])
    approved_requests = len([r for r in access_requests_db.values() if r["status"] == "approved"])
    
    completed_modules = len([p for p in progress_db.values() if p["completion"] == 100])
    
    return {
        "total_users": total_users,
        "total_progress_entries": total_progress,
        "total_access_requests": total_requests,
        "pending_requests": pending_requests,
        "approved_requests": approved_requests,
        "completed_modules": completed_modules,
        "active_onboarding": len([u for u in users_db.values() if u["role"] == "engineer"])
    }

@app.get("/api/admin/users")
async def get_admin_users():
    """Get all users with their progress"""
    users_with_progress = []
    
    for user_id, user in users_db.items():
        user_progress = [p for p in progress_db.values() if p["user_id"] == user_id]
        total_completion = sum(p["completion"] for p in user_progress)
        avg_completion = total_completion / len(user_progress) if user_progress else 0
        
        users_with_progress.append({
            **user,
            "progress_summary": {
                "total_modules": len(user_progress),
                "avg_completion": round(avg_completion, 1)
            }
        })
    
    return {"users": users_with_progress}

# Group Management
@app.post("/api/groups")
async def create_group(group: Group):
    """Create a new group"""
    if group.id in groups_db:
        raise HTTPException(status_code=400, detail="Group already exists")
    
    groups_db[group.id] = group.dict()
    return group

@app.get("/api/groups")
async def get_all_groups():
    """Get all groups"""
    return {"groups": list(groups_db.values())}

@app.post("/api/groups/{group_id}/assign/{user_id}")
async def assign_user_to_group(group_id: str, user_id: str):
    """Assign user to a group"""
    if group_id not in groups_db:
        raise HTTPException(status_code=404, detail="Group not found")
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user's group
    users_db[user_id]["group_id"] = group_id
    
    # Auto-create access requests based on group requirements
    group = groups_db[group_id]
    created_requests = []
    
    for access_req in group["access_requirements"]:
        request = AccessRequest(
            user_id=user_id,
            platform=access_req["platform"],
            access_type=access_req["access_type"],
            justification=f"Required for {group['name']} group membership",
            status="pending"
        )
        result = await create_access_request(request)
        created_requests.append(result)
    
    return {
        "message": f"User assigned to {group['name']}",
        "access_requests_created": len(created_requests),
        "requests": created_requests
    }

# ============= ADDITIONAL ADMIN ENDPOINTS =============

@app.get("/admin/users")
async def get_all_users_admin():
    """Get all users for admin"""
    return {"users": list(users_db.values())}

@app.get("/access/requests")
async def get_all_access_requests_admin():
    """Get all access requests with user information"""
    requests_with_users = []
    for request in access_requests_db.values():
        request_copy = request.copy()
        # Add user information
        user_id = request.get("user_id")
        if user_id and user_id in users_db:
            user = users_db[user_id]
            request_copy["user_name"] = user.get("full_name", user.get("username", "Unknown"))
            request_copy["user_email"] = user.get("email", "")
        else:
            request_copy["user_name"] = "Unknown User"
            request_copy["user_email"] = ""
        requests_with_users.append(request_copy)
    return requests_with_users

@app.get("/admin/stats")
async def get_system_stats():
    """Get system statistics for admin dashboard with team-wise breakdown"""
    total_users = len(users_db)
    total_engineers = len([u for u in users_db.values() if u.get('role') == 'engineer'])
    total_requests = len(access_requests_db)
    pending_requests = len([r for r in access_requests_db.values() if r.get('status') == 'pending'])
    approved_requests = len([r for r in access_requests_db.values() if r.get('status') == 'approved'])
    
    # Calculate team-wise statistics
    team_stats = []
    if 'teams_db_v2' in globals():
        for team_id, team in teams_db_v2.items():
            # Count engineers in this team
            team_engineers = [u for u in users_db.values() if u.get('team_id') == team_id]
            
            # Count access requests for this team
            team_requests = [r for r in access_requests_db.values() if r.get('team_id') == team_id]
            team_pending = len([r for r in team_requests if r.get('status') == 'pending'])
            team_approved = len([r for r in team_requests if r.get('status') == 'approved'])
            
            # Get team configuration
            team_config = team_configs_db_v2.get(team_id, {})
            
            team_stats.append({
                "team_id": team_id,
                "team_name": team.get('name', 'Unknown'),
                "department": team.get('department', 'N/A'),
                "member_count": len(team_engineers),
                "total_requests": len(team_requests),
                "pending_requests": team_pending,
                "approved_requests": team_approved,
                "required_access": len(team_config.get('access_requirements', [])),
                "repositories": len(team_config.get('repositories', [])),
                "learning_modules": len(team_config.get('required_modules', []))
            })
    
    return {
        "total_users": total_users,
        "total_engineers": total_engineers,
        "total_requests": total_requests,
        "pending_requests": pending_requests,
        "approved_requests": approved_requests,
        "active_teams": len(teams_db_v2) if 'teams_db_v2' in globals() else 0,
        "team_stats": team_stats
    }

# ============= TEAM MANAGEMENT WITH PERSISTENT STORAGE =============

from db_manager import db, initialize_all_collections

# Initialize persistent storage
teams_db_v2, repositories_db_v2, learning_modules_db_v2, team_configs_db_v2, users_db, access_requests_db = initialize_all_collections()

# Load existing data
module_assignments_db_v2 = db.load("module_assignments") or {}
engineer_progress_db_v2 = db.load("engineer_progress") or {}

# Debug: Print loaded data
print(f"[STARTUP] Loaded {len(module_assignments_db_v2)} module assignments")
print(f"[STARTUP] Loaded {len(engineer_progress_db_v2)} engineer progress records")
if module_assignments_db_v2:
    print(f"[STARTUP] Sample assignment keys: {list(module_assignments_db_v2.keys())[:3]}")

# Helper functions to save data after changes
def save_teams():
    db.save("teams", teams_db_v2)

def save_repositories():
    db.save("repositories", repositories_db_v2)

def save_modules():
    db.save("learning_modules", learning_modules_db_v2)

def save_team_configs():
    db.save("team_configs", team_configs_db_v2)

def save_assignments():
    db.save("module_assignments", module_assignments_db_v2)

def save_progress():
    db.save("engineer_progress", engineer_progress_db_v2)

def save_users():
    db.save("users", users_db)

def save_access_requests():
    db.save("access_requests", access_requests_db)

# Old in-memory dict structure (replaced with persistent storage above)
_old_repositories_db_v2 = {
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

learning_modules_db_v2 = {
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

team_configs_db_v2 = {
    "team_backend": {
        "team_id": "team_backend",
        "access_requirements": [
            {"platform": "github", "access_type": "write", "required": True, "auto_approve": False},
            {"platform": "cloud_platform", "access_type": "read", "required": True, "auto_approve": False},
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
            {"platform": "cloud_platform", "access_type": "read", "required": False, "auto_approve": True},
            {"platform": "jira", "access_type": "write", "required": True, "auto_approve": True}
        ],
        "repositories": ["repo_frontend_app"],
        "required_modules": ["module_react_basics"],
        "auto_assigned_modules": []
    }
}

module_assignments_db_v2 = {}
engineer_progress_db_v2 = {}

# Team Management Endpoints
@app.post("/api/v2/teams", status_code=status.HTTP_201_CREATED)
async def create_team_v2(team: Dict):
    """Create a new team"""
    team_id = team.get("id")
    if team_id in teams_db_v2:
        raise HTTPException(status_code=400, detail="Team already exists")
    
    team["created_at"] = datetime.now().isoformat()
    teams_db_v2[team_id] = team
    save_teams()  # Save to disk
    
    # Initialize empty configuration
    team_configs_db_v2[team_id] = {
        "team_id": team_id,
        "access_requirements": [],
        "repositories": [],
        "required_modules": [],
        "auto_assigned_modules": []
    }
    save_team_configs()  # Save to disk
    
    return team

@app.get("/api/v2/teams")
async def get_all_teams_v2():
    """Get all teams"""
    teams_list = list(teams_db_v2.values())
    print(f"[DEBUG] GET /api/v2/teams - Returning {len(teams_list)} teams")
    print(f"[DEBUG] Teams: {teams_list}")
    return {"teams": teams_list, "count": len(teams_db_v2)}

@app.get("/api/v2/teams/{team_id}")
async def get_team_v2(team_id: str):
    """Get team details"""
    if team_id not in teams_db_v2:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team = teams_db_v2[team_id]
    config = team_configs_db_v2.get(team_id, {})
    members = [u for u in users_db.values() if u.get("team_id") == team_id]
    
    return {
        "team": team,
        "configuration": config,
        "members": members,
        "member_count": len(members)
    }

@app.put("/api/v2/teams/{team_id}/configuration")
async def update_team_config_v2(team_id: str, config: Dict):
    """Update team configuration"""
    if team_id not in teams_db_v2:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team_configs_db_v2[team_id] = config
    save_team_configs()  # Save to disk
    return {"message": "Configuration updated", "configuration": config}

@app.get("/api/v2/repositories")
async def get_all_repositories_v2():
    """Get all repositories"""
    return {"repositories": list(repositories_db_v2.values()), "count": len(repositories_db_v2)}

@app.get("/api/v2/repositories/team/{team_id}")
async def get_team_repositories_v2(team_id: str):
    """Get team repositories"""
    team_repos = [r for r in repositories_db_v2.values() if r["team_id"] == team_id]
    return {"repositories": team_repos, "count": len(team_repos)}

@app.post("/api/v2/repositories", status_code=status.HTTP_201_CREATED)
async def create_repository_v2(repo: Dict):
    """Create repository"""
    repo_id = repo.get("id")
    if repo_id in repositories_db_v2:
        raise HTTPException(status_code=400, detail="Repository already exists")
    
    repo["created_at"] = datetime.now().isoformat()
    repositories_db_v2[repo_id] = repo
    save_repositories()  # Save to disk
    return repo

@app.get("/api/v2/modules")
async def get_all_modules_v2():
    """Get all learning modules"""
    return {"modules": list(learning_modules_db_v2.values()), "count": len(learning_modules_db_v2)}

@app.post("/api/v2/modules", status_code=status.HTTP_201_CREATED)
async def create_module_v2(module: Dict):
    """Create learning module"""
    module_id = module.get("id")
    if module_id in learning_modules_db_v2:
        raise HTTPException(status_code=400, detail="Module already exists")
    
    module["created_at"] = datetime.now().isoformat()
    learning_modules_db_v2[module_id] = module
    save_modules()  # Save to disk
    return module

@app.post("/api/v2/engineers/{user_id}/assign-team/{team_id}")
async def assign_engineer_to_team_v2(user_id: str, team_id: str):
    """Assign engineer to team"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    if team_id not in teams_db_v2:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Update user's team
    users_db[user_id]["team_id"] = team_id
    save_users()  # Save to disk
    
    # Initialize progress
    progress_key = f"{user_id}_{team_id}"
    engineer_progress_db_v2[progress_key] = {
        "user_id": user_id,
        "team_id": team_id,
        "onboarding_status": "in_progress",
        "access_status": {},
        "module_progress": {},
        "repo_access": [],
        "started_at": datetime.now().isoformat(),
        "last_updated": datetime.now().isoformat()
    }
    
    # Get team config
    team_config = team_configs_db_v2.get(team_id, {})
    
    # Create access requests
    created_requests = []
    for access_req in team_config.get("access_requirements", []):
        request_id = f"req_{len(access_requests_db) + 1:04d}"
        request_data = {
            "id": request_id,
            "user_id": user_id,
            "team_id": team_id,
            "platform": access_req["platform"],
            "access_type": access_req["access_type"],
            "justification": f"Required for {teams_db_v2[team_id]['name']} team membership",
            "urgency": "high" if access_req["required"] else "normal",
            "status": "approved" if access_req.get("auto_approve") else "pending",
            "requested_at": datetime.now().isoformat(),
            "admin_notes": "Auto-generated from team requirements"
        }
        access_requests_db[request_id] = request_data
        created_requests.append(request_data)
        engineer_progress_db_v2[progress_key]["access_status"][access_req["platform"]] = request_data["status"]
    
    save_access_requests()  # Save to disk
    
    # Assign modules
    assigned_modules = []
    for module_id in team_config.get("required_modules", []):
        assignment = {
            "user_id": user_id,
            "module_id": module_id,
            "team_id": team_id,
            "assigned_reason": "team_required",
            "assigned_at": datetime.now().isoformat(),
            "status": "not_started",
            "progress_percentage": 0,
            "time_spent": 0
        }
        assignment_key = f"{user_id}_{module_id}"
        module_assignments_db_v2[assignment_key] = assignment
        assigned_modules.append(assignment)
    
    # Auto-assign based on repo languages
    repo_languages = set()
    for repo_id in team_config.get("repositories", []):
        if repo_id in repositories_db_v2:
            repo_languages.add(repositories_db_v2[repo_id]["language"])
    
    for language in repo_languages:
        lang_modules = [m for m in learning_modules_db_v2.values() if m.get("language") == language]
        for module in lang_modules:
            if module["id"] not in [m["module_id"] for m in assigned_modules]:
                assignment = {
                    "user_id": user_id,
                    "module_id": module["id"],
                    "team_id": team_id,
                    "assigned_reason": f"repo_based_{language}",
                    "assigned_at": datetime.now().isoformat(),
                    "status": "not_started",
                    "progress_percentage": 0,
                    "time_spent": 0
                }
                assignment_key = f"{user_id}_{module['id']}"
                module_assignments_db_v2[assignment_key] = assignment
                assigned_modules.append(assignment)
    
    # Save all changes to disk
    save_progress()
    save_assignments()
    
    return {
        "message": f"Engineer assigned to {teams_db_v2[team_id]['name']}",
        "team": teams_db_v2[team_id],
        "access_requests_created": len(created_requests),
        "modules_assigned": len(assigned_modules),
        "next_steps": ["Complete pending access requests", "Start required learning modules", "Review team repositories"]
    }

@app.get("/api/v2/engineers/{user_id}/dashboard")
async def get_engineer_dashboard_v2(user_id: str):
    """Get engineer dashboard"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = users_db[user_id]
    team_id = user.get("team_id")
    team = teams_db_v2.get(team_id) if team_id else None
    
    progress_key = f"{user_id}_{team_id}" if team_id else None
    progress = engineer_progress_db_v2.get(progress_key, {})
    
    user_requests = [r for r in access_requests_db.values() if r["user_id"] == user_id]
    user_assignments = [a for a in module_assignments_db_v2.values() if a["user_id"] == user_id]
    
    team_repos = []
    if team_id and team_id in team_configs_db_v2:
        repo_ids = team_configs_db_v2[team_id].get("repositories", [])
        team_repos = [repositories_db_v2[rid] for rid in repo_ids if rid in repositories_db_v2]
    
    pending_actions = []
    pending_requests = [r for r in user_requests if r["status"] == "pending"]
    if pending_requests:
        pending_actions.append({"type": "access_request", "count": len(pending_requests), "message": f"{len(pending_requests)} access request(s) pending approval"})
    
    incomplete_modules = [a for a in user_assignments if a["status"] != "completed"]
    if incomplete_modules:
        pending_actions.append({"type": "learning", "count": len(incomplete_modules), "message": f"{len(incomplete_modules)} learning module(s) to complete"})
    
    total_modules = len(user_assignments)
    completed_modules = len([a for a in user_assignments if a["status"] == "completed"])
    avg_progress = sum(a["progress_percentage"] for a in user_assignments) / total_modules if total_modules > 0 else 0
    
    approved_access = len([r for r in user_requests if r["status"] == "approved"])
    total_access = len(user_requests)
    
    return {
        "user": user,
        "team": team,
        "progress": progress,
        "pending_actions": pending_actions,
        "access_requests": user_requests,
        "assigned_modules": user_assignments,
        "repositories": team_repos,
        "progress_summary": {
            "onboarding_status": progress.get("onboarding_status", "not_started"),
            "modules_completed": f"{completed_modules}/{total_modules}",
            "average_progress": round(avg_progress, 1),
            "access_approved": f"{approved_access}/{total_access}",
            "can_access_repos": approved_access == total_access and completed_modules == total_modules
        }
    }

@app.put("/api/v2/engineers/{user_id}/modules/{module_id}/progress")
async def update_module_progress_v2(user_id: str, module_id: str, progress_data: Dict):
    """Update module progress"""
    assignment_key = f"{user_id}_{module_id}"
    
    if assignment_key not in module_assignments_db_v2:
        raise HTTPException(status_code=404, detail="Module assignment not found")
    
    assignment = module_assignments_db_v2[assignment_key]
    assignment["progress_percentage"] = progress_data.get("progress_percentage", assignment["progress_percentage"])
    assignment["time_spent"] = progress_data.get("time_spent", assignment["time_spent"])
    assignment["last_accessed"] = datetime.now().isoformat()
    
    if assignment["progress_percentage"] >= 100:
        assignment["status"] = "completed"
    elif assignment["progress_percentage"] > 0:
        assignment["status"] = "in_progress"
    
    module_assignments_db_v2[assignment_key] = assignment
    save_assignments()  # Save to disk
    
    # Check if all modules completed
    user_assignments = [a for a in module_assignments_db_v2.values() if a["user_id"] == user_id]
    all_completed = all(a["status"] == "completed" for a in user_assignments)
    
    if all_completed:
        team_id = assignment["team_id"]
        progress_key = f"{user_id}_{team_id}"
        if progress_key in engineer_progress_db_v2:
            engineer_progress_db_v2[progress_key]["onboarding_status"] = "completed"
            engineer_progress_db_v2[progress_key]["completed_at"] = datetime.now().isoformat()
            save_progress()  # Save to disk
    
    return {"message": "Progress updated", "assignment": assignment}

@app.get("/api/v2/admin/dashboard")
async def get_admin_dashboard_v2():
    """Get admin dashboard"""
    total_teams = len(teams_db_v2)
    total_engineers = len([u for u in users_db.values() if u["role"] == "engineer"])
    pending_requests = len([r for r in access_requests_db.values() if r["status"] == "pending"])
    active_onboarding = len([p for p in engineer_progress_db_v2.values() if p["onboarding_status"] == "in_progress"])
    
    recent_requests = sorted(access_requests_db.values(), key=lambda x: x.get("requested_at", ""), reverse=True)[:10]
    
    total_assignments = len(module_assignments_db_v2)
    completed_assignments = len([a for a in module_assignments_db_v2.values() if a["status"] == "completed"])
    completion_rate = (completed_assignments / total_assignments * 100) if total_assignments > 0 else 0
    
    return {
        "total_teams": total_teams,
        "total_engineers": total_engineers,
        "pending_access_requests": pending_requests,
        "active_onboarding": active_onboarding,
        "teams": list(teams_db_v2.values()),
        "recent_requests": recent_requests,
        "completion_stats": {
            "total_assignments": total_assignments,
            "completed": completed_assignments,
            "completion_rate": round(completion_rate, 1)
        }
    }

print("✓ Team-based onboarding API endpoints loaded")

# ============= BOB AI CHAT ENDPOINT =============

class CopilotChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None
    role: Optional[str] = None      # "engineer" or "admin"
    page_context: Optional[str] = None  # current page name for context injection

@app.post("/copilot/chat")
async def copilot_chat(request: CopilotChatRequest):
    """
    AI co-pilot endpoint.
    Accepts a natural-language message and returns a helpful response
    grounded in live onboarding platform data.
    No external LLM required for demo — uses a built-in rule-based
    responder that calls real endpoints. Swap with an actual LLM call
    (a foundation model API, OpenAI, etc.) by replacing _resolve_response().
    """

    user_id  = request.user_id or "unknown"
    role     = request.role or "engineer"
    message  = request.message.strip().lower()
    context  = request.page_context or ""

    # --- gather live data for context-aware answers ---
    engineers = [u for u in users_db.values() if u.get("role") == "engineer"]
    pending   = [r for r in access_requests_db.values() if r.get("status") == "pending"]
    critical  = [r for r in pending if r.get("urgency") == "critical"]

    def _resolve_response() -> dict:
        # ── greeting ──────────────────────────────────────────────────
        if any(w in message for w in ["hi", "hello", "hey", "welcome"]):
            if role == "admin":
                return {
                    "reply": (
                        f"Hi! I'm your onboarding co-pilot 👋\n\n"
                        f"Right now there are **{len(pending)} pending access requests** "
                        f"({len(critical)} critical). "
                        f"There are **{len(engineers)} engineers** currently onboarding.\n\n"
                        f"You can ask me things like:\n"
                        f"• *Show me all critical requests*\n"
                        f"• *Approve request req_0001*\n"
                        f"• *How is onboarding going overall?*"
                    ),
                    "type": "greeting"
                }
            else:
                user = users_db.get(user_id, {})
                return {
                    "reply": (
                        f"Hi {user.get('full_name', 'there')}! I'm your onboarding co-pilot 👋\n\n"
                        f"I can help you navigate your onboarding journey. Try asking me:\n"
                        f"• *What modules do I still need to complete?*\n"
                        f"• *What should I start with?*\n"
                        f"• *How do I request GitHub access?*"
                    ),
                    "type": "greeting"
                }

        # ── status report / overall summary ──────────────────────────
        if any(w in message for w in ["status", "summary", "overall", "how is", "report"]):
            if role == "engineer":
                # Personal onboarding status for the engineer
                user = users_db.get(user_id, {})
                user_reqs = [r for r in access_requests_db.values()
                             if r.get("user_id") == user_id]
                my_pending  = [r for r in user_reqs if r.get("status") == "pending"]
                my_approved = [r for r in user_reqs if r.get("status") == "approved"]
                user_progress = [p for p in progress_db.values()
                                 if p.get("user_id") == user_id]
                done      = [p for p in user_progress
                             if p.get("progress_percentage", p.get("completion", 0)) >= 100]
                in_prog   = [p for p in user_progress
                             if 0 < p.get("progress_percentage", p.get("completion", 0)) < 100]
                not_started = [p for p in user_progress
                               if p.get("progress_percentage", p.get("completion", 0)) == 0]
                reply_lines = (
                    f"**Your Onboarding Status** 📊\n\n"
                    f"- Access requests pending: **{len(my_pending)}**\n"
                    f"- Access requests approved: **{len(my_approved)}**\n"
                    f"- Modules completed: **{len(done)}**\n"
                    f"- Modules in progress: **{len(in_prog)}**\n"
                    f"- Modules not started: **{len(not_started)}**\n"
                )
                if my_pending:
                    reply_lines += f"\n⏳ You have **{len(my_pending)}** access request(s) awaiting admin approval."
                if in_prog:
                    reply_lines += f"\n▶ Continue with: **{in_prog[0].get('module_id', 'your current module')}**"
                elif not_started:
                    reply_lines += f"\n▶ Start next: **{not_started[0].get('module_id', 'your next module')}**"
                if not my_pending and not in_prog and not not_started:
                    reply_lines += "\n\n✅ Your onboarding looks complete!"
                return {
                    "reply": reply_lines,
                    "type": "status",
                    "data": {
                        "pending_requests": len(my_pending),
                        "approved_requests": len(my_approved),
                        "modules_done": len(done),
                        "modules_in_progress": len(in_prog),
                        "modules_not_started": len(not_started),
                    }
                }
            else:
                # System-wide summary for admins
                stats = {
                    "total_engineers": len(engineers),
                    "pending_requests": len(pending),
                    "critical_requests": len(critical),
                }
                return {
                    "reply": (
                        f"**Onboarding Platform Status** 📊\n\n"
                        f"- Engineers onboarding: **{stats['total_engineers']}**\n"
                        f"- Pending access requests: **{stats['pending_requests']}**\n"
                        f"- Critical requests: **{stats['critical_requests']}**\n\n"
                        + (f"⚠️ Action needed: {len(critical)} critical requests are waiting for approval."
                           if critical else "✅ No critical requests pending.")
                    ),
                    "type": "status",
                    "data": stats
                }

        # ── list pending / critical requests ─────────────────────────
        if any(w in message for w in ["pending", "request", "approval", "waiting", "critical"]):
            if role == "engineer":
                # Engineers only see their own requests
                user_reqs = [r for r in access_requests_db.values()
                             if r.get("user_id") == user_id]
                show = [r for r in user_reqs if r.get("status") == "pending"]
                if not show:
                    return {
                        "reply": "✅ You have no pending access requests right now.",
                        "type": "requests"
                    }
                lines = "\n".join(
                    f"• **{r.get('id')}** — {r.get('platform', 'N/A')} "
                    f"({r.get('access_type', 'N/A')}) [{r.get('urgency', 'normal')}] "
                    f"— *{r.get('status', 'pending')}*"
                    for r in show[:10]
                )
                return {
                    "reply": f"**Your {len(show)} pending access request(s):**\n\n{lines}",
                    "type": "requests",
                    "data": show[:10]
                }
            else:
                # Admins see all pending / critical requests
                show = critical if "critical" in message else pending
                label = "critical" if "critical" in message else "pending"
                if not show:
                    return {"reply": f"✅ No {label} access requests right now.", "type": "requests"}
                lines = "\n".join(
                    f"• **{r.get('id')}** — {r.get('user_id', 'unknown')} → "
                    f"{r.get('platform', 'N/A')} ({r.get('access_type', 'N/A')}) "
                    f"[{r.get('urgency', 'normal')}]"
                    for r in show[:10]
                )
                return {
                    "reply": f"**{len(show)} {label} access requests:**\n\n{lines}",
                    "type": "requests",
                    "data": show[:10]
                }

        # ── approve a specific request (admin only) ───────────────────
        if "approve" in message:
            if role != "admin":
                return {
                    "reply": "Only admins can approve access requests. If you're waiting on an approval, ask your admin or check the Access Requests page.",
                    "type": "info"
                }
            # extract req id if present: "approve req_0001"
            match = re.search(r"req_\w+", message)
            if match:
                rid = match.group()
                if rid in access_requests_db:
                    access_requests_db[rid]["status"] = "approved"
                    access_requests_db[rid]["admin_notes"] = "Approved via AI co-pilot"
                    access_requests_db[rid]["updated_at"] = datetime.now().isoformat()
                    save_access_requests()
                    return {
                        "reply": f"✅ Request **{rid}** has been approved.",
                        "type": "action",
                        "action": "approved",
                        "request_id": rid
                    }
                else:
                    return {"reply": f"I couldn't find request `{rid}`. Check the request ID and try again.", "type": "error"}
            # bulk approve critical
            if "critical" in message and critical:
                approved = []
                for r in critical:
                    rid = r["id"]
                    access_requests_db[rid]["status"] = "approved"
                    access_requests_db[rid]["admin_notes"] = "Bulk approved via AI co-pilot"
                    access_requests_db[rid]["updated_at"] = datetime.now().isoformat()
                    approved.append(rid)
                save_access_requests()
                return {
                    "reply": f"✅ Approved **{len(approved)} critical** request(s): {', '.join(approved)}",
                    "type": "action",
                    "action": "bulk_approved",
                    "approved_ids": approved
                }
            return {"reply": "Please specify a request ID (e.g. *approve req_0001*) or say *approve all critical requests*.", "type": "info"}

        # ── engineer's own progress ───────────────────────────────────
        if any(w in message for w in ["progress", "module", "complete", "finish", "learning", "path", "start"]):
            user_progress = [p for p in progress_db.values() if p.get("user_id") == user_id]
            done   = [p for p in user_progress if p.get("progress_percentage", p.get("completion", 0)) >= 100]
            in_prog = [p for p in user_progress if 0 < p.get("progress_percentage", p.get("completion", 0)) < 100]
            not_started = [p for p in user_progress if p.get("progress_percentage", p.get("completion", 0)) == 0]

            if not user_progress:
                return {
                    "reply": (
                        "You don't have any modules assigned yet. Ask your admin to assign you to a team, "
                        "which will automatically set up your learning path 🚀"
                    ),
                    "type": "progress"
                }
            lines = (
                f"- ✅ Completed: **{len(done)}**\n"
                f"- 🔄 In progress: **{len(in_prog)}**\n"
                f"- ⏳ Not started: **{len(not_started)}**\n"
            )
            if in_prog:
                next_mod = in_prog[0]
                lines += f"\n▶ Continue with: **{next_mod.get('module_id', 'your current module')}**"
            elif not_started:
                next_mod = not_started[0]
                lines += f"\n▶ Start next: **{next_mod.get('module_id', 'your next module')}**"
            return {"reply": f"**Your Learning Progress:**\n\n{lines}", "type": "progress", "data": user_progress}

        # ── access request help ───────────────────────────────────────
        if any(w in message for w in ["github", "cloud", "artifactory", "jira", "access hub"]):
            return {
                "reply": (
                    "To request access to a platform:\n\n"
                    "1. Click **Access Requests** in the top navigation\n"
                    "2. Click **New Request**\n"
                    "3. Select the platform (GitHub, Cloud Platform, Artifactory, Jira, Access Hub)\n"
                    "4. Choose access type and urgency\n"
                    "5. Add a justification and submit\n\n"
                    "Your admin will be notified and can approve it from the Admin Dashboard."
                ),
                "type": "help"
            }

        # ── fallback ──────────────────────────────────────────────────
        suggestions = (
            ["*Show pending requests*, *Approve req_0001*, *Status report*"]
            if role == "admin" else
            ["*My progress*, *What should I start with?*, *How do I request GitHub access?*"]
        )
        return {
            "reply": (
                f"I'm not sure how to help with that yet. Here are some things I can do:\n\n"
                f"{suggestions[0]}"
            ),
            "type": "fallback"
        }

    result = _resolve_response()
    return {
        "message": result["reply"],
        "type": result.get("type", "info"),
        "data": result.get("data"),
        "timestamp": datetime.now().isoformat()
    }


# Run the application
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)

