"""
Enhanced Data Models for Team-Based Access Management System
"""
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Optional
from datetime import datetime

# Team Management Models
class Team(BaseModel):
    id: str
    name: str
    description: str
    department: str
    created_at: Optional[str] = None
    created_by: Optional[str] = None  # admin user_id

class TeamAccessRequirement(BaseModel):
    platform: str  # github, cloud_platform, artifactory, jira, access_hub
    access_type: str  # read, write, admin
    required: bool = True
    auto_approve: bool = False

class Repository(BaseModel):
    id: str
    name: str
    url: str
    team_id: str
    language: str  # python, javascript, java, etc.
    description: Optional[str] = None
    created_at: Optional[str] = None

class LearningModule(BaseModel):
    id: str
    title: str
    description: str
    content: str
    language: Optional[str] = None  # programming language this module is for
    difficulty: str = "beginner"  # beginner, intermediate, advanced
    estimated_duration: int = 30  # minutes
    prerequisites: List[str] = []
    learning_objectives: List[str] = []
    created_at: Optional[str] = None

class TeamConfiguration(BaseModel):
    team_id: str
    access_requirements: List[TeamAccessRequirement]
    repositories: List[str]  # repo IDs
    required_modules: List[str]  # module IDs that all team members must complete
    auto_assigned_modules: List[str]  # modules auto-assigned based on repos

class EngineerProgress(BaseModel):
    user_id: str
    team_id: str
    onboarding_status: str = "not_started"  # not_started, in_progress, completed
    access_status: Dict[str, str] = {}  # platform -> status
    module_progress: Dict[str, int] = {}  # module_id -> percentage
    repo_access: List[str] = []  # list of repo IDs engineer has access to
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    last_updated: Optional[str] = None

class AccessRequestExtended(BaseModel):
    id: Optional[str] = None
    user_id: str
    team_id: Optional[str] = None
    platform: str
    access_type: str
    justification: str
    urgency: str = "normal"  # low, normal, high, critical
    status: str = "pending"  # pending, approved, rejected, provisioned
    requested_at: Optional[str] = None
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None
    admin_notes: Optional[str] = None

class ModuleAssignment(BaseModel):
    user_id: str
    module_id: str
    team_id: str
    assigned_reason: str  # "team_required", "repo_based", "manual"
    assigned_at: str
    due_date: Optional[str] = None
    status: str = "not_started"  # not_started, in_progress, completed
    progress_percentage: int = 0
    score: Optional[int] = None
    time_spent: int = 0  # minutes
    last_accessed: Optional[str] = None

class UserExtended(BaseModel):
    id: str
    username: str
    full_name: str
    email: EmailStr
    department: str
    role: str = "engineer"  # engineer, admin, manager
    team_id: Optional[str] = None
    manager_id: Optional[str] = None
    created_at: Optional[str] = None
    onboarding_completed: bool = False

# Dashboard Models
class EngineerDashboard(BaseModel):
    user: UserExtended
    team: Optional[Team] = None
    pending_actions: List[Dict] = []  # actions engineer needs to take
    access_requests: List[AccessRequestExtended] = []
    assigned_modules: List[ModuleAssignment] = []
    progress_summary: Dict = {}
    repositories: List[Repository] = []

class AdminDashboard(BaseModel):
    total_teams: int
    total_engineers: int
    pending_access_requests: int
    active_onboarding: int
    teams: List[Team] = []
    recent_requests: List[AccessRequestExtended] = []
    completion_stats: Dict = {}

