## MODIFIED Requirements

### Requirement: Member profile API

The system SHALL expose an authenticated `GET /api/profile` endpoint that returns the current member player's profile data from the `players` table after validating the Bearer token with Supabase Auth. The returned display-safe profile fields SHALL include the player's persisted `title` value when one has been saved.

#### Scenario: Authenticated member loads profile

- **WHEN** a request to `GET /api/profile` includes a valid Bearer token for a Supabase user linked to a `players.auth_user_id`
- **THEN** the response status SHALL be 200
- **AND** the response body SHALL contain `profile` with the linked player's display-safe profile fields
- **AND** the response body SHALL contain `profile.title` as the saved title value or `null` when no title has been saved
- **AND** the response body MUST NOT include `account` or `authUserId`

#### Scenario: Missing or invalid member token

- **WHEN** a request to `GET /api/profile` has no Bearer token or has a token that Supabase Auth rejects
- **THEN** the response status SHALL be 401
- **AND** the response body SHALL contain a user-facing `message`

#### Scenario: Member token has no player record

- **WHEN** a request to `GET /api/profile` includes a valid Bearer token but no `players` row exists for the Supabase user id
- **THEN** the response status SHALL be 404
- **AND** the response body SHALL contain a user-facing `message`
