# AI Session Context — Onboarding Platform
> **Purpose**: This file is the handoff document between AI sessions.
> Read it first at the start of every session. Update it last before closing.
> Keep it factual and concise — no speculation.

---

## Project Snapshot
- **Repo**: `dayzero_bob_integration`
- **Goal**: AI co-pilot embedded as a live assistant inside the running Onboarding Platform

---

## Stack
| Layer | Tech | Port |
|-------|------|------|
| Backend | FastAPI (`backend/main.py` ~1600 lines) + `enhanced_api.py` (v2 router) | 8080 |
| Frontend | React 18 + Vite | 3000 |
| Storage | `db_manager.py` (JSONDatabase) writing to `backend/data/*.json` — **no real DB** |

Demo credentials: **admin / `admin123`**, **engineer `john_doe` / `password123`**

---

## What Was Completed (all sessions combined)

### Backend
| Item | File | Status |
|------|------|--------|
| AI MCP Server — 7 tools (pure stdlib, stdio) | `backend/ai_mcp_server.py` | ✅ Done |
| `POST /copilot/chat` endpoint + rule-based resolver | `backend/main.py` lines 1386–end | ✅ Done |
| `import re` added to `main.py` | `backend/main.py` | ✅ Done |

**`/copilot/chat` intents currently handled**:
- greeting, status report
- list pending / critical requests
- single-request approval (`approve request <id>`)
- bulk-critical approval (`approve all critical`)
- engineer progress (`progress for <user_id>`)
- access-request help (GitHub, Cloud Platform, Artifactory, Jira)
- fallback

**MCP tools**:
`get_engineer_progress`, `list_pending_access_requests`, `approve_access_request`,
`reject_access_request`, `assign_engineer_to_team`, `get_system_summary`, `generate_learning_path`

### Frontend
| Item | File | Status |
|------|------|--------|
| `chatWithCopilot()` API helper | `frontend/src/services/api.js` | ✅ Done |
| `AICopilot.jsx` — floating chat widget (bottom-right, `position: fixed`) | `frontend/src/components/AICopilot.jsx` | ✅ Done |
| AI co-pilot wired globally via `AICopilotWrapper` (uses `useLocation`) | `frontend/src/App.jsx` | ✅ Done |

### IDE Integration
| Item | File | Status |
|------|------|--------|
| MCP server registered in IDE config | `.bob/mcp.json` | ✅ Done |
| Custom codebase skill | `.bob/skills/onboarding-platform.md` | ✅ Done |
| MCP server smoke-tested (initialize + tools/list) | `backend/ai_mcp_server.py` | ✅ Done |

---

## Known Issues
1. **`main.py` syntax quirk** — the `if __name__` block around line 1382 has `uvicorn.run` split across lines; the `/copilot/chat` endpoint was inserted before `port = int(...)`. File runs correctly.
2. **Separate progress stores** — `progress_db` (v1, in-memory) and `engineer_progress_db_v2` (v2, persisted via `db_manager.py`) are **not the same store**. The `/copilot/chat` resolver queries `progress_db`. If an engineer's progress was recorded via the v2 dashboard it will be in `engineer_progress_db_v2`.
3. **MCP server dependency on backend** — `ai_mcp_server.py` calls `http://localhost:8080`. Tools return `{"error": "..."}` gracefully when backend is down.

---

## Key Files
```
backend/
  main.py                    ← ALL v1 endpoints; /copilot/chat at line 1386
  ai_mcp_server.py           ← MCP stdio server, 7 tools, pure stdlib
  db_manager.py              ← JSONDatabase persistence layer
  Dockerfile                 ← for container deployment
frontend/src/
  App.jsx                    ← routing + AICopilotWrapper (global AI widget)
  services/api.js            ← axios wrappers incl. chatWithCopilot()
  components/AICopilot.jsx   ← floating chat widget component
.bob/
  mcp.json                   ← MCP server registration
  context/session-context.md ← this file
  skills/onboarding-platform.md   ← full codebase skill for IDE sessions
README.md                    ← AI integration section at top
```

---

## Quick Test Commands
```bash
# Start backend
cd backend && uvicorn main:app --port 8080 --reload

# Test AI chat endpoint
curl -X POST http://localhost:8080/copilot/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello","user_id":"admin","role":"admin"}'

# Run MCP server (for IDE connection)
python backend/ai_mcp_server.py
```

---

## Next Priority Tasks
| Priority | Task | Notes |
|----------|------|-------|
| **High** | Replace rule-based resolver with real LLM | Swap `_resolve_response()` in `main.py` (~line 1413) with a foundation model API call; live data context already assembled above it — ~20 lines of code |
| **High** | End-to-end demo test | Start backend + frontend, login as admin + engineer, exercise all chat intents |
| **Medium** | Add more `/copilot/chat` intents | quiz results, team listing — extend `_resolve_response()` in `main.py` |
| **Low** | Deploy to container hosting | `backend/Dockerfile` exists |
