# Project Context — Voice AI Agent Platform

## 1. Project Purpose

Multi-tenant SaaS for creating and managing AI voice agents with Telnyx telephony, Pipecat AI pipeline (STT/LLM/TTS), and real-time call management.

- **Backend**: Python 3.12 / FastAPI / SQLAlchemy async / PostgreSQL / Redis
- **Dashboard**: Next.js 15 / React 19 / TypeScript / Tailwind CSS
- **Telephony**: Telnyx (PSTN), Pipecat AI (voice pipeline orchestration)
- **AI Providers**: OpenAI (LLM), Deepgram (STT), Fish Audio (TTS) — configurable per agent version

## 2. Current State

Roughly 40% built: a complete CONTROL PLANE (auth, agents/versions CRUD, read-only call logs, dashboard) and 0% of the MEDIA PLANE (voice runtime).

**WORKING:**
- JWT auth (register/login/refresh/me) + API keys (`va_...`)
- Agent + version CRUD, publish (only one published version per agent)
- Calls: list/get/transcript (read-only)
- Dashboard: auth pages, agents list, agent detail (version list), call log table; analytics/settings are stubs
- `pipecat-quickstart/` — local working demo of the media-plane pipeline (Deepgram STT + Fish Audio TTS + Zen `big-pickle` LLM), Pipecat 1.6.0 (see §6.5)

**MISSING (gaps to close):**
- DB schema: `backend/migrations/versions/` is EMPTY — no migration has ever been generated
- `app/orchestrator/` — Pipecat pipeline (empty placeholder)
- `app/telephony/` — Telnyx WS transport + dial-out (empty placeholder)
- `app/ws/`, `app/services/` — empty placeholders
- `app/api/webhooks.py` — STUBS: `telnyx_webhook` returns `{"status":"ok"}`; `telnyx_voice_webhook` returns a hardcoded `<Say>` with no `<Stream>`, no signature verification, no event routing
- `CallCreate` schema exists but no endpoint uses it (no dial-out)
- No mid-call steering; no live call view in dashboard
- `backend/tests/` empty

## 3. Architecture (target)

TWO PLANES:
- **CONTROL**: Dashboard → `/v1/*` → FastAPI → Postgres (agents, versions, calls, auth)
- **MEDIA**: Caller → PSTN → Telnyx → WebSocket (8kHz μ-law/PCMU) → FastAPI WS handler → Pipecat pipeline → STT(Deepgram) → user aggregator → LLM(OpenAI) → TTS(Fish Audio) → audio back to Telnyx

**MEETING POINTS:**
1. Webhooks: `POST /webhooks/telnyx/voice` returns TeXML
   `<Connect><Stream url="wss://host/v1/ws/telnyx?call_id=..." bidirectionalMode="rtp"/>`.
   Event webhook `POST /webhooks/telnyx` routes answered/hangup/DTMF.
2. `Call` row in Postgres: every call persisted (status, transcript, cost).

**MID-CALL STEERING:** `POST /v1/calls/{id}/steer` → active-call registry finds the running `PipelineTask` → `task.queue_frame(LLMMessagesAppendFrame(...))` → reaches context aggregator → next LLM turn uses it. Caveat: injected DataFrames are dropped on user interruption, so persistent steering must be stashed in a custom processor/aggregator.

## 4. Data Model

- `Tenant(id, name, slug, plan, stripe_customer_id)` → users, agents, phone_numbers, provider_keys
- `User(id, tenant_id, email, hashed_password, role, is_active)` → api_keys
- `ApiKey(id, user_id, name, key_hash, key_prefix)`
- `Agent(id, tenant_id, name, description, status[draft|active], timestamps)` → versions, calls
- `AgentVersion(id, agent_id, version_number, system_prompt, pipeline_config{stt/llm/tts provider+model}, tools_config, voice_config, is_published)` — immutable, one published per agent
- `Call(id, tenant_id, agent_id, agent_version_id, telnyx_call_control_id, direction, from_number, to_number, status[initiated|active|completed|...], duration_seconds, transcript[], cost_cents, metadata, started_at, ended_at)`
- `ProviderKey` / `PhoneNumber(id, tenant_id, ...)`

