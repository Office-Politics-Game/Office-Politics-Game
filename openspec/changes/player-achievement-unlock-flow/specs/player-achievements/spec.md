## ADDED Requirements

### Requirement: Achievement seed data

The system SHALL provide an initial achievement catalog with unlockable achievements for friendship, room creation, game victory, and top-up actions.

#### Scenario: Initial achievements are seeded

- **WHEN** the achievement seed is executed
- **THEN** the system SHALL create achievement records for first_friend, first_room_create, first_game_win, and first_top_up
- **AND** running the seed more than once SHALL NOT create duplicate achievement records

### Requirement: Achievement unlock service

The system SHALL unlock an achievement for a player by achievement code without creating duplicate player achievement rows.

#### Scenario: Player unlocks an achievement for the first time

- **WHEN** a valid player unlocks an existing achievement code
- **THEN** the system SHALL insert one player_achievements row
- **AND** the result SHALL include the unlocked achievement data

#### Scenario: Player already unlocked the achievement

- **WHEN** the same player unlocks the same achievement code again
- **THEN** the system SHALL NOT insert another player_achievements row
- **AND** the result SHALL indicate that no new achievement was unlocked

#### Scenario: Achievement code does not exist

- **WHEN** an unlock is requested with an unknown achievement code
- **THEN** the system SHALL return a not-found error

### Requirement: Achievement unlock triggers

The system SHALL check achievement unlocks from existing player action flows.

#### Scenario: Friend acceptance unlocks first friend achievement

- **WHEN** a player accepts a friend request and completes their first accepted friendship
- **THEN** the response SHALL include first_friend in unlockedAchievements

#### Scenario: Room creation unlocks first room achievement

- **WHEN** a player creates their first room
- **THEN** the response SHALL include first_room_create in unlockedAchievements

#### Scenario: Top-up unlocks first top-up achievement

- **WHEN** a player completes their first paid top-up order
- **THEN** the response SHALL include first_top_up in unlockedAchievements

#### Scenario: Game victory unlocks first win achievement

- **WHEN** a player wins their first game
- **THEN** the response SHALL include first_game_win in unlockedAchievements

### Requirement: Achievement unlock notice

The frontend SHALL show a temporary achievement unlock notice when an API response includes newly unlocked achievements.

#### Scenario: API response includes unlocked achievements

- **WHEN** the frontend receives a response with unlockedAchievements containing at least one achievement
- **THEN** the page SHALL show an achievement unlock notice with the achievement name and description

#### Scenario: API response does not include new achievements

- **WHEN** the frontend receives a response with no newly unlocked achievements
- **THEN** the page SHALL NOT show an achievement unlock notice

### Requirement: Profile displays unlocked achievements only

The profile achievement area SHALL display only achievements the player has unlocked.

#### Scenario: Player opens profile achievements

- **WHEN** a player opens the profile achievement area
- **THEN** the page SHALL display unlocked achievement badges
- **AND** the page SHALL NOT display locked or unavailable achievements
