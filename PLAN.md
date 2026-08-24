# PLAN.md — Business Tools Demo (pipecat-quickstart)

> Handoff doc for the next session. Status: **implemented, code-level verified; live voice test pending**.

## Progress (2026-08-01 session)

- ✅ `server/business_tools.py` created: `ReservationStore` (in-memory, per-30-min slot
  capacity 20, seeded with ABCD12/EFGH34/IJKL56), 4 tools (`check_availability`,
  `get_booking`, `create_booking`, `cancel_booking`), module `default_store`, `ALL_TOOLS`.
- ✅ `server/control_server.py` created: in-process aiohttp on `127.0.0.1:8001`
  (`/health`, `/data`, `/data/update`, `/control`), guarded single start, worker registry,
  `LLMMessagesAppendFrame` + `LLMRunFrame` push on update.
- ✅ Later same session: added **create** (`POST /data/create` {name, date_time, party_size},
  no push) and **cancel** (`POST /data/cancel` {confirmation}, pushes) to the operator
  control; `/control` reworked to three sections (create/update/cancel) with JS table
  refresh — **no page reload**, form values persist, errors red/success green. Fixed the
  update form's old reload-wipes-error behavior.
- ✅ `server/bot.py` edited: reservation-desk system prompt, `LLMContext(tools=ALL_TOOLS)`,
  `PipelineWorker(app_resources={"store": default_store})`, control server started + worker
  registered/unregistered.
- ✅ Verification (headless):
  - `ruff check .` + `ruff format --check .` clean in `server/`.
  - Store unit checks pass (availability, create/get/cancel, apply_update diff, capacity).
  - Tool schemas extract correctly (props: date_time/party_size, confirmation, name…).
  - Control server endpoints: `/health` 200, `/data` 200, `/data/update` 200 (diff
    old/new) + 400 on bad code, `/control` 200 (HTML).
  - Frame-push path verified with stub worker: update → worker receives
    `LLMMessagesAppendFrame` (developer role, voice-safe) + `LLMRunFrame`.
  - `uv run bot.py` boots cleanly; dev runner banner needs **`PYTHONIOENCODING=utf-8`**
    on this Windows box (cp1252 can't encode the Unicode banner — pre-existing, unrelated
    to our code).
- ⏳ **Not yet done: live voice flow test** (big-pickle tool-calling reliability gate).
- Skipped: `project_context.md` (no such file exists in repo; PLAN.md is the handoff doc).

## Goal

Turn `pipecat-quickstart` into a restaurant **reservation-desk voice agent**:

- The caller asks questions answered from **live data** (via function-calling tools) and
  confirms a booking that **updates** that data.
- An **operator can manually update the live data** through a `/control` web page; when a
  change contradicts what the agent already told the caller, the agent is **informed and
  proactively updates the caller** mid-call (the production "steer/inject" mechanism, local
  version).

## Ground truth (already known)

- Demo: `pipecat-quickstart/server/bot.py` — Pipecat **1.6.0** cascade:
  `DeepgramSTTService -> LLMContextAggregatorPair -> OpenAILLMService(Zen big-pickle,
  base_url=zen/v1, supports_developer_role=False) -> FishAudioTTSService`. WebRTC transport
  via dev runner; `uv run bot.py` from `server/`; prebuilt voice UI at `localhost:7860`.
- `.venv` ready; `server/.env` populated (DEEPGRAM_API_KEY, FISH_API_KEY, OPENCODE_ZEN_API_KEY).
- Verified installed in venv: `aiohttp`, `fastapi`, `uvicorn`. No new deps needed.
- **Tool API (1.6.0, verified in installed source):**
  - Tool = plain async fn `async def fn(params: FunctionCallParams, arg: type, ...)`.
  - First param named `params` is bound to `FunctionCallParams`
    (`pipecat.services.llm_service`). It has `result_callback`, `app_resources`,
    `pipeline_worker`, `context`.
  - **The handler must call `await params.result_callback(result)` itself** — the framework
    does NOT auto-deliver the return value of a DirectFunction.
  - Register: `LLMContext(tools=[fn1, fn2, ...])`.
  - Share state: `PipelineWorker(app_resources={"store": store}, ...)` ->
    `params.app_resources`.
  - Inject/proactive turn: `await worker.queue_frames([LLMMessagesAppendFrame(messages=[
    {"role": "developer", "content": "..."}]), LLMRunFrame()])` (both in `pipecat.frames.frames`).
    The `supports_developer_role=False` setting converts `developer` -> `user` for big-pickle.
