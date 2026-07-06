## Why

AGENTS.md is the primary project map for coding agents, but it did not fully reflect the current packages, directory split, Socket.IO flow, and verification workflow. Updating it reduces the risk of future agents looking in stale paths, editing generated output, or missing required checks.

## What Changes

- Update AGENTS.md project overview, technology stack, fast paths, task-to-file mapping, and verification guidance.
- Document the current game component split between animations and ui.
- Document current frontend/backend commands, frontend test scripts, Vite proxy behavior, and Socket.IO file locations.
- Preserve the Spectra managed block and avoid runtime code or base spec changes.

## Non-Goals

- Do not change game logic, frontend components, backend APIs, or tests.
- Do not update README; README changes are a separate documentation adjustment.
- Do not alter the Spectra managed block markers or generated instructions.

## Capabilities

### New Capabilities

- `agent-project-guide`: AGENTS.md documents current repository structure, working conventions, commands, and verification guidance for coding agents.

### Modified Capabilities

(none)

## Impact

- Affected specs: agent-project-guide
- Affected code:
  - New: openspec/changes/update-agents-project-guide/specs/agent-project-guide/spec.md, openspec/changes/update-agents-project-guide/tasks.md
  - Modified: AGENTS.md, openspec/changes/update-agents-project-guide/proposal.md
  - Removed: (none)
