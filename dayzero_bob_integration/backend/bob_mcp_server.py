"""
Bob MCP Server — Onboarding Platform Tools
Exposes key onboarding operations as callable tools for Bob.

Each tool maps directly to an existing FastAPI endpoint so Bob can
take real actions (approve requests, query progress, assign teams)
during a natural-language conversation.

Usage:
  python bob_mcp_server.py
  Runs an MCP-compatible stdio server that Bob's IDE extension connects to.
"""

import json
import sys
import asyncio
from datetime import datetime
from typing import Any, Dict, Optional

# ---------------------------------------------------------------------------
# Lightweight MCP stdio transport (no external SDK required for demo)
# Each tool is exposed as a JSON-RPC 2.0 method over stdin/stdout.
# ---------------------------------------------------------------------------

TOOLS = [
    {
        "name": "get_engineer_progress",
        "description": (
            "Get the full onboarding progress for an engineer. "
            "Returns assigned modules, completion percentages, quiz scores, "
            "and pending access requests. Use this to answer questions like "
            "'What modules does John still need to finish?' or "
            "'Who is behind on their onboarding?'"
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "The engineer's username (e.g. 'john_doe')"
                }
            },
            "required": ["user_id"]
        }
    },
    {
        "name": "list_pending_access_requests",
        "description": (
            "List all pending access requests across the platform. "
            "Returns requester name, platform, access type, urgency, and justification. "
            "Use this when an admin asks 'What access requests need my attention?' "
            "or 'Show me all critical pending requests'."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "urgency": {
                    "type": "string",
                    "description": "Filter by urgency: 'low', 'normal', 'high', 'critical'. Omit for all.",
                    "enum": ["low", "normal", "high", "critical"]
                }
            },
            "required": []
        }
    },
    {
        "name": "approve_access_request",
        "description": (
            "Approve a pending access request by its request ID. "
            "Optionally include admin notes explaining the approval. "
            "Use this when an admin says 'Approve request REQ-123' or "
            "'Approve all critical GitHub requests'."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "request_id": {
                    "type": "string",
                    "description": "The access request ID to approve"
                },
                "admin_notes": {
                    "type": "string",
                    "description": "Optional notes from the admin explaining the approval"
                }
            },
            "required": ["request_id"]
        }
    },
    {
        "name": "reject_access_request",
        "description": (
            "Reject a pending access request with a reason. "
            "Use this when an admin says 'Reject request REQ-456, not enough justification'."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "request_id": {
                    "type": "string",
                    "description": "The access request ID to reject"
                },
                "admin_notes": {
                    "type": "string",
                    "description": "Reason for rejection — required so the engineer understands"
                }
            },
            "required": ["request_id", "admin_notes"]
        }
    },
    {
        "name": "assign_engineer_to_team",
        "description": (
            "Assign an engineer to a team. This triggers the full automated workflow: "
            "creates access requests for all platforms the team needs, assigns the "
            "team's required learning modules, and starts the onboarding clock. "
            "Use this when an admin says 'Add Sarah to the Backend team'."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "The engineer's username"
                },
                "team_id": {
                    "type": "string",
                    "description": "The team ID (e.g. 'team_backend', 'team_frontend')"
                }
            },
            "required": ["user_id", "team_id"]
        }
    },
    {
        "name": "get_system_summary",
        "description": (
            "Get a high-level summary of the entire onboarding platform: "
            "total engineers, average completion rate, number of pending access requests, "
            "teams, and any engineers who are stuck (< 20% after 3+ days). "
            "Use this to answer 'How is onboarding going overall?' or "
            "'Give me a status report'."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "generate_learning_path",
        "description": (
            "Generate a personalised, ordered learning path for an engineer based on "
            "their team assignment, existing progress, and the repositories they will "
            "work on. Returns a ranked list of modules with estimated durations. "
            "Use this when an engineer asks 'What should I learn first?' or "
            "'Show me my onboarding plan'."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "The engineer's username"
                }
            },
            "required": ["user_id"]
        }
    }
]


