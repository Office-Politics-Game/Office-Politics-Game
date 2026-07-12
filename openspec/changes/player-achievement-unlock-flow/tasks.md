## 1. Backend Achievement Data

- [x] 1.1 Add Achievement seed data for first_friend, first_room_create, first_game_complete, first_game_win, and first_top_up.
- [x] 1.2 Make Achievement seed data idempotent so repeated seed runs do not create duplicates.

## 2. Backend Unlock Logic

- [x] 2.1 Implement Achievement unlock service that unlocks by playerId and achievement code.
- [x] 2.2 Ensure Achievement unlock service returns unlocked achievement data on first unlock.
- [x] 2.3 Ensure Achievement unlock service returns no new unlock when the player already has the achievement.
- [x] 2.4 Add not-found handling for unknown Achievement code.

## 3. Backend Trigger Integration

- [x] 3.1 Add Achievement unlock triggers to friend acceptance for first_friend.
- [x] 3.2 Add Achievement unlock triggers to room creation for first_room_create.
- [x] 3.3 Add Achievement unlock triggers to completed game flow for first_game_complete.
- [x] 3.4 Add Achievement unlock triggers to game victory flow for first_game_win.
- [x] 3.5 Add Achievement unlock triggers to paid top-up completion for first_top_up.
- [x] 3.6 Include unlockedAchievements in affected API responses only when new achievements are unlocked.

## 4. Frontend Display Flow

- [x] 4.1 Update Profile displays unlocked achievements only in the achievement panel.
- [x] 4.2 Add Achievement unlock notice component for newly unlocked achievements.
- [x] 4.3 Connect frontend responses with unlockedAchievements to the Achievement unlock notice.
- [x] 4.4 Ensure pages without new unlocked achievements do not show the notice.

## 5. Verification

- [x] 5.1 Add backend tests for Achievement seed data and Achievement unlock service duplicate prevention.
- [x] 5.2 Add backend tests for friend, room, completed game, game victory, and top-up Achievement unlock triggers where practical.
- [x] 5.3 Run backend tests.
- [x] 5.4 Run frontend build.
