## ADDED Requirements

### Requirement: Waiting-room operations lock during game start

The custom room frontend SHALL disable every waiting-room mutation as soon as a valid start request is submitted and SHALL keep those mutations disabled while the room status is not `waiting`.

#### Scenario: Host submits a start request

- **WHEN** the host activates Start Game for a ready waiting room
- **THEN** the frontend SHALL synchronously disable Start Game, Return to Lobby, remove player, add computer, invite friend, and ready controls before awaiting the backend response
- **THEN** repeated activation SHALL NOT send an additional room mutation

#### Scenario: Start request fails

- **WHEN** the backend rejects the start request while the room remains `waiting`
- **THEN** the frontend SHALL surface the error and SHALL restore the controls permitted by the current room state

#### Scenario: Room enters playing state

- **WHEN** the frontend receives room state with status `playing`
- **THEN** waiting-room mutation controls SHALL remain disabled until navigation to the loading route completes

### Requirement: Players explicitly leave waiting rooms

The system SHALL provide an explicit leave operation for members of a `waiting` room and SHALL NOT treat Socket disconnection, route unmounting, or subscription cancellation as a leave operation.

#### Scenario: Non-host leaves a waiting room

- **WHEN** a non-host member submits leave with a valid room code and player ID
- **THEN** the backend SHALL remove that member in one transaction, compact remaining `seatOrder` values to consecutive integers starting at 1, and broadcast the resulting room state

#### Scenario: Player leaves through Return to Lobby

- **WHEN** a waiting-room member activates Return to Lobby and the leave operation succeeds
- **THEN** the frontend SHALL clear the active room state and navigate to the lobby

#### Scenario: Leave operation fails

- **WHEN** the leave operation returns an error
- **THEN** the frontend SHALL remain on the custom room page, preserve the active room state, and display the error

#### Scenario: Leave is requested outside a waiting room

- **WHEN** a member submits leave for a room whose status is not `waiting`
- **THEN** the backend MUST reject the operation with conflict status and MUST NOT change room membership

### Requirement: Host ownership transfers to the next human member

When a host leaves a `waiting` room, the backend SHALL transfer ownership to the remaining non-computer member with the lowest prior `seatOrder` in the same transaction.

#### Scenario: Another human member can become host

- **WHEN** the host leaves a waiting room containing at least one other human member
- **THEN** the backend SHALL remove the departing host, set `hostPlayerId` to the eligible human with the lowest prior `seatOrder`, set that member role to `host`, ensure every other member is not a host, compact seats, and broadcast one committed room state

##### Example: host selection and seat compaction

- **GIVEN** seat 1 is the departing host, seat 2 is a computer, seat 3 is human player 30, and seat 4 is human player 40
- **WHEN** player 1 leaves
- **THEN** player 30 SHALL become host and the remaining players SHALL occupy seats 1, 2, and 3 in their previous relative order

#### Scenario: Computer members cannot become host

- **WHEN** the host leaves and computer members precede an eligible human member by `seatOrder`
- **THEN** the backend MUST skip every computer member when selecting the next host

### Requirement: Waiting room dissolves without a human successor

The backend SHALL dissolve a `waiting` room when its departing host leaves no other human member.

#### Scenario: Host leaves a room containing only computers

- **WHEN** the host leaves a waiting room whose remaining members are all computers
- **THEN** the backend SHALL delete the room memberships and room in one transaction and SHALL return `dissolved: true`
- **THEN** the room code MUST NOT be joinable or retrievable after commit

#### Scenario: Dissolution transaction fails

- **WHEN** deleting memberships, invitations, or the room fails before commit
- **THEN** the backend SHALL roll back the transaction and MUST NOT leave a partially dissolved room
