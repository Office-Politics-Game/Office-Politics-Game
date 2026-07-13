# profile-data Specification

## Purpose

TBD - created by archiving change 'profile-supabase-data'. Update Purpose after archive.

## Requirements

### Requirement: Member profile API

The system SHALL expose an authenticated `GET /api/profile` endpoint that returns the current member player's profile data from the `players` table after validating the Bearer token with Supabase Auth.

#### Scenario: Authenticated member loads profile

- **WHEN** a request to `GET /api/profile` includes a valid Bearer token for a Supabase user linked to a `players.auth_user_id`
- **THEN** the response status SHALL be 200
- **AND** the response body SHALL contain `profile` with the linked player's display-safe profile fields
- **AND** the response body MUST NOT include `account` or `authUserId`

#### Scenario: Missing or invalid member token

- **WHEN** a request to `GET /api/profile` has no Bearer token or has a token that Supabase Auth rejects
- **THEN** the response status SHALL be 401
- **AND** the response body SHALL contain a user-facing `message`

#### Scenario: Member token has no player record

- **WHEN** a request to `GET /api/profile` includes a valid Bearer token but no `players` row exists for the Supabase user id
- **THEN** the response status SHALL be 404
- **AND** the response body SHALL contain a user-facing `message`

---
### Requirement: Member profile page data source

The `/profile` page SHALL use `GET /api/profile` as the data source when the current browser state has a logged-in member token.

#### Scenario: Member profile request is pending

- **WHEN** a logged-in member opens `/profile` and the `GET /api/profile` request has not completed
- **THEN** the page SHALL show only a simplified loading animation for profile data
- **AND** the page MUST NOT show login guidance actions while the request is pending

#### Scenario: Member profile page renders API data

- **WHEN** a logged-in member opens `/profile`
- **THEN** the page SHALL request `GET /api/profile` with the stored auth token
- **AND** the page SHALL render the returned player profile data after the request succeeds

#### Scenario: Member profile request fails

- **WHEN** a logged-in member opens `/profile` and `GET /api/profile` fails
- **THEN** the page SHALL show an error state instead of rendering fake default player data
- **AND** the page SHALL show a login guidance action

---
### Requirement: Profile page Pinia state

The system SHALL store normalized `/profile` page display data and request state in a dedicated Pinia profile store instead of storing full profile page state in the auth store or rebuilding it only inside the page component.

#### Scenario: Member profile state is stored centrally

- **WHEN** a logged-in member profile request succeeds
- **THEN** the profile store SHALL contain the normalized profile display data
- **AND** the profile store SHALL expose request state indicating the profile is no longer loading and has no error

#### Scenario: Guest profile state is stored centrally

- **WHEN** a guest player opens `/profile` without a logged-in member token
- **THEN** the profile store SHALL contain normalized basic guest profile data from existing guest identity state
- **AND** the auth store MUST NOT be used as the owner of full guest profile page state

---
### Requirement: Guest profile basic display

The `/profile` page SHALL render basic profile data for a guest player from existing guest player state when no logged-in member token exists.

#### Scenario: Guest profile renders local guest data

- **WHEN** a visitor has a `guestPlayer` with an id in localStorage or `playerStore.currentPlayer`
- **AND** the visitor has no logged-in member token
- **THEN** the `/profile` page SHALL render the guest player's basic profile fields
- **AND** the page MUST NOT call `GET /api/profile`

---
### Requirement: Guest restricted profile areas

The `/profile` page SHALL lock member-only profile areas for guest players while preserving access to basic profile display.

#### Scenario: Guest opens member-only tab

- **WHEN** a guest player opens the matches, badges, or collection tab on `/profile`
- **THEN** the page SHALL show a login-required state for that tab
- **AND** the page SHALL provide an action that navigates to the existing login entry flow

#### Scenario: Guest attempts profile editing

- **WHEN** a guest player activates an editable profile field control
- **THEN** the page SHALL show a login-required state or disabled control
- **AND** the page MUST NOT present a saveable profile edit form

---
### Requirement: Anonymous profile state

The `/profile` page SHALL avoid showing profile content or identity guidance popups when there is no logged-in member and no guest player identity.

#### Scenario: Anonymous visitor opens profile

- **WHEN** a visitor opens `/profile` with no member token and no stored guest player id
- **THEN** the page MUST NOT show an identity-required popup
- **AND** the page MUST NOT render default fake player data
- **AND** the page MUST NOT show login guidance actions unless a profile data request has failed
