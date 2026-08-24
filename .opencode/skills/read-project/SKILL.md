---
name: read-project
description: Use when the user asks to read project context, understand the project, read project files, or get oriented with the voice_agents codebase. Front-load keywords like "read project", "project context", "understand project".
---

# Read Project Context

Read all essential project files in parallel to understand the codebase.

## Core Context

1. `AGENTS.md` — Agent instructions, architecture, build commands
2. `project_context.md` — Full project documentation: architecture, data model, current state, what to work on next, locked-in decisions
3. `Makefile` — Make targets (dev/stop/migrate/seed)
4. `docker-compose.yml` — Service topology (db, redis, backend, dashboard)

## Configuration

5. `backend/pyproject.toml` — Backend deps, Ruff + pytest config
6. `backend/.env.example` — Env var reference
7. `dashboard/package.json` — Frontend deps and scripts
8. `dashboard/next.config.js` — `/v1/*` proxy to backend :8000
9. `dashboard/tailwind.config.js` — UI theme

## Backend

10. `backend/app/main.py` — FastAPI app, router mounting, CORS
11. `backend/app/config.py` — pydantic-settings env config
12. `backend/app/database.py` — Async engine/session, Base
13. `backend/app/models/__init__.py`, `tenant.py`, `agent.py`, `provider.py` — data model (Tenant/User/ApiKey, Agent/AgentVersion/Call, ProviderKey/PhoneNumber)
14. `backend/app/api/auth.py`, `agents.py`, `calls.py`, `webhooks.py` — all routes
15. `backend/app/auth/dependencies.py`, `tokens.py` — JWT + API key auth
16. `backend/app/schemas/` — Pydantic request/response schemas
17. `backend/migrations/env.py` — Alembic config

## Dashboard

18. `dashboard/src/lib/api.ts` — API client (JWT in localStorage)
19. `dashboard/src/app/layout.tsx`, `(platform)/layout.tsx` — app shell/sidebar
20. `dashboard/src/app/(platform)/agents/page.tsx` — agents CRUD UI
21. `dashboard/src/app/(auth)/login/page.tsx` — login UI

## Instructions

- **Read `project_context.md` first** — it is the authoritative record of current state and planned work. Use its "What To Work On Next" section to orient the task, and treat its "Decisions Locked In" as ground truth
- Read all other listed files in any order, in parallel
- For API routers, note each endpoint's method, path, auth dependency, and response model; flag TODOs (webhooks.py has stub handlers)
- For models, note relationships and that every query is tenant-scoped
- After reading, summarize: project purpose, tech stack, current state, and notable issues (empty orchestrator/telephony modules, stub webhook signature verification, no migrations created yet, empty tests/)

## Optional (read if relevant to the task)

- `dashboard/src/app/(platform)/calls/page.tsx`, `analytics/page.tsx`, `settings/page.tsx`
- `dashboard/src/app/(auth)/register/page.tsx`
- `backend/app/orchestrator/`, `backend/app/telephony/`, `backend/app/ws/` — voice runtime (Pipecat pipeline, Telnyx media streaming, steer/inject)
- `backend/tests/` — pytest suite (asyncio_mode=auto)
