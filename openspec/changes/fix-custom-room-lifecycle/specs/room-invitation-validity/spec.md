## ADDED Requirements

### Requirement: Pending invitation queries expose only joinable rooms

The invitation service SHALL return a pending room invitation only when the invitation is unexpired, the room status is `waiting`, the room contains fewer than four members, and `hostPlayerId` identifies a non-computer room member whose role is `host`.

#### Scenario: Invitation remains joinable

- **WHEN** an invitee loads invitations for an unexpired pending invitation to a waiting room with a valid human host and fewer than four members
- **THEN** the service SHALL include that invitation in the response

#### Scenario: Invitation room is not joinable

- **WHEN** an invitation is expired, its room is not `waiting`, its room has four members, or its room lacks a valid human host member
- **THEN** the service MUST omit that invitation from the response

##### Example: invitation visibility matrix

| Invitation | Room status | Member count | Valid human host | Expected visibility |
| --- | --- | ---: | --- | --- |
| pending and unexpired | waiting | 3 | yes | visible |
| pending and unexpired | playing | 3 | yes | hidden |
| pending and unexpired | waiting | 4 | yes | hidden |
| pending and unexpired | waiting | 2 | no | hidden |
| expired | waiting | 2 | yes | hidden |

### Requirement: Invitation acceptance revalidates room joinability

The invitation service MUST revalidate invitation status, expiration, room status, capacity, invitee membership, and valid human host membership inside the acceptance transaction before inserting the invitee.

#### Scenario: Room changes after notification is loaded

- **WHEN** an invitee accepts a previously displayed invitation after the room starts, becomes full, loses its valid host, or dissolves
- **THEN** the service MUST reject acceptance and MUST NOT insert the invitee into `game_room_players`

#### Scenario: Invitation expires before acceptance

- **WHEN** an invitee accepts an invitation whose expiration time has passed
- **THEN** the service MUST return an expiration error and MUST NOT change room membership

#### Scenario: Invitation is valid at acceptance time

- **WHEN** an invitee accepts an unexpired pending invitation to a waiting room with fewer than four members and a valid human host
- **THEN** the service SHALL add the invitee at the next available seat and SHALL mark the invitation accepted in the same transaction

### Requirement: Starting or dissolving a room invalidates pending invitations

Pending invitations MUST cease to be acceptable when their room starts or dissolves.

#### Scenario: Room starts

- **WHEN** start game commits for a waiting room
- **THEN** the backend SHALL mark every pending invitation for that room as expired with a response timestamp in the start transaction

#### Scenario: Room dissolves

- **WHEN** a waiting room is deleted because its host has no human successor
- **THEN** every invitation belonging to the deleted room SHALL be removed through the room foreign-key cascade
