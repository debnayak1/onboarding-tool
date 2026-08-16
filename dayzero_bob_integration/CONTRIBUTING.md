# Contributing & Quick Start

## Run Locally

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```
API: http://localhost:8080 · Swagger: http://localhost:8080/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App: http://localhost:3000

### One-command shortcuts
```bash
./start-backend.sh    # terminal 1
./start-frontend.sh   # terminal 2
```

---

## Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Engineer | `john_doe` | `password123` |

---

## Project Structure

```
├── backend/
│   ├── main.py              # All FastAPI endpoints (~1600 lines)
│   ├── enhanced_api.py      # Team/repo/module router (/api/v2)
│   ├── ai_mcp_server.py     # MCP stdio server — IDE tools
│   ├── db_manager.py        # JSON file persistence
│   ├── models.py            # Pydantic models (v2 endpoints)
│   ├── data/                # Persisted JSON files
│   └── requirements.txt
├── frontend/src/
│   ├── pages/               # AdminDashboard, EngineerDashboard, Login, …
│   ├── components/
│   │   ├── Header.jsx
│   │   └── AICopilot.jsx    # Floating AI chat widget
│   └── services/api.js      # Axios wrappers for all endpoints
├── .bob/
│   ├── skills/onboarding-platform.md   # Codebase skill for AI sessions
│   └── context/session-context.md      # Cross-session handoff doc
└── README.md
```

---

## AI Co-pilot

### In-app chat
The floating chat bubble (bottom-right) is live on every page. Talks to `POST /copilot/chat` on the backend.

### MCP server (IDE integration)
Exposes 7 tools the IDE assistant can call:
```bash
python backend/ai_mcp_server.py   # runs MCP stdio server
```
Register in your IDE MCP settings:
```json
{ "name": "onboarding-platform", "transport": "stdio",
  "command": "python", "args": ["backend/ai_mcp_server.py"] }
```

### Upgrade to a real LLM
Replace `_resolve_response()` in [`backend/main.py`](backend/main.py) with a
foundation model API or `openai.chat.completions.create()` call.
The live data context (users, requests, progress) is already assembled above that function.

---

## Key API Endpoints

| Method | Path | What it does |
|--------|------|-------------|
| `POST` | `/auth/login` | Login → JWT |
| `GET`  | `/learning/modules` | List modules |
| `GET`  | `/access/requests` | All access requests (admin) |
| `PUT`  | `/access/requests/{id}` | Approve / reject |
| `GET`  | `/admin/stats` | System stats |
| `POST` | `/api/v2/engineers/{uid}/assign-team/{tid}` | Assign engineer → triggers workflow |
| `GET`  | `/api/v2/engineers/{uid}/dashboard` | Engineer dashboard data |
| `POST` | `/copilot/chat` | AI co-pilot chat |

---

## Cross-session Continuity

Read [`.bob/context/session-context.md`](.bob/context/session-context.md) at the start of every AI session.
Update it at the end — record what changed and what's next.
