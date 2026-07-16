## ADDED Requirements

### Requirement: Achievement title persistence

The system SHALL allow an authenticated member player to save one unlocked achievement as the player's current profile title.

#### Scenario: Member saves an unlocked achievement as title

- **WHEN** a request to `PATCH /api/profile/title` includes a valid Bearer token and body `{ "achievementCode": "first_game_win" }` for an achievement unlocked by the current player
- **THEN** the response status SHALL be 200
- **AND** the response body SHALL contain `profile.title` equal to the selected achievement name
- **AND** a later authenticated `GET /api/profile` request for the same player SHALL return the same `profile.title`

#### Scenario: Member attempts to save a locked achievement as title

- **WHEN** a request to `PATCH /api/profile/title` includes a valid Bearer token and an `achievementCode` that exists but has no `player_achievements` row for the current player
- **THEN** the response status SHALL be 403
- **AND** the response body SHALL contain a user-facing `message`
- **AND** the player's existing profile title SHALL NOT change

#### Scenario: Member attempts to save an unknown achievement as title

- **WHEN** a request to `PATCH /api/profile/title` includes a valid Bearer token and an `achievementCode` that does not exist
- **THEN** the response status SHALL be 404
- **AND** the response body SHALL contain a user-facing `message`
- **AND** the player's existing profile title SHALL NOT change

#### Scenario: Missing or invalid token when saving title

- **WHEN** a request to `PATCH /api/profile/title` has no Bearer token or has a token that Supabase Auth rejects
- **THEN** the response status SHALL be 401
- **AND** the response body SHALL contain a user-facing `message`

### Requirement: Profile achievement title UI

The member profile achievement area SHALL let the player set only displayed unlocked achievements as the current profile title.

#### Scenario: Member uses an unlocked achievement title

- **WHEN** a member opens the profile achievement tab and activates the use-title control on an unlocked achievement
- **THEN** the frontend SHALL send that achievement code to `PATCH /api/profile/title`
- **AND** the profile sidebar SHALL show the title returned by the API after the request succeeds

#### Scenario: Current title is already selected

- **WHEN** an unlocked achievement name matches the current profile title
- **THEN** the achievement item SHALL show that it is currently in use
- **AND** the use-title control for that achievement SHALL be disabled

##### Example: First win is active

- **GIVEN** the current member profile title is `第一次遊戲勝利`
- **AND** the achievement list contains unlocked achievement `first_game_win` named `第一次遊戲勝利`
- **WHEN** the member views the profile achievement tab
- **THEN** the `first_game_win` item SHALL show the active title state
- **AND** its use-title control SHALL be disabled

#### Scenario: Title save fails

- **WHEN** the title save request fails
- **THEN** the profile title displayed on the page SHALL remain unchanged
- **AND** the player SHALL receive a user-facing failure message

##### Example: Locked achievement rejected

- **GIVEN** the current member profile title is `第一次遊戲勝利`
- **WHEN** the member attempts to save locked achievement `first_friend` and the API returns 403
- **THEN** the profile title displayed on the page SHALL remain `第一次遊戲勝利`
- **AND** the achievement panel SHALL show a failure message

### Requirement: Achievement unlock notice presentation

The frontend SHALL show achievement unlock notices with clear Traditional Chinese text and a visually tidy style that matches the existing profile UI tokens.

#### Scenario: Achievement unlock notice is shown

- **WHEN** the frontend receives an API response with `unlockedAchievements` containing at least one achievement
- **THEN** the notice SHALL show a title indicating a new achievement was unlocked
- **AND** each unlocked achievement SHALL show its name and description
- **AND** the notice SHALL provide a close control with an accessible label

#### Scenario: Achievement unlock notice auto clears

- **WHEN** an achievement unlock notice has been visible for the configured timeout
- **THEN** the notice SHALL clear without changing profile title state

##### Example: Notice clears after timeout

- **GIVEN** the achievement notice is showing unlocked achievement `first_game_win`
- **AND** the current profile title is `尚未設定`
- **WHEN** the configured notice timeout elapses
- **THEN** the notice SHALL be hidden
- **AND** the current profile title SHALL remain `尚未設定`
