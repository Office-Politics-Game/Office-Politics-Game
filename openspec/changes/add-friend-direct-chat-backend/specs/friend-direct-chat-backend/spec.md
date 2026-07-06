## ADDED Requirements

### Requirement: Direct messages can be sent between accepted friends

The backend SHALL allow a player to send a direct text message to another player only when the two players have an accepted friendship and neither direction of the relationship is blocked. The backend MUST store the trimmed message content with sender, receiver, and creation time.

#### Scenario: Accepted friend sends a direct message

- **WHEN** player 1 sends content " hello " to player 2 and their friendship status is accepted
- **THEN** the backend stores one direct message from player 1 to player 2 with content "hello"
- **THEN** the backend returns the stored direct message with id, senderPlayerId, receiverPlayerId, content, and createdAt

#### Scenario: Non-friend direct message is rejected

- **WHEN** player 1 sends content "hello" to player 3 and no accepted friendship exists between them
- **THEN** the backend rejects the request and stores no direct message

#### Scenario: Blocked direct message is rejected

- **WHEN** player 1 sends content "hello" to player 2 and either player has a blocked relationship with the other
- **THEN** the backend rejects the request and stores no direct message

#### Scenario: Empty direct message is rejected

- **WHEN** player 1 sends content containing only whitespace to player 2
- **THEN** the backend rejects the request and stores no direct message

### Requirement: Direct message history is visible only to authorized friends

The backend SHALL return direct message history between the requesting player and a specified accepted friend only when the friendship is accepted and not blocked. The backend MUST return messages in chronological order from oldest to newest.

#### Scenario: Accepted friend history is returned

- **WHEN** player 1 requests direct message history with player 2 and they have accepted friendship
- **THEN** the backend returns only messages where sender and receiver are player 1 and player 2
- **THEN** the messages are ordered from oldest to newest by creation time and id

#### Scenario: Unauthorized history is rejected

- **WHEN** player 1 requests direct message history with player 3 and no accepted friendship exists between them
- **THEN** the backend rejects the request and returns no direct messages

#### Scenario: Blocked history is rejected

- **WHEN** player 1 requests direct message history with player 2 and either player has a blocked relationship with the other
- **THEN** the backend rejects the request and returns no direct messages

### Requirement: Direct chat REST API exposes backend messaging

The backend SHALL expose REST endpoints for direct chat history and direct message creation under `/api/chats`. The endpoints MUST preserve service validation errors and return consistent JSON response shapes.

#### Scenario: REST direct message creation succeeds

- **WHEN** a client sends `POST /api/chats/direct/2/messages` with body `{ "playerId": 1, "content": "hello" }`
- **THEN** the backend responds with status 201 and JSON containing `message` and `directMessage`

#### Scenario: REST direct message creation validation fails

- **WHEN** a client sends `POST /api/chats/direct/2/messages` without valid `playerId` or `content`
- **THEN** the backend responds with status 400 and JSON containing `message`

#### Scenario: REST direct message history succeeds

- **WHEN** a client sends `GET /api/chats/direct/2/messages?playerId=1`
- **THEN** the backend responds with status 200 and JSON containing `messages`

#### Scenario: REST direct message history validation fails

- **WHEN** a client sends `GET /api/chats/direct/2/messages` without valid `playerId`
- **THEN** the backend responds with status 400 and JSON containing `message`
