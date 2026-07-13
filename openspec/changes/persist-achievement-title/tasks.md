## 1. Database and Profile Output

- [x] 1.1 Store the selected title on players: add nullable `title` to `server/src/db/schema.sql` and update the schema test to verify the column exists.
- [x] 1.2 Member profile API: update auth/profile player formatting so `GET /api/profile` returns display-safe `profile.title` while still excluding `account` and `authUserId`.
- [x] 1.3 Add backend profile tests for title present, title null, and unchanged 401/404 behavior.

## 2. Title Save API

- [x] 2.1 Validate title selection through existing achievement rows: implement `PATCH /api/profile/title` service behavior that gets the current player from the Bearer token and updates `players.title` only for an unlocked achievement code.
- [x] 2.2 Achievement title persistence: add controller and route behavior returning `{ profile }` on success, 403 for locked achievements, 404 for unknown achievements, and 401 for missing or invalid tokens.
- [x] 2.3 Add backend API/service tests for successful save, locked achievement preserving the old title, unknown achievement preserving the old title, and invalid token.

## 3. Profile Frontend Integration

- [x] 3.1 Keep profile store as the display owner: add a profile API client method and update the profile store so member title display follows the API profile instead of title localStorage.
- [x] 3.2 Profile achievement title UI: update `ProfileView` and `AchievementPanel` so selecting an unlocked achievement calls the title API, updates the sidebar title on success, and disables the active title item.
- [x] 3.3 Title save fails: keep the displayed title unchanged when the title API fails and show a user-facing failure message.

## 4. Notice Styling and Verification

- [x] 4.1 Reuse the existing notice component: update `AchievementUnlockNotice` copy, close-button aria label, spacing, colors, and Square UI styling without adding another toast or modal system.
- [x] 4.2 Achievement unlock notice presentation: verify `unlockedAchievements` shows name and description, manual close works, and timeout clearing does not affect profile title state.
- [x] 4.3 Run verification: `cd server && npm test`, `npm run build`, and manual acceptance for saved title persistence after refresh/sign-in plus locked achievement rejection.
