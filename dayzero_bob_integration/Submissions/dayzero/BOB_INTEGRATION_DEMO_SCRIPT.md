# AI Integration — Demo Script

## Integration Points

| Integration Point | What It Is | Works Now? |
|-------------------|------------|------------|
| `.bob/mcp.json` | Registers `ai_mcp_server.py` as a live MCP tool server in the IDE | ✅ Yes |
| `.bob/skills/onboarding-platform.md` | Custom skill that loads full codebase context | ✅ Yes |
| `.bob/context/session-context.md` | Cross-session handoff document | ✅ Yes |
| `AICopilot.jsx` chat widget | In-app React chat component | ✅ Runs, keyword-based |
| `/copilot/chat` backend endpoint | FastAPI route with rule-based resolver | ✅ Runs, keyword-based |

---

## The Real Integration: MCP + Skill + Context

The deepest integration is the **IDE layer** — the in-app chat widget is a separate surface.

### 1. `.bob/mcp.json` — IDE calls 7 live tools

When the backend is running, the IDE assistant can call these tools with natural language:

| Say in the IDE | Tool called | What happens |
|----------------|-------------|--------------|
| "Show me platform stats" | `get_system_summary` | GET /admin/stats → live counts |
| "List pending requests" | `list_pending_access_requests` | Returns live list from the running app |
| "How is john_doe doing?" | `get_engineer_progress` | GET /api/v2/engineers/john_doe/dashboard |
| "Approve req_0001" | `approve_access_request` | PUT /access/requests/req_0001 → DB updated |

### 2. `.bob/skills/onboarding-platform.md` — codebase context

The assistant can answer questions about this codebase without reading every file:
- "Which file handles team assignment?"
- "What does the /copilot/chat endpoint return?"

### 3. `.bob/context/session-context.md` — session continuity

Read at the start of every session. Updated at the end with what changed and what's next.

---

## Demo Flow

### Prerequisites
```bash
# Terminal 1 — backend
cd backend && uvicorn main:app --port 8080 --reload

# Terminal 2 — frontend
cd frontend && npm run dev
```

### Scene 1: IDE controlling the live platform

Open the IDE chat with this workspace. The MCP server auto-connects.

Ask in the IDE:
1. "What is the current system summary?"
2. "Show me all pending access requests"
3. "Approve req_0001"

Each command calls a live MCP tool against the running backend.

### Scene 2: In-app chat widget

1. Open http://localhost:3000
2. Login as `admin` / `admin123`
3. Click the floating chat bubble (bottom-right)
4. Try: "Show me all critical pending requests" or "Approve req_0001"

### Scene 3: Engineer view

1. Login as `john_doe` / `password123`
2. Ask: "What modules do I still need to complete?"
3. Ask: "How do I request GitHub access?"

---

## Upgrading to a Real LLM

Replace `_resolve_response()` in `backend/main.py` with a foundation model API call.
The live data context (users, requests, progress) is already assembled immediately above it.
No frontend changes needed — approximately 20 lines of code.

Example pattern:
```python
# Replace the rule-based body of _resolve_response() with:
response = openai.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": f"You are an onboarding co-pilot. Context: {context_data}"},
        {"role": "user", "content": request.message},
    ],
)
return {"reply": response.choices[0].message.content, "type": "llm"}
```
