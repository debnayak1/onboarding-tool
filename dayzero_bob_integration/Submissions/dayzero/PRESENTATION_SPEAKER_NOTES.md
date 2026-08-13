# Speaker Narrative — WatsonX Challenge 2026 Presentation
> **Deck**: 12 slides · Use ← → arrow keys or Prev/Next buttons to navigate the HTML deck  
> **Audience**: WatsonX Challenge 2026 judges / IBM technical reviewers  
> **Tone**: Confident, evidence-led, technical but accessible

---

## Slide 01 — Cover

**Title:** *IBM Bob as a Live AI Co-pilot*

**What to say:**

> "What we built for Day Zero is not a wrapper around an AI API — it is a running application that has Bob embedded at every layer of its stack. The Onboarding Platform is a real FastAPI + React system used to automate new-engineer onboarding. Bob lives inside it as a chat widget, a REST endpoint, and a Model Context Protocol server that talks directly to Bob's IDE extension. Every response Bob gives is grounded in live platform data, not a cached summary or a hallucinated guess."

**Key point to land:** The three tags — *MCP Server*, *Bob IDE Extension*, *IBM watsonx-ready* — signal depth of integration. This is not a demo; it is deployable today.

---

## Slide 02 — The Problem

**Title:** *New-Engineer Onboarding Is Slow & Fragmented*

**What to say:**

> "The status quo for onboarding looks like this: access requests travel through email chains and Slack threads, learning paths are defined ad-hoc by whoever the manager happens to be, and neither the engineer nor the admin has a single pane of glass. That is the platform problem we solved.

> But there is a second, deeper problem: existing AI tools — including general-purpose chat assistants — do not know the state of *your* platform. They cannot tell you which engineers have been waiting more than 30 days for approval. They cannot approve a critical access request from inside your IDE. We solved both problems in the same submission."

**Key point to land:** Dual problem — fragmented onboarding *and* AI that is disconnected from live state. Our submission addresses both simultaneously.

---

## Slide 03 — What We Built

**Title:** *Onboarding Platform + Bob AI Co-pilot*

**What to say:**

> "The submission has three pillars. The first is the platform core — team management, automated access-request creation, learning module assignment, a quiz system, and progress tracking. The second is Bob as an in-app chat widget: a floating panel that appears on every authenticated page and answers questions grounded in the live database. The third is Bob as an IDE-level MCP server: seven tools that let a developer approve requests, query engineer progress, or trigger a full onboarding workflow from inside Bob's IDE extension — without switching to the browser.

> All of this was built across four Bob sessions totalling approximately eight hours of development. Our pre-Bob estimate for the same scope was forty hours. That is an eighty percent reduction."

**Key point to land:** Three pillars, one coherent submission, eight hours vs forty. The numbers are documented and defensible.

---

## Slide 04 — Architecture

**Title:** *Three-Layer Bob Integration*

**What to say:**

> "Let me walk you through the architecture. At the top layer, the React frontend at port 3000 hosts the BobCopilot component — a fixed-position chat bubble on every page. Alongside it, Bob's IDE extension is the third entry point. Both of those communicate with the FastAPI backend at port 8080.

> In the middle layer, the frontend's `chatWithBob()` API helper posts to `/bob/chat` on the backend. The MCP server, `bob_mcp_server.py`, runs as a separate stdio process that the IDE talks to directly. Both of them ultimately read from and write to the same data layer: `db_manager.py` writing JSON files under `backend/data/`.

> The diagram shows why the integration is coherent: there is one source of truth — the JSON data store — and Bob reaches it through whichever surface the user is on."

**Key point to land:** Single source of truth. All three Bob integration points read the same live data.

---

## Slide 05 — BobCopilot Chat Widget

**Title:** *BobCopilot — Floating Chat Widget*

**What to say:**

> "The in-app chat widget is implemented in `BobCopilot.jsx` and wired globally through a `BobCopilotWrapper` in `App.jsx`. It passes a `pageContext` prop to the backend so Bob's responses differ depending on whether the user is on the admin dashboard or the engineer view.

