## ADDED Requirements

### Requirement: Cookie-authenticated direct-chat REST identity

The direct-chat REST routes SHALL require the existing HttpOnly authentication cookie. The server MUST derive the acting player ID exclusively from the verified request player and MUST NOT use a playerId query parameter or request-body field as authorization evidence.

#### Scenario: Authenticated member loads message history

- **WHEN** a request with a valid officePoliticsAuthToken Cookie calls GET /api/chats/direct/2/messages
- **THEN** the server calls the direct-message service with the verified request player's ID and friend ID 2
- **AND** the client does not send a playerId query parameter

#### Scenario: Authenticated member sends a message

- **WHEN** a request with a valid officePoliticsAuthToken Cookie calls POST /api/chats/direct/2/messages with content "hello"
- **THEN** the server calls the direct-message service with the verified request player's ID, friend ID 2, and content "hello"
- **AND** the client does not send a playerId request-body field

#### Scenario: Forged client identity is ignored

- **WHEN** verified player 1 sends a direct-chat request containing playerId 999 in its query or body
- **THEN** the server performs the operation as player 1
- **AND** playerId 999 is not passed to the direct-message service

#### Scenario: Unauthenticated REST access is rejected

- **WHEN** a direct-chat REST request has no valid authentication Cookie
- **THEN** the authentication middleware returns an HTTP 401 response
- **AND** the direct-message controller is not invoked

### Requirement: Credentialed Socket transport with chat event authentication

The Socket.IO client SHALL enable credentialed cross-origin requests, and the Socket.IO server SHALL allow credentials for the configured explicit origin. The server SHALL parse Cookies from the Engine.IO request without rejecting guest connections. Each chat:subscribe event MUST verify the officePoliticsAuthToken Cookie from the Socket handshake and MUST join only the verified player's chat room.

#### Scenario: Valid Cookie subscribes to the verified room

- **WHEN** a socket handshake contains a valid officePoliticsAuthToken for player 2 and the socket emits chat:subscribe with an empty payload
- **THEN** the server verifies that Cookie token
- **AND** the socket joins chat:player:2
- **AND** the acknowledgement is { ok: true, data: { playerId: 2 } }

#### Scenario: Missing or invalid Cookie is rejected

- **WHEN** a socket without a valid officePoliticsAuthToken emits chat:subscribe
- **THEN** the socket joins no player chat room
- **AND** the acknowledgement is { ok: false, error: { message: <authentication error> } }

#### Scenario: Client-supplied identity is not trusted

- **WHEN** a socket authenticated as player 2 emits chat:subscribe with token or playerId fields for another identity
- **THEN** the server ignores those fields
- **AND** the socket joins only chat:player:2

#### Scenario: Guest Socket features remain available

- **WHEN** a socket connects without an authentication Cookie
- **THEN** the server accepts the Socket.IO connection
- **AND** only chat:subscribe is denied by this capability
- **AND** room and game handler registration remains unchanged

### Requirement: Tokenless frontend chat authentication contract

The frontend chat store SHALL determine local chat availability from authStore.isLoggedIn and authStore.currentPlayer.id. The frontend MUST NOT create, read, persist, or transmit an authStore token for direct chat. The chat API wrapper MUST omit playerId from direct-chat REST requests, and chat:subscribe MUST use an empty payload.

#### Scenario: Authenticated store starts realtime chat

- **WHEN** authStore contains currentPlayer ID 2 and isLoggedIn is true without a token property
- **THEN** startRealtime emits chat:subscribe with an empty object
- **AND** realtime chat reaches the subscribed state after a successful acknowledgement

#### Scenario: Logged-out store cannot start a chat subscription

- **WHEN** authStore.isLoggedIn is false or authStore.currentPlayer.id is absent
- **THEN** the chat store does not emit chat:subscribe
- **AND** the store exposes the existing login-required message

#### Scenario: Direct-chat REST calls omit client identity

- **WHEN** the chat store loads history or sends a message for friend 3 as current player 2
- **THEN** the chat API request includes friend ID 3 and the message content when applicable
- **AND** the request includes no playerId field

### Requirement: Cookie-authenticated reconnect recovery

While realtime chat is active, a Socket.IO reconnect SHALL perform a new credentialed handshake and the chat store SHALL emit tokenless chat:subscribe again. After successful acknowledgement, the store MUST reload and merge the selected conversation when selectedFriendId exists.

#### Scenario: Reconnect restores the selected conversation

- **WHEN** an authenticated realtime chat reconnects while friend 3 is selected
- **THEN** the new Socket handshake carries the HttpOnly Cookie
- **AND** the store emits chat:subscribe with an empty payload
- **AND** the store loads friend 3 history after successful acknowledgement

#### Scenario: Reconnect without a selected conversation

- **WHEN** an authenticated realtime chat reconnects without selectedFriendId
- **THEN** the store emits chat:subscribe with an empty payload
- **AND** no direct-message history request is made
