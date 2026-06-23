"""
Enhanced API Endpoints for Team-Based Access Management
Extends main.py with team, repo, and learning assignment features
"""
from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Optional
from datetime import datetime
import json

# Import models from models.py
from models import (
    Team, TeamAccessRequirement, Repository, LearningModule,
    TeamConfiguration, EngineerProgress, AccessRequestExtended,
    ModuleAssignment, UserExtended, EngineerDashboard, AdminDashboard
)

# Create router
router = APIRouter(prefix="/api/v2", tags=["enhanced"])

# In-memory storage (will be replaced with Cloudant)
teams_db = {}
repositories_db = {}
learning_modules_db = {}
team_configs_db = {}
engineer_progress_db = {}
module_assignments_db = {}

# Initialize sample data
def initialize_sample_data():
    """Initialize sample teams, repos, and modules"""
    
    # Sample Teams
    teams_db["team_backend"] = {
        "id": "team_backend",
        "name": "Backend Engineering",
        "description": "Backend development team working on microservices",
        "department": "Engineering",
        "created_at": datetime.now().isoformat(),
        "created_by": "admin"
    }
    
    teams_db["team_frontend"] = {
        "id": "team_frontend",
        "name": "Frontend Engineering",
        "description": "Frontend development team working on React applications",
        "department": "Engineering",
        "created_at": datetime.now().isoformat(),
        "created_by": "admin"
    }
    
    # Sample Repositories
    repositories_db["repo_api_gateway"] = {
        "id": "repo_api_gateway",
        "name": "api-gateway",
        "url": "https://github.com/company/api-gateway",
        "team_id": "team_backend",
        "language": "python",
        "description": "Main API Gateway service",
        "created_at": datetime.now().isoformat()
    }
    
    repositories_db["repo_user_service"] = {
        "id": "repo_user_service",
        "name": "user-service",
        "url": "https://github.com/company/user-service",
        "team_id": "team_backend",
        "language": "java",
        "description": "User management microservice",
        "created_at": datetime.now().isoformat()
    }
    
    repositories_db["repo_frontend_app"] = {
        "id": "repo_frontend_app",
        "name": "frontend-app",
        "url": "https://github.com/company/frontend-app",
        "team_id": "team_frontend",
        "language": "javascript",
        "description": "Main React frontend application",
        "created_at": datetime.now().isoformat()
    }
    
    # Sample Learning Modules
    learning_modules_db["module_python_basics"] = {
        "id": "module_python_basics",
        "title": "Python Fundamentals",
        "description": "Learn Python basics for backend development",
        "content": "<h2>Python Basics</h2><p>Introduction to Python programming...</p>",
        "language": "python",
        "difficulty": "beginner",
        "estimated_duration": 45,
        "prerequisites": [],
        "learning_objectives": [
            "Understand Python syntax",
            "Work with data structures",
            "Write functions and classes"
        ],
        "created_at": datetime.now().isoformat()
    }
    
    learning_modules_db["module_fastapi"] = {
        "id": "module_fastapi",
        "title": "FastAPI Development",
        "description": "Build REST APIs with FastAPI",
        "content": "<h2>FastAPI</h2><p>Learn to build modern APIs...</p>",
        "language": "python",
        "difficulty": "intermediate",
        "estimated_duration": 60,
        "prerequisites": ["module_python_basics"],
        "learning_objectives": [
            "Create REST APIs",
            "Handle authentication",
            "Write API documentation"
        ],
        "created_at": datetime.now().isoformat()
    }
    
    learning_modules_db["module_react_basics"] = {
        "id": "module_react_basics",
        "title": "React Fundamentals",
        "description": "Learn React for frontend development",
        "content": "<h2>React Basics</h2><p>Introduction to React...</p>",
        "language": "javascript",
        "difficulty": "beginner",
        "estimated_duration": 50,
        "prerequisites": [],
        "learning_objectives": [
            "Understand React components",
            "Manage state with hooks",
            "Build interactive UIs"
        ],
        "created_at": datetime.now().isoformat()
    }
    
    learning_modules_db["module_java_spring"] = {
        "id": "module_java_spring",
        "title": "Spring Boot Microservices",
        "description": "Build microservices with Spring Boot",
        "content": "<h2>Spring Boot</h2><p>Learn Spring Boot...</p>",
        "language": "java",
        "difficulty": "intermediate",
        "estimated_duration": 90,
        "prerequisites": [],
        "learning_objectives": [
            "Create Spring Boot applications",
            "Implement REST controllers",
            "Configure microservices"
        ],
        "created_at": datetime.now().isoformat()
    }
    
    # Team Configurations
    team_configs_db["team_backend"] = {
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
    }
    
    team_configs_db["team_frontend"] = {
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

# Initialize on module load
initialize_sample_data()

# ============= TEAM MANAGEMENT ENDPOINTS =============

@router.post("/teams", status_code=status.HTTP_201_CREATED)
async def create_team(team: Team):
    """Admin creates a new team"""
    if team.id in teams_db:
        raise HTTPException(status_code=400, detail="Team already exists")
    
    team.created_at = datetime.now().isoformat()
    teams_db[team.id] = team.dict()
    
    # Initialize empty team configuration
    team_configs_db[team.id] = {
        "team_id": team.id,
        "access_requirements": [],
        "repositories": [],
        "required_modules": [],
        "auto_assigned_modules": []
    }
    
    return team

@router.get("/teams")
async def get_all_teams():
    """Get all teams"""
    return {"teams": list(teams_db.values()), "count": len(teams_db)}

@router.get("/teams/{team_id}")
async def get_team(team_id: str):
    """Get team details"""
    if team_id not in teams_db:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team = teams_db[team_id]
    config = team_configs_db.get(team_id, {})
    
    # Get team members
    from main import users_db
    members = [u for u in users_db.values() if u.get("team_id") == team_id]
    
    return {
        "team": team,
        "configuration": config,
        "members": members,
        "member_count": len(members)
    }

@router.put("/teams/{team_id}/configuration")
async def update_team_configuration(team_id: str, config: TeamConfiguration):
    """Update team configuration (access requirements, repos, modules)"""
    if team_id not in teams_db:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team_configs_db[team_id] = config.dict()
    return {"message": "Team configuration updated", "configuration": config}

# ============= REPOSITORY MANAGEMENT ENDPOINTS =============

@router.post("/repositories", status_code=status.HTTP_201_CREATED)
async def create_repository(repo: Repository):
    """Admin creates a new repository"""
    if repo.id in repositories_db:
        raise HTTPException(status_code=400, detail="Repository already exists")
    
    if repo.team_id not in teams_db:
        raise HTTPException(status_code=404, detail="Team not found")
    
    repo.created_at = datetime.now().isoformat()
    repositories_db[repo.id] = repo.dict()
    return repo

@router.get("/repositories")
async def get_all_repositories():
    """Get all repositories"""
    return {"repositories": list(repositories_db.values()), "count": len(repositories_db)}

@router.get("/repositories/team/{team_id}")
async def get_team_repositories(team_id: str):
    """Get repositories for a specific team"""
    team_repos = [r for r in repositories_db.values() if r["team_id"] == team_id]
    return {"repositories": team_repos, "count": len(team_repos)}

# ============= LEARNING MODULE ENDPOINTS =============

@router.post("/modules", status_code=status.HTTP_201_CREATED)
async def create_learning_module(module: LearningModule):
    """Admin creates a new learning module"""
    if module.id in learning_modules_db:
        raise HTTPException(status_code=400, detail="Module already exists")
    
    module.created_at = datetime.now().isoformat()
    learning_modules_db[module.id] = module.dict()
    return module

@router.get("/modules")
async def get_all_modules():
    """Get all learning modules"""
    return {"modules": list(learning_modules_db.values()), "count": len(learning_modules_db)}

@router.get("/modules/language/{language}")
async def get_modules_by_language(language: str):
    """Get modules for a specific programming language"""
    lang_modules = [m for m in learning_modules_db.values() if m.get("language") == language]
    return {"modules": lang_modules, "count": len(lang_modules)}

# ============= ENGINEER ONBOARDING ENDPOINTS =============

@router.post("/engineers/{user_id}/assign-team/{team_id}")
async def assign_engineer_to_team(user_id: str, team_id: str):
    """Assign engineer to team and trigger onboarding workflow"""
    from main import users_db, access_requests_db
    
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    if team_id not in teams_db:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Update user's team
    users_db[user_id]["team_id"] = team_id
    
    # Initialize engineer progress
    progress_key = f"{user_id}_{team_id}"
    engineer_progress_db[progress_key] = {
        "user_id": user_id,
        "team_id": team_id,
        "onboarding_status": "in_progress",
        "access_status": {},
        "module_progress": {},
        "repo_access": [],
        "started_at": datetime.now().isoformat(),
        "last_updated": datetime.now().isoformat()
    }
    
    # Get team configuration
    team_config = team_configs_db.get(team_id, {})
    
    # Create access requests based on team requirements
    created_requests = []
    for access_req in team_config.get("access_requirements", []):
        request_id = f"req_{len(access_requests_db) + 1:04d}"
        request_data = {
            "id": request_id,
            "user_id": user_id,
            "team_id": team_id,
            "platform": access_req["platform"],
            "access_type": access_req["access_type"],
            "justification": f"Required for {teams_db[team_id]['name']} team membership",
            "urgency": "high" if access_req["required"] else "normal",
            "status": "approved" if access_req.get("auto_approve") else "pending",
            "requested_at": datetime.now().isoformat(),
            "admin_notes": "Auto-generated from team requirements"
        }
        access_requests_db[request_id] = request_data
        created_requests.append(request_data)
        
        # Update progress
        engineer_progress_db[progress_key]["access_status"][access_req["platform"]] = request_data["status"]
    
    # Assign learning modules
    assigned_modules = []
    
    # Required modules for all team members
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
        module_assignments_db[assignment_key] = assignment
        assigned_modules.append(assignment)
    
    # Auto-assigned modules based on repo languages
    repo_languages = set()
    for repo_id in team_config.get("repositories", []):
        if repo_id in repositories_db:
            repo_languages.add(repositories_db[repo_id]["language"])
    
    for language in repo_languages:
        lang_modules = [m for m in learning_modules_db.values() if m.get("language") == language]
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
                module_assignments_db[assignment_key] = assignment
                assigned_modules.append(assignment)
    
    return {
        "message": f"Engineer assigned to {teams_db[team_id]['name']}",
        "team": teams_db[team_id],
        "access_requests_created": len(created_requests),
        "modules_assigned": len(assigned_modules),
        "next_steps": [
            "Complete pending access requests",
            "Start required learning modules",
            "Review team repositories"
        ]
    }

@router.get("/engineers/{user_id}/dashboard")
async def get_engineer_dashboard(user_id: str):
    """Get complete engineer dashboard with all onboarding info"""
    from main import users_db, access_requests_db
    
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = users_db[user_id]
    team_id = user.get("team_id")
    
    # Get team info
    team = teams_db.get(team_id) if team_id else None
    
    # Get progress
    progress_key = f"{user_id}_{team_id}" if team_id else None
    progress = engineer_progress_db.get(progress_key, {})
    
    # Get access requests
    user_requests = [r for r in access_requests_db.values() if r["user_id"] == user_id]
    
    # Get assigned modules
    user_assignments = [a for a in module_assignments_db.values() if a["user_id"] == user_id]
    
    # Get repositories
    team_repos = []
    if team_id and team_id in team_configs_db:
        repo_ids = team_configs_db[team_id].get("repositories", [])
        team_repos = [repositories_db[rid] for rid in repo_ids if rid in repositories_db]
    
    # Calculate pending actions
    pending_actions = []
    
    # Pending access requests
    pending_requests = [r for r in user_requests if r["status"] == "pending"]
    if pending_requests:
        pending_actions.append({
            "type": "access_request",
            "count": len(pending_requests),
            "message": f"{len(pending_requests)} access request(s) pending approval"
        })
    
    # Incomplete modules
    incomplete_modules = [a for a in user_assignments if a["status"] != "completed"]
    if incomplete_modules:
        pending_actions.append({
            "type": "learning",
            "count": len(incomplete_modules),
            "message": f"{len(incomplete_modules)} learning module(s) to complete"
        })
    
    # Progress summary
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

@router.put("/engineers/{user_id}/modules/{module_id}/progress")
async def update_module_progress(user_id: str, module_id: str, progress_data: Dict):
    """Update engineer's progress on a learning module"""
    assignment_key = f"{user_id}_{module_id}"
    
    if assignment_key not in module_assignments_db:
        raise HTTPException(status_code=404, detail="Module assignment not found")
    
    assignment = module_assignments_db[assignment_key]
    
    # Update progress
    assignment["progress_percentage"] = progress_data.get("progress_percentage", assignment["progress_percentage"])
    assignment["time_spent"] = progress_data.get("time_spent", assignment["time_spent"])
    assignment["last_accessed"] = datetime.now().isoformat()
    
    # Update status based on progress
    if assignment["progress_percentage"] >= 100:
        assignment["status"] = "completed"
    elif assignment["progress_percentage"] > 0:
        assignment["status"] = "in_progress"
    
    module_assignments_db[assignment_key] = assignment
    
    # Check if all modules are completed to update onboarding status
    user_assignments = [a for a in module_assignments_db.values() if a["user_id"] == user_id]
    all_completed = all(a["status"] == "completed" for a in user_assignments)
    
    if all_completed:
        # Update engineer progress
        team_id = assignment["team_id"]
        progress_key = f"{user_id}_{team_id}"
        if progress_key in engineer_progress_db:
            engineer_progress_db[progress_key]["onboarding_status"] = "completed"
            engineer_progress_db[progress_key]["completed_at"] = datetime.now().isoformat()
    
    return {"message": "Progress updated", "assignment": assignment}

# ============= ADMIN DASHBOARD ENDPOINTS =============

@router.get("/admin/dashboard")
async def get_admin_dashboard():
    """Get comprehensive admin dashboard"""
    from main import users_db, access_requests_db
    
    # Calculate statistics
    total_teams = len(teams_db)
    total_engineers = len([u for u in users_db.values() if u["role"] == "engineer"])
    pending_requests = len([r for r in access_requests_db.values() if r["status"] == "pending"])
    active_onboarding = len([p for p in engineer_progress_db.values() if p["onboarding_status"] == "in_progress"])
    
    # Get recent requests
    recent_requests = sorted(
        access_requests_db.values(),
        key=lambda x: x.get("requested_at", ""),
        reverse=True
    )[:10]
    
    # Completion stats
    total_assignments = len(module_assignments_db)
    completed_assignments = len([a for a in module_assignments_db.values() if a["status"] == "completed"])
    completion_rate = (completed_assignments / total_assignments * 100) if total_assignments > 0 else 0
    
    return {
        "total_teams": total_teams,
        "total_engineers": total_engineers,
        "pending_access_requests": pending_requests,
        "active_onboarding": active_onboarding,
        "teams": list(teams_db.values()),
        "recent_requests": recent_requests,
        "completion_stats": {
            "total_assignments": total_assignments,
            "completed": completed_assignments,
            "completion_rate": round(completion_rate, 1)
        }
    }

@router.get("/admin/teams/{team_id}/members")
async def get_team_members_progress(team_id: str):
    """Get all team members with their progress"""
    from main import users_db
    
    if team_id not in teams_db:
        raise HTTPException(status_code=404, detail="Team not found")
    
    members = [u for u in users_db.values() if u.get("team_id") == team_id]
    members_with_progress = []
    
    for member in members:
        progress_key = f"{member['id']}_{team_id}"
        progress = engineer_progress_db.get(progress_key, {})
        
        # Get module assignments
        assignments = [a for a in module_assignments_db.values() if a["user_id"] == member["id"]]
        completed = len([a for a in assignments if a["status"] == "completed"])
        
        members_with_progress.append({
            "user": member,
            "progress": progress,
            "modules_completed": f"{completed}/{len(assignments)}",
            "onboarding_status": progress.get("onboarding_status", "not_started")
        })
    
    return {
        "team": teams_db[team_id],
        "members": members_with_progress,
        "total_members": len(members)
    }

# Made with Bob
