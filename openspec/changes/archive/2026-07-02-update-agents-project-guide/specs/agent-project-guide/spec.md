## ADDED Requirements

### Requirement: Current project guide

AGENTS.md SHALL describe the current repository structure, technology stack, command workflow, and verification expectations used by coding agents in this project.

#### Scenario: Agent reads current guidance

- **WHEN** a coding agent reads AGENTS.md before modifying the project
- **THEN** the guide identifies the current frontend stack, backend stack, main source directories, game component subdirectories, common commands, and verification checklist.

### Requirement: Preserve managed Spectra instructions

AGENTS.md MUST preserve the existing Spectra managed instruction block and its start/end markers while updating the general project guidance outside that block.

#### Scenario: Spectra block remains intact

- **WHEN** AGENTS.md is updated for current project guidance
- **THEN** the SPECTRA:START and SPECTRA:END marker block remains present and unmodified in meaning.

### Requirement: Documentation-only change

The update SHALL NOT modify runtime source code, package dependencies, generated build output, or application behavior.

#### Scenario: Documentation update has no runtime impact

- **WHEN** the change is implemented
- **THEN** modified files are limited to AGENTS.md and Spectra change artifacts, aside from pre-existing unrelated worktree changes.
