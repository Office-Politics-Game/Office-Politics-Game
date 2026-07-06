## Context

The backend already has friendService, friendController, friendRoutes, and existing logic that uses a `friends` relationship table with pending, accepted, and blocked states. FriendView currently shows that friend chat is not connected. This change builds only the backend foundation so later frontend UI and Socket.IO live delivery can reuse the same persistence and authorization rules.

## Goals / Non-Goals

**Goals:**

- Add a data table for direct friend text messages.
- Add chatService to centralize accepted-friend authorization, blocked relationship checks, empty message validation, and authorized history access.
- Add chatController and chatRoutes to expose REST APIs for later frontend integration.
- Add backend tests for successful message creation, non-friend rejection, blocked rejection, empty message rejection, and history access.

**Non-Goals:**

- No frontend chat UI, Pinia store, or frontend API wrapper.
- No Socket.IO live delivery, unread counts, read state, or typing state.
- No images, stickers, attachments, room chat, or in-game chat.
- No waiting-room, roomStore, or PR #163 Socket room sync changes.

## Decisions

### Store direct messages in a dedicated table

Add a `direct_messages` table with `sender_player_id`, `receiver_player_id`, `content`, and `created_at`. A message is a one-way record. Conversation history is queried with a two-way sender/receiver condition and ordered chronologically.

Alternative considered: Store messages in `friends` or `action_logs`. This was rejected because `friends` represents relationship state and `action_logs` represents game actions. Mixing chat records into either table would make authorization, retrieval, and cleanup harder to maintain.

### Put relationship authorization in chatService

chatService checks that both players exist, that the relationship is accepted, and that neither direction is blocked. Controllers only parse request/response concerns so the same rules can later be reused by Socket.IO.

Alternative considered: Query the database directly from controller handlers. This was rejected because Socket.IO live delivery will need the same message creation rules.

### Use REST API as the first backend interface

Expose `GET /api/chats/direct/:friendId/messages` and `POST /api/chats/direct/:friendId/messages`. Both endpoints identify the current player with `playerId`, matching the current friend API pattern.

Alternative considered: Implement Socket-only chat first. This was rejected because this issue is backend foundation only, REST is easier to test, and it avoids coupling this work to waiting-room Socket changes.

### Trim and validate message content before saving

Message content is converted to a string, trimmed, rejected if empty, and stored after trimming. This first backend issue does not add a product-level length limit beyond the database field type.

Alternative considered: Add message length limits and moderation in this first issue. This was rejected because those product rules are not defined yet and are not needed for the backend MVP contract.

## Implementation Contract

#### Observable behavior

- Accepted friends can send direct text messages to each other through REST APIs.
- The API stores trimmed message content and returns id, senderPlayerId, receiverPlayerId, content, and createdAt.
- A player can fetch direct message history with a specified accepted friend.
- History results contain only messages between those two players and are ordered from oldest to newest.
- Non-friends, pending relationships, blocked relationships, and missing players cannot send messages or read history.
- Empty messages are rejected with a controller-visible 400 error.

#### Interface / data shape

- `sendDirectMessage({ playerId, friendId, content })` returns `{ id, senderPlayerId, receiverPlayerId, content, createdAt }`.
- `getDirectMessages({ playerId, friendId })` returns an array of direct message objects.
- `POST /api/chats/direct/:friendId/messages` accepts body `{ playerId, content }` and returns status 201 with `{ message: "訊息已送出", directMessage }`.
- `GET /api/chats/direct/:friendId/messages?playerId=<id>` returns status 200 with `{ messages }`.
- Controllers return 400 for missing or invalid playerId, friendId, or content.
- Controllers preserve service `statusCode` values and fall back to status 500 for unexpected errors.

#### Failure modes

- Reject when `playerId` or `friendId` is not a positive integer.
- Reject when `content` trims to an empty string.
- Reject when either player does not exist.
- Reject when the friendship is not accepted.
- Reject when a blocked relationship exists in either direction.
- Apply the same authorization checks to history reads.

#### Acceptance criteria

- `npm test -- chatService.test.js` passes.
- `npm test -- chatController.test.js` passes.
- `server/src/db/schema.sql` contains the `direct_messages` table with player foreign keys.
- `server/src/app.js` mounts chat routes under `/api/chats`.

#### Scope boundaries

- Backend data, service, controller, routes, and backend tests are in scope.
- Frontend files under `src/` are out of scope.
- Socket.IO events and room/game socket handlers are out of scope.

## Risks / Trade-offs

- [Risk] The current API accepts `playerId` from the request body/query, so a future frontend bug could send the wrong player id. -> Mitigation: This follows the existing friend API pattern for now; a later auth middleware change can derive player id from token.
- [Risk] History has no pagination in the MVP, so large conversations can become expensive. -> Mitigation: The data model supports adding a future limit/before cursor without changing stored messages.
- [Risk] `server/src/db/schema.sql` does not fully document the existing `friends` table creation even though friendService uses it. -> Mitigation: This change only adds `direct_messages`; a separate schema cleanup issue can address the existing friends table drift.