- Big-pickle tool calling **may be unreliable** (project_context §8). **Decision: big-pickle
  first; if it never emits tool calls, STOP and ask the user** about a fallback LLM
  (Groq/DeepSeek). Tool code must stay LLM-agnostic.
- §3 caveat (project_context): injected frames are dropped on user interruption — acceptable
  for the demo; production steering persists via a custom aggregator.
- Do NOT read the whole `pipecat-quickstart/.venv` unless needed; keep reads targeted.

## Files

1. `server/business_tools.py` (new)
   - `ReservationStore` — in-memory, seeded; reservations
     `{confirmation, name, date_time, party_size, status}`; per-slot capacity; booking
     reduces availability ("realtime" proof). Datetime format `"YYYY-MM-DD HH:MM"` (24h),
     documented in docstrings. Module-level `default_store` singleton shared by tools,
     control server, and sessions.
   - Tools (read store via `params.app_resources["store"]`):
     - `check_availability(date_time, party_size)` — read
     - `get_booking(confirmation)` — read
     - `create_booking(name, date_time, party_size)` — write on confirmation, returns code
     - `cancel_booking(confirmation)` — write
     - Each calls `await params.result_callback(result)`.
2. `server/control_server.py` (new) — operator manual updates (Option A)
   - In-process `aiohttp` server started once (module singleton, guarded start) inside the
     bot's event loop.
   - `POST /data/update` `{"confirmation": ..., "to_date_time": ..., "party_size": n}` ->
     apply to store; **diff old vs new**; push `LLMMessagesAppendFrame` + `LLMRunFrame()` to
     all registered workers -> agent proactively informs the caller.
   - `GET /data` — current store state (JSON) for the operator page.
   - `GET /control` — operator form + live store view.
   - `GET /health`.
   - Registry of active `PipelineWorker`s (register/unregister per session).
3. `server/bot.py` (edit)
   - `LLMContext(tools=[four tools])`; `PipelineWorker(app_resources={"store": default_store},
     ...)`.
   - System prompt -> reservation-desk persona + voice-safe guard + when-to-call-each-tool
     guidance (check -> confirm -> book -> speak code).
   - Keep worker reference; register with the control server; start it once.
4. `project_context.md` — "Working Plan — Business Tools Demo" section (scenario, tools,
   live data, operator update/inform flow, verification results, production mapping).
5. `PLAN.md` (this file) — keep updated as the session proceeds.

## Verification (manual, big-pickle only)

1. `uv run bot.py` -> prebuilt UI (localhost:7860): ask availability -> book under a name ->
   get confirmation code -> ask status by code -> cancel.
2. Mid-call: operator updates the caller's booking via `/control` (or
   `curl -X POST http://127.0.0.1:8001/data/update -H "Content-Type: application/json" -d '{...}'`)
   -> agent proactively tells the caller about the change.
3. `ruff check .` clean in `server/`.

## Production mapping (later sessions)

- Tools -> per-agent `AgentVersion.tools_config`; handlers become thin adapters over real
  services (Postgres).
- `ReservationStore` -> tenant-scoped DB tables.
- `app_resources` -> per-call `CallManager` resources.
- `/data/update` + frame push -> `POST /v1/calls/{id}/steer`; production steering persists
  via a custom aggregator (§3).

## Control server port

`127.0.0.1:8001` (avoids backend :8000 / dashboard :3000 / prebuilt UI :7860).
