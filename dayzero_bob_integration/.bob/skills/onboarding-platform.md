---
name: onboarding-platform
description: >
  Expert on the Onboarding Platform — a FastAPI + React application
  for automating new-engineer onboarding. Knows the full API contract,
  data models, team/module/access-request architecture, and the AI
  co-pilot integration. Activate this skill when working on any file
  in this repository.
triggers:
  - onboarding
  - access request
  - assign engineer
  - team management
  - learning module
  - ai copilot
  - copilot chat
  - mcp server
---

# Onboarding Platform — AI Skill

## What This Project Does
A web platform that automates onboarding for new engineers:
- Admins create **teams** and link **repositories** to them
- Assigning an engineer to a team auto-creates access requests and assigns learning modules
- Engineers track progress, take quizzes, and request platform access
- **AI co-pilot** is embedded in the running app as a chat widget

## Tech Stack
- **Backend**: FastAPI (Python 3.14), JWT auth, flat-file JSON persistence via `db_manager.py`
- **Frontend**: React 18 + Vite, React Router, Recharts, Lucide icons, Axios
- **Backend port**: 8080 | **Frontend port**: 3000

## Key Files
| File | Purpose |
|------|---------|
| `backend/main.py` | All FastAPI endpoints (~1600 lines) |
| `backend/ai_mcp_server.py` | MCP stdio server exposing 7 AI tools |
| `backend/enhanced_api.py` | Team/repo/module router (mounted at `/api/v2`) |
| `backend/db_manager.py` | JSON file persistence helper |
| `backend/models.py` | Pydantic models for v2 endpoints |
| `frontend/src/App.jsx` | Root router, auth state |
| `frontend/src/components/AICopilot.jsx` | Floating chat widget |
| `frontend/src/services/api.js` | Axios wrappers for all endpoints |
| `.bob/context/session-context.md` | Cross-session continuity log |

## API Routes (key ones)
```
POST /auth/login                              Login, returns JWT
POST /auth/register                           Register new user
GET  /learning/modules                        List all modules
POST /learning/progress/{user_id}/{module_id} Update progress
GET  /access/requests                         All access requests (admin)
POST /access/requests                         Create request
PUT  /access/requests/{id}                    Approve / reject
GET  /admin/stats                             System stats
GET  /admin/users                             All users
POST /api/v2/teams                            Create team
GET  /api/v2/teams                            List teams
POST /api/v2/engineers/{uid}/assign-team/{tid} Assign engineer
GET  /api/v2/engineers/{uid}/dashboard        Engineer dashboard
POST /copilot/chat                            AI co-pilot chat
```

## Data Models (simplified)
```python
# User
{ id, username, full_name, email, department, role: "engineer"|"admin", team_id }

# AccessRequest
{ id, user_id, platform, access_type, urgency, justification, status, admin_notes }

# LearningProgress (progress_db)
{ user_id, module_id, progress_percentage, status, time_spent, last_accessed }

# Team (teams_db_v2)
{ id, name, description, department, created_at }

# TeamConfig (team_configs_db_v2)
{ team_id, access_requirements[], repositories[], required_modules[], auto_assigned_modules[] }
```

## AI Co-pilot Integration

### Backend (`backend/main.py` — `POST /copilot/chat`)
- Accepts `{ message, user_id, role, page_context }`
- Rule-based resolver queries live `users_db`, `access_requests_db`, `progress_db`
- Returns `{ message, type, data, timestamp }`
- **To upgrade to a real LLM**: replace `_resolve_response()` body with a
  foundation model API or `openai.chat.completions.create()` call, passing the same
  live data as system context.

### Frontend (`frontend/src/components/AICopilot.jsx`)
- Floating chat bubble (bottom-right, `position: fixed`)
- Renders markdown-lite (bold, italic, bullets)
- Page-aware: passes `pageContext` prop so the co-pilot answers differently on admin vs engineer pages
- Added to `App.jsx` so it appears on every authenticated page

### MCP Server (`backend/ai_mcp_server.py`)
- Implements MCP 2024-11-05 protocol over stdio (no external SDK)
- 7 tools: `get_engineer_progress`, `list_pending_access_requests`,
  `approve_access_request`, `reject_access_request`, `assign_engineer_to_team`,
  `get_system_summary`, `generate_learning_path`
- Register in IDE MCP settings: `python backend/ai_mcp_server.py` as a local stdio MCP server

## Demo Accounts
| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Engineer | john_doe | password123 |

## Common Tasks (in IDE)
- "Add a new MCP tool that lists all teams" → add to `ai_mcp_server.py`'s `TOOLS` list and `call_tool()`
- "Add a `/copilot/chat` intent for quiz results" → extend `_resolve_response()` in `main.py`
- "Style the chat panel to match a modern design system" → edit `AICopilot.jsx`
- "Replace rule-based resolver with a foundation model" → swap `_resolve_response()` in `main.py`