UUID PKs on all tables. Every query tenant-scoped via JWT. Models must be re-exported in `app/models/__init__.py` (Alembic wildcard import).

## 5. API Conventions

- All routes under `/v1` (except `/health` and `/webhooks/*`)
- Auth: Bearer JWT (stored in localStorage as `access_token`) or `va_` API key; deps `get_current_user` / `get_current_tenant`
- Pydantic schemas in `app/schemas/`, SQLAlchemy models in `app/models/`
- Backend dev: `ruff check .`, `ruff format .`, `pytest` (asyncio_mode=auto, testpaths=`tests`)

## 6. Infrastructure & Env

- `make dev` / `make stop` / `make migrate` / `make migrate-create MSG=...` / `make seed`; Docker: db, redis, backend, dashboard
- Backend env: `backend/.env` (gitignored; see `.env.example`): `SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`, `TELNYX_API_KEY`/`TELNYX_CONNECTION_ID`/`TELNYX_FROM_NUMBER`/`TELNYX_PUBLIC_KEY`, `OPENAI_API_KEY`, `DEEPGRAM_API_KEY`, `ELEVENLABS_API_KEY`, `STRIPE_*`, `AWS_*` + `S3_BUCKET`
- Dashboard: `dashboard/.env.local` with `NEXT_PUBLIC_API_URL`; `/v1/*` proxied to `localhost:8000` via `next.config.js`

## 6.5 Local Working Demo: `pipecat-quickstart`

Standalone Pipecat CLI-scaffolded bot (Pipecat **1.6.0**) — a working, runnable version of the media-plane stack before it lives in the platform.

- **Location/layout:** `pipecat-quickstart/server/` — `bot.py`, `pyproject.toml`, `.env.example`, `Dockerfile`, `pcc-deploy.toml`; own `.venv`, own `.gitignore`. Untracked in git, NOT part of Docker Compose.
- **Run it:** `cd pipecat-quickstart/server && uv run bot.py` (WebRTC transport; see its README for the browser test UI).
- **Env keys:** `DEEPGRAM_API_KEY`, `FISH_API_KEY`, `FISH_TTS_MODEL` (default `s2.1-pro-free`), `FISH_TTS_VOICE` (default `9a9cf47702da476aa4629e2506d4a857`), `OPENCODE_ZEN_API_KEY`, `ZEN_LLM_MODEL` (default `big-pickle`).
- **Pipeline:** `DeepgramSTTService` → `OpenAILLMService` (`base_url="https://opencode.ai/zen/v1"`, model `big-pickle`) → `FishAudioTTSService` (WebSocket streaming; `settings=...Settings(model=..., voice=...)`); sets `llm.supports_developer_role = False` because big-pickle is chat-completions-only.
- **Relevance:** in-repo reference for the §7.2 orchestrator's current-API pattern (`LLMContext` + `LLMContextAggregatorPair` + `PipelineWorker`/`WorkerRunner`); `run_bot(transport, runner_args)` entry is the hook for the Telnyx transport later.

## 7. What To Work On Next (priority order)