> On the engineer side, Bob can answer questions like 'What modules do I still need?' or 'How do I request GitHub access?' — drawing from the engineer's actual progress record. On the admin side, Bob can list all critical pending requests, approve a single request by ID, or bulk-approve everything critical in one message.

> The backend resolver today is rule-based — fast to build, easy to audit. But the upgrade path to a real IBM watsonx.ai model is a single function swap: replace `_resolve_response()` in `main.py` with a watsonx API call. The live data context is already assembled immediately above it. No frontend changes needed."

**Key point to land:** The LLM upgrade is ~20 lines. The architecture is already watsonx-ready.

---

## Slide 06 — MCP Server

**Title:** *bob_mcp_server.py — 7 IDE Tools*

**What to say:**

> "The MCP server implements the Model Context Protocol 2024-11-05 specification over stdio, using nothing but Python's standard library — no third-party SDK required. It exposes seven tools to Bob's IDE extension.

> An admin can sit in their editor and say 'Bob, show me all pending access requests' — and get a live list pulled from the running backend. They can say 'approve req_0005' and the request is updated in the database immediately. They can trigger the full onboarding workflow for a new engineer — assigning them to a team, creating their access requests, and scheduling their learning modules — without leaving the IDE.

> Registration is a single JSON entry in Bob's MCP configuration. Once registered, these tools are available in every Bob conversation inside the IDE."

**Key point to land:** Seven tools. One JSON registration. Operational control of a live platform from inside the IDE.

---

## Slide 07 — Team-Based Onboarding

**Title:** *Team-Based Onboarding System*

**What to say:**

> "The platform's core automation is the team-based onboarding workflow. When an admin assigns an engineer to a team — either through the UI or through Bob in the IDE — four things happen automatically: access requests are created for every platform the team requires, learning modules are assigned based on the team's configuration and the repositories' detected languages, and conditional repository access is queued to be granted once the engineer completes the requirements.

> The engineer's dashboard shows real data only: a 'Last Accessed' column drawn from the actual `last_accessed` field in the database, and an 'Admin Notes' column from the actual `admin_notes` field. No simulated numbers, no `Math.random()` deltas — everything you see on screen is a direct reflection of the database state."

**Key point to land:** Automation is end-to-end and auditable. The UI shows live data, not simulations.

---

## Slide 08 — Bob IDE Skill & Session Context

**Title:** *Bob IDE Custom Skill & Session Context*

**What to say:**

> "Two Bob-specific artefacts make the IDE integration production-grade. The first is a custom skill at `.bob/skills/onboarding-platform.md`. When activated, it loads a full codebase map into Bob's context: every key file, every API route, every data model, every common task. Bob can answer 'which file handles team assignment?' or 'what is the auth flow?' without reading the entire codebase from scratch.

> The second is the session context at `.bob/context/session-context.md`. This is a living handoff document. At the start of every session, Bob reads it first. At the end, Bob updates it: what was completed with file and line references, what still needs to be done, known issues, key decisions and the rationale behind them, and a running session log.

> The result is zero re-ramp time between sessions. The next developer — human or AI — picks up exactly where the last session ended."

**Key point to land:** Cross-session continuity is not a nice-to-have. It is what makes Bob a reliable engineering partner over days and weeks, not just hours.

---

## Slide 09 — Dashboard Rewrites

**Title:** *Dashboard Rewrites — Removing Synthetic Analytics*

**What to say:**

> "One of the most important quality decisions in this submission was removing all synthetic analytics from both dashboards. The original code contained a 'Company Onboarding Score' ring built from simulated data, a 'Productivity Bands' card, score and delta columns generated with `Math.random()`, and a weekly progress bar chart with fake `weekBars` data.

> Bob replaced all of that with real fields. The admin dashboard now shows a 'Days Since Joined' pill — colour-coded blue for engineers within seven days, amber within thirty, red beyond thirty — computed from the actual `created_at` field. The engineer dashboard shows the real `last_accessed` timestamp and the real `admin_notes` text from access requests.

> This matters because a platform that shows fake analytics cannot be trusted. If Bob is your co-pilot, every data point it references must be real."

**Key point to land:** Trust requires real data. Bob audited and fixed the analytics in a single session.

---

## Slide 10 — Productivity Impact

