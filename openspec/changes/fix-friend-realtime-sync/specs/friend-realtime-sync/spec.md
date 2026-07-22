## ADDED Requirements

### Requirement: Authenticated friend realtime subscription

The server SHALL allow an authenticated member Socket to subscribe to a personal friend room derived only from the verified HttpOnly Cookie identity. The server MUST NOT trust a player ID or token supplied in the event payload.

#### Scenario: Valid member subscribes

- **WHEN** a Socket with a valid member Cookie emits friend:subscribe with an empty payload
- **THEN** the Socket joins friend:player:<verifiedPlayerId>
- **AND** the acknowledgement returns the verified player ID

#### Scenario: Invalid member is rejected

- **WHEN** a Socket without a valid member Cookie emits friend:subscribe
- **THEN** the Socket joins no friend room
- **AND** the acknowledgement contains an error message

#### Scenario: Subscription identity changes

- **WHEN** a subscribed Socket is later verified as a different player
- **THEN** the Socket leaves the previous friend room before joining the new friend room

#### Scenario: Friend subscription stops

- **WHEN** a subscribed Socket emits friend:unsubscribe
- **THEN** it leaves only its personal friend room
- **AND** unrelated Socket rooms and listeners remain active

### Requirement: Counterparty friend data invalidation

After a successful friend request, acceptance, rejection, friend removal, block, or unblock REST mutation, the server SHALL emit friend:data-invalidated with an empty object to the other player's personal friend room. Socket delivery MUST remain non-blocking relative to the REST result.

#### Scenario: Friend request invalidates receiver data

- **WHEN** player 1 successfully sends a friend request to player 2
- **THEN** the server emits friend:data-invalidated with {} to friend:player:2
- **AND** the REST endpoint retains its existing 201 response

#### Scenario: Response mutation invalidates requester data

- **WHEN** player 2 accepts or rejects a pending request created by player 1
- **THEN** the server emits friend:data-invalidated with {} to friend:player:1

#### Scenario: Relationship mutation invalidates the other player

- **WHEN** a player successfully removes, blocks, or unblocks the other player
- **THEN** the server emits friend:data-invalidated with {} to the other player's personal friend room

#### Scenario: Failed mutation emits nothing

- **WHEN** the friend service rejects a mutation
- **THEN** the server emits no friend:data-invalidated event
- **AND** the endpoint preserves the service error status

#### Scenario: Socket delivery is unavailable

- **WHEN** a friend mutation succeeds but the Socket server is unavailable or emit throws
- **THEN** the endpoint retains its existing success response
- **AND** the mutation is not executed again

### Requirement: Friend page realtime recovery

While an authenticated member remains on the friend page, the frontend friend store SHALL maintain at most one friend realtime listener set. It SHALL reload all friend data after friend:data-invalidated and after a successful reconnect subscription. Leaving the friend page or losing authentication MUST stop friend realtime without removing unrelated Socket listeners. Realtime failure MUST NOT disable REST friend actions.

#### Scenario: Incoming invalidation refreshes the page

- **WHEN** an authenticated member on the friend page receives friend:data-invalidated
- **THEN** the friend store reloads friends, received requests, sent requests, and blocked players through the existing REST loader

#### Scenario: Reconnect recovers missed state

- **WHEN** an active friend realtime Socket reconnects
- **THEN** the store emits friend:subscribe again
- **AND** reloads all friend data after the subscription succeeds

#### Scenario: Repeated startup remains idempotent

- **WHEN** startRealtime is called repeatedly before stopRealtime
- **THEN** at most one handler exists for each friend lifecycle event
- **AND** at most one active friend subscription is created

#### Scenario: Friend page lifecycle stops realtime

- **WHEN** the member leaves the friend page or authentication becomes unavailable
- **THEN** friend-specific handlers are removed
- **AND** friend:unsubscribe is attempted
- **AND** unrelated room, game, and chat listeners remain registered

#### Scenario: Realtime subscription fails

- **WHEN** friend:subscribe returns an error acknowledgement
- **THEN** the store records a non-blocking realtime error
- **AND** existing REST loading and friend mutation actions remain available
