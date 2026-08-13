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
│   ├── bob_mcp_server.py    # MCP stdio server — Bob IDE tools
│   ├── db_manager.py        # JSON file persistence
│   ├── models.py            # Pydantic models (v2 endpoints)
│   ├── data/                # Persisted JSON files
│   └── requirements.txt
├── frontend/src/
│   ├── pages/               # AdminDashboard, EngineerDashboard, Login, …
│   ├── components/
│   │   ├── Header.jsx
│   │   └── BobCopilot.jsx   # Floating Bob chat widget
│   └── services/api.js      # Axios wrappers for all endpoints
├── .bob/
│   ├── skills/onboarding-platform.md   # Bob codebase skill
│   └── context/session-context.md      # Cross-session handoff doc
└── README.md
```

---

## Bob AI Co-pilot

### In-app chat
The floating chat bubble (bottom-right) is live on every page. Talks to `POST /bob/chat` on the backend.

### MCP server (Bob IDE)
Exposes 7 tools Bob can call from the IDE editor:
```bash
python backend/bob_mcp_server.py   # runs MCP stdio server
```
Register in Bob IDE settings:
```json
{ "name": "onboarding-platform", "transport": "stdio",
  "command": "python", "args": ["backend/bob_mcp_server.py"] }
```

### Upgrade to a real LLM
Replace `_resolve_response()` in [`backend/main.py`](backend/main.py) with a
`watsonx.ai` or `openai.chat.completions.create()` call.
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
| `POST` | `/bob/chat` | Bob co-pilot chat |

---

## Cross-session Continuity

Read [`.bob/context/session-context.md`](.bob/context/session-context.md) at the start of every Bob session.
Update it at the end — record what changed and what's next.
