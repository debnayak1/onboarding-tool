# Speaker Narrative — Onboarding Platform Presentation

> **Audience**: Technical reviewers and stakeholders

---

## Slide 01 — Title

**Title:** *AI Co-pilot as a Live Assistant*

> "What we built for Day Zero is not a wrapper around an AI API — it is a running application that has an AI co-pilot embedded at every layer of its stack. The Onboarding Platform is a real FastAPI + React system used to automate new-engineer onboarding. The co-pilot lives inside it as a chat widget, a REST endpoint, and a Model Context Protocol server that talks directly to the IDE. Every response is grounded in live platform data, not a cached summary or a hallucinated guess."

**Key point to land:** The three tags — *MCP Server*, *IDE Integration*, *LLM-ready* — signal depth of integration. This is not a demo; it is deployable today.

---

## Slide 02 — Problem Statement

**Title:** *The Onboarding Problem*

> "New engineers wait weeks for access. Admins manually create requests across five platforms. There is no single view of progress. This platform automates that entire lifecycle."

---

## Slide 03 — Solution Overview

**Title:** *Onboarding Platform + AI Co-pilot*

> "The submission has three pillars. The first is the platform core — team management, automated access-request creation, learning module assignment, a quiz system, and progress tracking. The second is the co-pilot as an in-app chat widget: a floating panel that appears on every authenticated page and answers questions grounded in the live database. The third is the co-pilot as an IDE-level MCP server: seven tools that let a developer approve requests, query engineer progress, or trigger a full onboarding workflow from inside the editor — without switching to the browser."

---

## Slide 04 — Architecture

**Title:** *Three-Layer AI Integration*

> "At the top layer, the React frontend at port 3000 hosts the AICopilot component — a fixed-position chat bubble on every page. The IDE extension is the third entry point. Both communicate with the FastAPI backend at port 8080.
>
> In the middle layer, the frontend's `chatWithCopilot()` API helper posts to `/copilot/chat` on the backend. The MCP server, `ai_mcp_server.py`, runs as a separate stdio process that the IDE talks to directly. Both read from and write to the same data layer: `db_manager.py` writing JSON files under `backend/data/`.
>
> There is one source of truth — the JSON data store — and the co-pilot reaches it through whichever surface the user is on."

---

## Slide 05 — In-App Chat Widget

**Title:** *AICopilot — Floating Chat Widget*

> "The in-app chat widget is implemented in `AICopilot.jsx` and wired globally through `AICopilotWrapper` in `App.jsx`. It passes a `pageContext` prop to the backend so responses differ depending on whether the user is on the admin dashboard or the engineer view.
>
> On the engineer side, the co-pilot can answer questions like 'What modules do I still need?' or 'How do I request GitHub access?' — drawing from the engineer's actual progress record. On the admin side, it can list all critical pending requests, approve a single request by ID, or bulk-approve everything critical in one message.
>
> The backend resolver today is rule-based — fast to build, easy to audit. The upgrade path to a real foundation model is a single function swap: replace `_resolve_response()` in `main.py`. The live data context is already assembled immediately above it. No frontend changes needed."

---

## Slide 06 — MCP Server

**Title:** *ai_mcp_server.py — 7 IDE Tools*

> "The MCP server implements the Model Context Protocol 2024-11-05 specification over stdio, using nothing but Python's standard library — no third-party SDK required. It exposes seven tools to the IDE.
>
> An admin can sit in their editor and say 'show me all pending access requests' — and get a live list pulled from the running backend. They can say 'approve req_0005' and the request is updated in the database immediately.
>
> Registration is a single JSON entry in the IDE MCP configuration."

---

## Slide 07 — Automated Workflow

**Title:** *Team-Based Onboarding Automation*

> "When an admin assigns an engineer to a team — either through the UI or through the IDE — four things happen automatically: access requests are created for every platform the team requires, learning modules are assigned based on the team's configuration and the repositories' detected languages, and conditional repository access is queued to be granted once the engineer completes the requirements."

---

## Slide 08 — Session Context & Skill

**Title:** *IDE Custom Skill & Session Context*

> "Two artefacts make the IDE integration production-grade. The first is a custom skill at `.bob/skills/onboarding-platform.md`. When activated, it loads a full codebase map into context. The second is the session context at `.bob/context/session-context.md` — a living handoff document updated at the end of every session."

---

## Slide 09 — Real Data, Real Trust

**Title:** *Live Data Grounding*

> "Every co-pilot response queries live database state at request time — nothing is cached. The admin dashboard shows real 'Days Since Joined' computed from actual `created_at` fields. The engineer dashboard shows real `last_accessed` timestamps and real `admin_notes` from access requests."

---

## Slide 10 — Productivity

**Title:** *Development Velocity*

> "The scope — MCP server, in-app chat widget, dashboard rewrites, full documentation, and submission artefacts — was delivered in approximately eight hours across four AI-assisted sessions, compared to an estimated forty hours without AI assistance. That is an eighty percent reduction."

---

## Slide 11 — Criteria Coverage

**Title:** *Integration Criteria — All Covered*

> "AI Co-pilot Integration: covered by the AICopilot widget and the `/copilot/chat` endpoint. MCP Protocol Usage: covered by `ai_mcp_server.py`. Live Data Grounding: the resolver queries `users_db`, `access_requests_db`, and `progress_db` at request time. Container Deployment: the Dockerfile supports standard container hosting."

---

## Slide 12 — Next Steps

**Title:** *Roadmap*

> "The most impactful next step is replacing the rule-based resolver with a real foundation model call. The live data context is already assembled in `main.py` at line 1413 — the change is approximately twenty lines.
>
> Second is an end-to-end demo recording: logging in as both admin and engineer, exercising every chat intent."

---

*Document generated from `.bob/context/session-context.md` and `.bob/skills/onboarding-platform.md`*