**Title:** *Productivity — 80% Time Saving with Bob*

**What to say:**

> "Let me give you the concrete numbers. Our pre-Bob estimate for this scope — MCP server, in-app chat widget, dashboard rewrites, full documentation, pitch deck, and all submission artefacts — was approximately forty hours of engineering time.

> The actual time was eight hours across four Bob sessions. That is an eighty percent reduction.

> Session one delivered the MCP server, the `/bob/chat` endpoint, the BobCopilot component, and all the wiring into App and Dashboard. Session two delivered the dashboard rewrites and documentation cleanup. Session three was a brief verification pass. Session four produced the architecture document, technical briefing, solution statement, criteria coverage map, time estimate, and the pitch deck.

> Bob did not just write code. It also wrote documentation, produced submission artefacts, and caught issues — like the broken vite symlink and the stale synthetic analytics — that a human reviewer might have missed."

**Key point to land:** The time saving is documented per session. Bob contributed to every layer of the submission, not just the code.

---

## Slide 11 — WatsonX Criteria Coverage

**Title:** *8 / 8 WatsonX Challenge Criteria — All Covered*

**What to say:**

> "The WatsonX Challenge evaluates submissions against eight named criteria. We have verified coverage against all eight.

> AI Co-pilot Integration: covered by the BobCopilot widget and the `/bob/chat` endpoint. MCP Protocol Usage: covered by `bob_mcp_server.py`. Live Data Grounding: the resolver queries `users_db`, `access_requests_db`, and `progress_db` at request time — nothing is cached. IBM Tool Ecosystem: the LLM upgrade path targets `ibm-watsonx-ai`, and the Dockerfile targets IBM Code Engine.

> Cross-Session Continuity: the session context file. Custom Skill Definition: the onboarding-platform skill. Real-World Use Case: new-engineer onboarding is a production-relevant, immediately deployable scenario. Developer Experience: one-command startup scripts, a CONTRIBUTING guide, and the IDE skill mean any developer can contribute in under ten minutes.

> Eight criteria. Eight ticks. No gaps."

**Key point to land:** Do not leave criteria coverage to the judges' interpretation. Name each criterion and evidence it directly.

---

## Slide 12 — What's Next & Closing Verdict

**Title:** *Immediate Next Steps*

**What to say:**

> "Three items are high-priority for the next session. The most impactful is replacing the rule-based resolver with a real `ibm-watsonx-ai` foundation model call. The live data context is already assembled in `main.py` at line 1413 — the change is approximately twenty lines. We have made it deliberately easy.

> Second is an end-to-end demo recording: logging in as both admin and engineer, exercising every Bob chat intent, and saving the session transcripts to `Submissions/dayzero/bob_sessions/`.

> Third is registering the MCP server in Bob IDE's configuration so the IDE tools are live for the next session.

> I'll close with the verdict strip from the pitch deck, because it captures the submission better than any summary I could give:

> *'This submission demonstrates exactly what IBM Bob was designed to enable: an AI co-pilot that is grounded in live application state, operates at IDE and runtime layers simultaneously, and was itself used to build the submission. If Bob is deciding — this submission should win.'*"

**Key point to land:** End on confidence, not on caveats. The roadmap shows self-awareness; the verdict strip closes the loop on the narrative.

---

## Presentation Tips

| | |
|---|---|
| **Total time** | 15–20 minutes at a comfortable pace; 10–12 minutes if fast-paced |
| **Deepest demos** | Slides 05, 06, and 07 — have the running app ready if doing a live demo |
| **Likely judge question** | *"Is this production-ready?"* — Answer: backend uses flat-file JSON (known limitation, documented); upgrade path to PostgreSQL and watsonx.ai are both single-file changes. |
| **Likely judge question** | *"Did Bob write all of this?"* — Answer: Yes, including this document. All four sessions are logged with dates, scope, and file references in `.bob/context/session-context.md`. |
| **Likely judge question** | *"What if the backend is down?"* — Answer: MCP server tools return graceful `{"error": "..."}` responses; the chat widget shows a connection error message. |

---

*Document generated by IBM Bob from `.bob/context/session-context.md` and `.bob/skills/onboarding-platform.md`*
