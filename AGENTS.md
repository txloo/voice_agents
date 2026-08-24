# AGENTS.md

## Project Overview

Voice AI Agent Platform - multi-tenant SaaS for creating and managing AI voice agents with telephony integration (Telnyx), STT/LLM/TTS pipeline (Pipecat AI), and real-time call management.

## Architecture

- **Backend**: Python 3.12+ / FastAPI / SQLAlchemy async / PostgreSQL / Redis
- **Dashboard**: Next.js 15 / React 19 / TypeScript / Tailwind CSS
- **Infrastructure**: Docker Compose (4 services: db, redis, backend, dashboard)
- **Telephony**: Telnyx for PSTN connectivity, Pipecat AI for voice pipeline orchestration
- **AI Providers**: OpenAI (LLM), Deepgram (STT), Fish Audio (TTS) - all configurable per agent

## Key Commands

```bash
# Start all services (builds if needed)
make dev

# Stop services
make stop

# Run database migrations
make migrate

# Create new migration (requires MSG env var)
make migrate-create MSG="description here"

# Seed sample data
make seed

# Open shells
make backend-shell    # Python REPL in backend
make db-shell         # psql shell
make redis-cli        # redis-cli shell
```

### Backend Development (outside Docker)

```bash
cd backend
pip install -e ".[dev]"
ruff check .           # Lint
ruff format .          # Format
pytest                 # Run tests (asyncio_mode=auto)
```

### Dashboard Development (outside Docker)

```bash
cd dashboard
npm run dev            # Dev server on :3000
npm run lint           # ESLint
npm run typecheck      # TypeScript check
```

## API Conventions

- All routes under `/v1` prefix (except `/health` and `/webhooks/*`)
- Multi-tenant isolation: every query filters by `tenant_id` from JWT
- Auth via JWT tokens (access + refresh) stored in localStorage
- Webhook routes (`/webhooks/telnyx`) are unauthenticated (signature verification TODO)
- Pydantic schemas in `app/schemas/`, SQLAlchemy models in `app/models/`

## Database

- UUID primary keys on all tables (PostgreSQL UUID type)
- Alembic migrations in `backend/migrations/`
- Migrations auto-generate from model changes via `make migrate-create`
- Models imported in `migrations/env.py` via wildcard - ensure new models are in `app/models/__init__.py`

## Environment Variables

Backend reads from `backend/.env` (gitignored). Required for full functionality:
- `SECRET_KEY` - JWT signing (change from default in production)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection
- `TELNYX_*` - Telephony provider credentials
- `OPENAI_API_KEY`, `DEEPGRAM_API_KEY`, `ELEVENLABS_API_KEY` - AI services
- `STRIPE_*` - Payment processing
- `AWS_*` + `S3_BUCKET` - Recording storage

Dashboard reads from `dashboard/.env.local` - only `NEXT_PUBLIC_API_URL` (defaults to localhost:8000).

## Testing

- Backend: `pytest` in `backend/` (pytest-asyncio with auto mode)
- No test directory exists yet - tests should go in `backend/tests/`
- Dashboard: No test setup currently configured

## Linting

- Python: Ruff (line-length=100, target py312, rules: E, F, I, N, UP, B, SIM)
- TypeScript: ESLint via `next lint`

## Important Notes

- Dashboard proxies `/v1/*` to backend via Next.js rewrites (see `next.config.js`)
- Backend runs with `--reload` in dev mode
- Redis used for session/caching (setup not yet implemented in code)
- `orchestrator/` and `telephony/` modules are empty - core voice pipeline not yet implemented
- Webhook handlers are stubs - Telnyx signature verification and event routing are TODOs
- Agent versioning: versions are immutable, only one can be published per agent
- Do NOT read `pipecat-quickstart/` (includes a large `.venv`) unless explicitly asked — it bloats context
