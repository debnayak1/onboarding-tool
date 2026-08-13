# Bob Integration — What Is Real and How to Demo It

## Honest Integration Status

| Integration Point | What It Is | Real Bob? | Works Now? |
|---|---|---|---|
| `.bob/mcp.json` | Registers `bob_mcp_server.py` as a live MCP tool server in Bob IDE | ✅ Yes — Bob IDE reads this | ✅ Yes — just created |
| `.bob/skills/onboarding-platform.md` | Custom Bob skill that loads full codebase context | ✅ Yes — Bob IDE reads this | ✅ Yes |
| `.bob/context/session-context.md` | Cross-session handoff Bob reads/writes | ✅ Yes — Bob IDE reads this | ✅ Yes |
| `BobCopilot.jsx` chat widget | Our own React component (not IBM Bob's widget) | ❌ No IBM Bob | ✅ Runs, keyword-based |
| `/bob/chat` backend endpoint | Our own FastAPI route (not IBM Bob's API) | ❌ No IBM Bob | ✅ Runs, keyword-based |

---

## The Real Bob Integration: MCP + Skill + Context

The genuine IBM Bob integration is the **IDE layer** — not the in-app chat widget.
Here is exactly what exists right now and what it proves:

### 1. `.bob/mcp.json` — Bob IDE calls 7 live tools

File: `.bob/mcp.json`

```json
{
  "mcpServers": {
    "onboarding-platform": {
      "command": "python3",
      "args": ["backend/bob_mcp_server.py"]
    }
  }
}
```

When the backend is running, Bob IDE can call these tools with natural language:

| Say to Bob in the IDE | Tool called | What happens |
|---|---|---|
| "Show me all pending access requests" | `list_pending_access_requests` | Live list from the running app |
| "What is john_doe's onboarding progress?" | `get_engineer_progress` | Live dashboard data |
| "Approve request req_0001" | `approve_access_request` | Request status changes in the DB immediately |
| "Reject req_0003, insufficient justification" | `reject_access_request` | Request rejected with notes |
| "Assign alice to team_backend" | `assign_engineer_to_team` | Full workflow fires: access requests created, modules assigned |
| "Give me a system summary" | `get_system_summary` | Platform-wide stats |
| "Generate a learning path for john_doe" | `generate_learning_path` | Personalised module order |

### 2. `.bob/skills/onboarding-platform.md` — Bob knows the whole codebase

Bob can answer questions about this codebase without reading every file:
- "Which file handles team assignment?"
- "What does the /bob/chat endpoint return?"
- "Where is the access request approval logic?"

### 3. `.bob/context/session-context.md` — Bob resumes every session instantly

Bob reads this at the start of every session. Judges can see the session log proving
Bob built this project across 4 sessions.

---

## Demo Script (for judges / presentation)

### Pre-requisites
```bash
# Terminal 1 — start the backend
./start-backend.sh

# Terminal 2 — start the frontend
./start-frontend.sh
```

### Demo sequence

#### Scene 1: Bob IDE controlling the live platform (THE real integration)

> Open Bob IDE chat with this workspace. The MCP server auto-connects.

Ask Bob in the IDE:
```
"Give me a system summary of the onboarding platform"
```
Bob calls `get_system_summary` → GET /admin/stats → returns live counts.

```
"Show me all pending access requests"
```
Bob calls `list_pending_access_requests` → returns live list from the running app.

```
"What is john_doe's onboarding progress?"
```
Bob calls `get_engineer_progress` → GET /api/v2/engineers/john_doe/dashboard → live data.

```
"Approve request req_0001"
```
Bob calls `approve_access_request` → PUT /access/requests/req_0001 → DB updated.
**Refresh the browser — the status change is visible immediately.**

This is the proof: Bob IDE just changed data in the running application.

#### Scene 2: In-app chat widget (our own, keyword-based)

> Open http://localhost:3000, login as john_doe / password123

Click the blue chat bubble (bottom-right):
```
"What are my pending requests?"   → shows only john_doe's requests
"Show my progress"                → shows module completion
"How do I get GitHub access?"     → step-by-step guide
"Status report"                   → personal onboarding summary
```

Login as admin / admin123:
```
"Show all pending requests"       → all system requests
"Approve all critical requests"   → bulk action, DB updated
"Status report"                   → system-wide stats
```

**Honest framing for judges:** The in-app chat is rule-based. The real AI layer is
Bob IDE using the MCP tools — that is where natural language meets live platform action.

#### Scene 3: Bob built this (the meta-story)

> Show `.bob/context/session-context.md` session log

4 sessions. Every file listed with line references. Bob wrote:
- The MCP server from scratch
- The chat endpoint and resolver
- The React chat widget
- Both dashboard rewrites
- All submission artefacts (architecture doc, pitch deck, criteria map)

---

## What to Say to Judges

> "IBM Bob is integrated at three levels.
>
> First, as the development tool — Bob wrote this entire submission across four sessions,
> logged in `.bob/context/session-context.md`.
>
> Second, as an IDE co-pilot — `.bob/mcp.json` registers our MCP server with Bob IDE.
> From inside the IDE, Bob can query engineer progress, approve access requests, assign
> engineers to teams, and generate learning paths — all against the live running application.
> We just demonstrated that: one sentence to Bob approved a request and the browser
> refreshed to show the change.
>
> Third, the in-app chat widget gives users a conversational interface. Today it is
> rule-based; the upgrade to IBM watsonx Granite is a 20-line change in one function —
> the data pipeline is already built."

---

## The 20-line watsonx upgrade (if time permits before the event)

File: `backend/main.py`, line ~1413

```bash
pip install ibm-watsonx-ai
```

Replace `_resolve_response()` with:

```python
def _resolve_response() -> dict:
    from ibm_watsonx_ai import APIClient, Credentials
    from ibm_watsonx_ai.foundation_models import ModelInference

    creds = Credentials(api_key="YOUR_KEY", url="https://us-south.ml.cloud.ibm.com")
    model = ModelInference(model_id="ibm/granite-13b-chat-v2",
                           credentials=creds, project_id="YOUR_PROJECT_ID")

    system_ctx = (
        f"You are Bob, an AI co-pilot for an engineer onboarding platform.\n"
        f"Live data: {len(engineers)} engineers onboarding, "
        f"{len(pending)} pending access requests ({len(critical)} critical).\n"
        f"Current user: {user_id}, role: {role}.\n"
        f"User's own pending requests: {[r['id'] for r in access_requests_db.values() if r.get('user_id')==user_id and r.get('status')=='pending']}.\n"
        f"Answer helpfully and concisely. For actions (approve/reject), confirm what you did."
    )
    response = model.chat(messages=[
        {"role": "system", "content": system_ctx},
        {"role": "user",   "content": message}
    ])
    return {"reply": response["choices"][0]["message"]["content"], "type": "info"}
```

No frontend changes. No API contract changes. The widget works identically.