1. **Initial Alembic migration** — generate from models (`make migrate-create`), then `make migrate`
2. **Pipecat orchestrator pipeline** — `app/orchestrator/pipeline.py` building DeepgramSTT → `LLMContextAggregatorPair` → OpenAILLM → FishAudioTTS from `AgentVersion.pipeline_config`; ALL processors given explicit names (`stt`/`llm`/`tts`/`user_agg`/`assistant_agg`) for debuggability. Primary local reference: `pipecat-quickstart/server/bot.py` (working §6.5 demo). Model on pipecat-examples `telnyx-chatbot/inbound/bot.py` (current API: `LLMContext` + `LLMContextAggregatorPair` + `PipelineWorker`, `PipelineParams(audio_in_sample_rate=8000, audio_out_sample_rate=8000)`)
3. **Telnyx telephony transport** — `app/telephony/ws.py`: WS endpoint at `/v1/ws/telnyx`, parse Telnyx `start` message (`stream_id`, `call_control_id`, from/to), build `TelnyxFrameSerializer` + `FastAPIWebsocketTransport`; dial-out via Telnyx Call Control API
4. **Webhook handlers** — real TeXML `<Stream>`, event routing (answered/hangup/DTMF), Telnyx signature verification with `TELNYX_PUBLIC_KEY`
5. **Outbound call endpoint** — wire existing `CallCreate`, `Call` status lifecycle
6. **Steer/inject** — active-call registry (in-memory `CallManager` keyed by `call_id`; Redis pub/sub later) + `POST /v1/calls/{id}/steer` `{role, content, speak}`
7. **Observability (NON-NEGOTIABLE)** — `call_id` in every log line; DEBUG-gated Pipecat frame observer; `processor:error` handler → `Call.status`; optional raw-audio dump flag for 8kHz/μ-law diagnosis
8. **Tests** — `backend/tests/` pytest (webhook TeXML, signature verify, steer, agent versioning)
9. **Dashboard** — live call view (transcript feed keyed by `call_id`) + steer panel

## 8. Decisions Locked In (prior sessions)

- **Hosting**: GCP free-tier `e2-micro` VM self-host (SSH + `tail -f`); optional Pipecat Cloud side-by-side comparison later — agent code stays portable (standard open-source Pipecat)
- **TTS**: Fish Audio (`s2.1-pro-free` model for testing; switch to `s2.1-pro` once the account has prepaid credit; voice reference_id `9a9cf47702da476aa4629e2506d4a857`) via Pipecat `FishAudioTTSService` WebSocket streaming. Deepgram stays for STT only. ElevenLabs optional later
- **Directions**: inbound AND outbound
- **Mid-call prompt injection**: in scope
- **Observability items in section 7 are required, not optional**
- **LLM for testing**: `opencode/big-pickle` via OpenCode Zen — **free** (input/output/cached). Use Pipecat `OpenAILLMService` with `base_url="https://opencode.ai/zen/v1"`, `model="big-pickle"`. NOT `OpenAIResponsesLLMService` (Zen's `/zen/v1/responses` endpoint only serves GPT models; big-pickle is chat-completions-only). Caveat: function/tool calling may be unreliable → fall back to Groq/DeepSeek if tools are needed
- **TTS for testing**: Fish Audio (`s2.1-pro-free` — free tier, no payment; voice `9a9cf47702da476aa4629e2506d4a857`) — WS streaming via Pipecat; requires `pipecat-ai[fish]` extra (`ormsgpack`). Note: paid models (`s2.1-pro`/`s2-pro`/`s1`) return HTTP 402 until the account is topped up
- **Zen key**: `OPENCODE_ZEN_API_KEY` = the `key` field for the `opencode` provider in `~/.local/share/opencode/auth.json`, or mint at `opencode.ai/auth`**

## 9. Open Questions

- Pipecat Cloud vs GCP for production → decide after the test agent runs
- ngrok (dev) vs proper TLS/domain (prod) for the `wss://` URL
- Recording (S3) and Stripe billing — deferred, not needed for the test
- Telnyx signature verification mechanics — implement and verify against live webhook sample

## 10. Useful References

- Local working demo: `pipecat-quickstart/server/bot.py` (§6.5) — verified current-API pipeline with Deepgram + Zen LLM
- Pipecat Telnyx example: `github.com/pipecat-ai/pipecat-examples/tree/main/telnyx-chatbot` — `inbound/bot.py` is the canonical current-API pattern
- Pipecat docs: `docs.pipecat.ai` — `LLMMessagesAppendFrame`, `LLMContextFrame`, `TelnyxFrameSerializer`, observers
- Telnyx trial: $5 credit, 2 concurrent calls, 10 min/call, verified number only
- Free credits: Deepgram $200 (no card), Telnyx trial credit, ElevenLabs ~10k chars/mo, OpenAI trial credit
