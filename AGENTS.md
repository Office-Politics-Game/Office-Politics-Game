# AGENTS.md

This file gives coding agents the project map and working conventions for this repository.

## Project Overview

Office Politics Game is a Vue 3 + Vite card game prototype with an Express backend. The frontend contains the lobby, room, game table, animations, and mock/demo views. The backend owns room/session routes, game rules, deck/hand/discard flow, player state, and PostgreSQL database access.

## Repository Structure

- `src/`: Frontend application code.
  - `main.js`: Vue app bootstrap.
  - `App.vue`: Root app shell.
  - `router/`: Vue Router route definitions.
  - `views/`: Page-level screens such as entry, lobby, game room, game table, result, and animation/card-play demos.
  - `components/`: Reusable Vue components.
    - `components/game/`: In-game table, cards, player seats, turn status, settings, and card animations.
    - `components/gameRoom/`: Waiting room, matching, invite/join room UI, and room menus.
    - `components/login/`, `components/register/`, `components/result/`, `components/menu/`, `components/common/`: Feature-specific UI components.
  - `stores/`: Pinia stores for auth, player, room, and game state.
  - `services/`: Frontend API clients and client-side service helpers.
  - `composables/`: Shared Vue composition utilities.
  - `mocks/`: Mock game data and local card deck helpers used by demos/tests.
  - `constants/`: Shared frontend constants.
  - `assets/`: Images, videos, and global styles.
- `server/`: Backend Express application.
  - `src/app.js`: Server entry point.
  - `src/routes/`: Express route modules.
  - `src/controllers/`: Request handlers.
  - `src/services/`: Game/business logic services.
  - `src/game/`: Initial game state and deck definitions.
  - `src/db/`: PostgreSQL connection, schema, and card seed script.
  - `tests/`: Jest tests for backend services, database schema, and game flow.
- `tests/`: Frontend-oriented Node test scripts for game state, card interaction, table layout, and animation behavior.
- `public/`: Static public assets served by Vite.
- `dist/`: Vite build output. Do not edit generated files here by hand.
- `openspec/`: Specification/change documentation area.
- `.agents/`: Local agent skill/configuration assets.
- `.vscode/`: Editor workspace settings.

## Common Commands

Run commands from the repository root unless noted.

```powershell
npm run dev
npm run build
npm run preview
```

Backend commands are run from `server/`.

```powershell
cd server
npm run dev
npm test
npm run seed:cards
```

The root package currently has no test script. Frontend test files in `tests/` are plain `.mjs` scripts; run the relevant file directly with Node when changing the behavior it covers.

```powershell
node tests\mock-game-state.test.mjs
node tests\card-play-interaction.test.mjs
```

## Development Notes

- Use Vue 3 single-file component conventions already present in `src/views` and `src/components`.
- Keep page-level orchestration in `views/`, reusable UI in `components/`, API calls in `services/`, and shared client state in `stores/`.
- Game rule changes should usually be made in backend `server/src/services/` first, then mirrored in frontend mocks or UI expectations only where needed.
- Keep backend controller modules thin: parse request/response concerns there, and put reusable logic in services.
- Update or add focused tests when touching game flow, card effects, turn order, deck/hand/discard behavior, or database schema.
- Avoid editing generated output in `dist/` or dependency folders such as `node_modules/`.
- Preserve existing assets under `src/assets/`; add new assets to the most specific existing folder when possible.

## Environment And Data

- Root `.env` exists locally and may contain machine-specific values. Do not commit secrets.
- Backend database code lives in `server/src/db/`; schema changes should be reflected in `server/src/db/schema.sql` and covered by `server/tests/schema.test.js` when practical.
- Card seed data is managed through `server/src/db/seedCards.js` and `npm run seed:cards` from `server/`.

## Verification Checklist

Before handing off changes, prefer the smallest verification set that covers the edited area:

- Frontend UI/component changes: `npm run build`, plus any directly related `node tests\*.test.mjs` script.
- Backend service/rule/schema changes: `cd server` then `npm test`.
- Full-stack contract changes: run both the relevant frontend checks and backend Jest tests.

If a command cannot be run because dependencies, database, or environment values are missing, mention that clearly in the handoff.
