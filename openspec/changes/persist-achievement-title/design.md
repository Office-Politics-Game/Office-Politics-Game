## Context

The profile page already renders `player.title`, and the achievement panel already emits a use-title event. The missing behavior is persistence: the selected title is not written to the database. Achievement data already exists through `achievements` and `player_achievements`, so unlocked achievements can be reused as the allowed title source.

## Goals / Non-Goals

**Goals:**

- Let member players save an unlocked achievement as the current profile title.
- Return the saved title from `GET /api/profile` after refresh, sign-in, or device changes.
- Mark the currently active title in the achievement panel.
- Improve achievement unlock notice copy and visual polish.

**Non-Goals:**

- Do not add a title catalog, title inventory, or non-achievement title source.
- Do not support arbitrary custom title text.
- Do not sync the title into game tables, rankings, or chat.
- Do not change achievement unlock conditions or add achievement types.

## Decisions

### Store the selected title on players

Add a nullable `title` column to `players` and store the current achievement name there. This is the smallest durable model because the current requirement needs only one active title, not history or multiple equipment slots.

The alternative is a `player_equipped_titles` table storing an achievement id. That is heavier than the current need. Add it later only if titles need history, categories, or non-achievement sources.

### Validate title selection through existing achievement rows

`PATCH /api/profile/title` gets the current player from the Bearer token, then checks `achievementCode` against `achievements` and `player_achievements`. Only an achievement unlocked by the current player can update `players.title`.

This prevents clients from sending arbitrary title strings or manually using locked achievements.

### Keep profile store as the display owner

After a successful title save, normalize the returned `profile` into `profileStore.profile`. Stop using title localStorage as the member title source; member profile display follows the API. Guest profile display remains local.

### Reuse the existing notice component

Keep the existing `AchievementUnlockNotice` event flow and auto-clear behavior. Adjust only text, spacing, colors, close label, and Square UI styling. Do not add another toast or modal system.

## Risks / Trade-offs

- [Risk] `players.title` stores the achievement name, so later achievement renames do not automatically update saved titles. -> Mitigation: accept stable display text for this version; switch to achievement id later only if rename-following is required.
- [Risk] Existing players have no title. -> Mitigation: make the column nullable and let the frontend display the existing unset label.
- [Risk] Old browser localStorage title can differ from the database. -> Mitigation: member profiles use API `title` as the source of truth.

## Migration Plan

1. Add nullable `title` to `players` in `server/src/db/schema.sql`.
2. Update backend profile formatting so token verification, login profile data, and `GET /api/profile` include title.
3. Add `PATCH /api/profile/title` service, controller, and route behavior.
4. Update frontend profile API, store, view, and achievement panel to call the title API.
5. Restyle the achievement unlock notice.
6. Verify with backend tests and frontend build.

## Open Questions

None. Use achievement name as the saved title text. Return `null` when no title is saved, and let the frontend display the unset label.