# ---------------------------------------------------------------------------
# Tool implementations — call the FastAPI backend via HTTP
# ---------------------------------------------------------------------------

import urllib.request

API_BASE = "http://localhost:8080"

def _get(path: str) -> Any:
    try:
        with urllib.request.urlopen(f"{API_BASE}{path}", timeout=5) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}

def _put(path: str, body: Dict) -> Any:
    try:
        data = json.dumps(body).encode()
        req = urllib.request.Request(
            f"{API_BASE}{path}", data=data,
            headers={"Content-Type": "application/json"}, method="PUT"
        )
        with urllib.request.urlopen(req, timeout=5) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}

def _post(path: str, body: Dict) -> Any:
    try:
        data = json.dumps(body).encode()
        req = urllib.request.Request(
            f"{API_BASE}{path}", data=data,
            headers={"Content-Type": "application/json"}, method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}


def call_tool(name: str, args: Dict) -> Any:
    if name == "get_engineer_progress":
        uid = args["user_id"]
        return _get(f"/api/v2/engineers/{uid}/dashboard")

    elif name == "list_pending_access_requests":
        all_reqs = _get("/access/requests")
        if isinstance(all_reqs, list):
            pending = [r for r in all_reqs if r.get("status") == "pending"]
            urgency = args.get("urgency")
            if urgency:
                pending = [r for r in pending if r.get("urgency") == urgency]
            return {"pending_count": len(pending), "requests": pending}
        return all_reqs

    elif name == "approve_access_request":
        rid = args["request_id"]
        notes = args.get("admin_notes", "Approved by Bob AI assistant")
        return _put(f"/access/requests/{rid}", {"status": "approved", "admin_notes": notes})

    elif name == "reject_access_request":
        rid = args["request_id"]
        notes = args["admin_notes"]
        return _put(f"/access/requests/{rid}", {"status": "rejected", "admin_notes": notes})

    elif name == "assign_engineer_to_team":
        uid = args["user_id"]
        tid = args["team_id"]
        return _post(f"/api/v2/engineers/{uid}/assign-team/{tid}", {})

    elif name == "get_system_summary":
        return _get("/admin/stats")

    elif name == "generate_learning_path":
        uid = args["user_id"]
        dashboard = _get(f"/api/v2/engineers/{uid}/dashboard")
        return {"user_id": uid, "learning_path": dashboard}

    return {"error": f"Unknown tool: {name}"}


# ---------------------------------------------------------------------------
# MCP stdio protocol loop
# ---------------------------------------------------------------------------

def send(obj: Dict):
    line = json.dumps(obj)
    sys.stdout.write(line + "\n")
    sys.stdout.flush()


def handle(msg: Dict) -> Optional[Dict]:
    method = msg.get("method", "")
    msg_id = msg.get("id")

    if method == "initialize":
        return {
            "jsonrpc": "2.0", "id": msg_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "onboarding-platform", "version": "1.0.0"}
            }
        }

    elif method == "tools/list":
        return {
            "jsonrpc": "2.0", "id": msg_id,
            "result": {"tools": TOOLS}
        }

    elif method == "tools/call":
        params = msg.get("params", {})
        tool_name = params.get("name")
        tool_args = params.get("arguments", {})
        result = call_tool(tool_name, tool_args)
        return {
            "jsonrpc": "2.0", "id": msg_id,
            "result": {
                "content": [{"type": "text", "text": json.dumps(result, indent=2)}]
            }
        }

    elif method == "notifications/initialized":
        return None  # notification, no response needed

    return {
        "jsonrpc": "2.0", "id": msg_id,
        "error": {"code": -32601, "message": f"Method not found: {method}"}
    }


if __name__ == "__main__":
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
            response = handle(msg)
            if response is not None:
                send(response)
        except json.JSONDecodeError:
            pass
        except Exception as e:
            send({"jsonrpc": "2.0", "id": None,
                  "error": {"code": -32603, "message": str(e)}})
