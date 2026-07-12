## ADDED Requirements

### Requirement: Player achievement list API

The system SHALL expose an API that returns the achievement catalog with the selected player's unlock status.

#### Scenario: Player loads achievement list

- **WHEN** a request is made to GET /api/players/1/achievements for an existing player
- **THEN** the response status SHALL be 200
- **AND** the response body SHALL contain achievements as an array
- **AND** each achievement SHALL include id, code, name, description, category, rewardCurrency, rewardAmount, isUnlocked, and unlockedAt

#### Scenario: Achievement has not been unlocked

- **WHEN** an achievement exists in the catalog but the player has no matching player achievement row
- **THEN** the returned achievement SHALL have isUnlocked set to false
- **AND** unlockedAt SHALL be null

#### Scenario: Achievement has been unlocked

- **WHEN** an achievement exists in the catalog and the player has a matching player achievement row
- **THEN** the returned achievement SHALL have isUnlocked set to true
- **AND** unlockedAt SHALL contain the unlock timestamp

#### Scenario: Player does not exist

- **WHEN** a request is made for a player id that does not exist
- **THEN** the response status SHALL be 404
- **AND** the response body SHALL contain a user-facing message

### Requirement: Achievement reward metadata

The system SHALL store reward metadata on achievements without granting rewards during achievement list loading.

#### Scenario: Achievement includes reward metadata

- **WHEN** the player achievement list is loaded
- **THEN** each achievement SHALL include rewardCurrency and rewardAmount
- **AND** loading the list SHALL NOT change the player's coins, gems, or tickets balance

### Requirement: Profile achievement tab display

The profile achievement tab SHALL display achievement data from the player achievement list API for logged-in member players.

#### Scenario: Member opens achievement tab

- **WHEN** a logged-in member opens the profile achievement tab
- **THEN** the page SHALL request that member player's achievements
- **AND** the page SHALL render unlocked and locked achievements with distinct visual states

#### Scenario: Achievement request fails

- **WHEN** the achievement request fails
- **THEN** the page SHALL remain usable
- **AND** the page SHALL show or store an error message for the achievement area

#### Scenario: Guest opens achievement tab

- **WHEN** a guest profile opens the achievement tab
- **THEN** the page SHALL keep the existing member-only locked state
- **AND** the page SHALL NOT request player achievements
