## Why

Players can currently click an unlocked achievement in the profile page to use it as a title, but the selected title only lives in frontend state. Refreshing, signing in again, or using another device returns the title to the unset state, which breaks the persistence expected by issue #222.

## What Changes

- Member players can save an unlocked achievement as their current profile title.
- The title is stored in the database and returned by the profile API after refresh, sign-in, or device changes.
- The backend accepts only achievements already unlocked by the current player.
- The profile achievement panel shows which achievement title is currently active.
- The achievement unlock notice is restyled with clearer copy and the existing Square UI visual language.

## Non-Goals

- Do not add a separate title catalog or player title inventory table.
- Do not support arbitrary custom title text, a clear-title API, reward granting, or title display in the game table.
- Do not change existing achievement unlock triggers.

## Capabilities

### New Capabilities

- `profile-achievement-title`: Players can persist an unlocked achievement as the current profile title and keep it after profile reload.

### Modified Capabilities

- `profile-data`: Member profile API and profile page state include the database-backed title field.

## Impact

- Affected specs: profile-achievement-title, profile-data
- Affected code:
  - New: none
  - Modified: server/src/db/schema.sql
  - Modified: server/src/services/authService.js
  - Modified: server/src/services/profileService.js
  - Modified: server/src/controllers/profileController.js
  - Modified: server/src/routes/profileRoutes.js
  - Modified: server/tests/schema.test.js
  - Modified: server/tests/profileService.test.js
  - Modified: server/tests/profileController.test.js
  - Modified: src/services/profileApi.js
  - Modified: src/stores/profileStore.js
  - Modified: src/views/ProfileView.vue
  - Modified: src/components/profile/AchievementPanel.vue
  - Modified: src/components/common/AchievementUnlockNotice.vue
  - Removed: none
