---
name: read-project
description: Use when the user asks to read project context, understand the project, read project files, or get oriented with the codebase. Front-load keywords like "read project", "project context", "understand project".
---

# Read Project Context

Read all essential project files in parallel to understand the codebase. Always read these files:

## Core Context

1. `AGENTS.md` — Agent instructions and build commands
2. `project_context.md` — Full project documentation, architecture, data model
3. `timeline.md` — Completed and pending milestones

## Configuration

4. `package.json` — Frontend dependencies and scripts
5. `functions/package.json` — Backend dependencies and scripts
6. `firebase.json` — Firebase project config and emulator ports
7. `firestore.rules` — Firestore security rules

## Source Code

8. `src/types.ts` — TypeScript interfaces (data model)
9. `src/App.tsx` — App entry point and auth gate
10. `src/components/Dashboard.tsx` — Main layout and component orchestration
11. `src/lib/firebase.ts` — Firebase SDK init and auth helpers

## Backend

12. `functions/index.js` — All Cloud Functions (read first 200 lines for overview, then grep for `exports.` to see all function definitions)

## Optional (read if relevant to the task)

- `src/components/ChatPanel.tsx` — AI chat interface
- `src/components/EventList.tsx` — Events CRUD
- `src/components/TargetList.tsx` — Targets CRUD
- `src/components/MainGoalList.tsx` — Main goals CRUD
- `database.rules.json` — RTDB security rules
- `firestore.indexes.json` — Composite indexes

## Instructions

- Read all files listed above in any order
- For `functions/index.js`, read the first 200 lines, then grep for `exports\.` to see all function definitions
- After reading, provide a brief summary of: project purpose, tech stack, current state, and any notable issues
