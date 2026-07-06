## Why

The friend system already supports friend lists, invitations, blocking, and login-gated access, but friend chat is still not connected. Building the backend direct chat foundation first gives later UI and Socket.IO work a stable data model and authorization contract.

## What Changes

- Add backend support for accepted friends to exchange direct text messages.
- Add a REST API contract for fetching direct message history with a friend.
- Add a REST API contract for sending a direct message to a friend.
- Add a direct message table that stores sender, receiver, content, and creation time.
- Add backend service/controller/routes and tests for friendship, blocking, empty messages, and authorized history access.

## Non-Goals

- No frontend chat UI.
- No Pinia chat store or frontend chat API wrapper.
- No Socket.IO live delivery, unread counts, read state, or typing state.
- No images, stickers, attachments, room chat, or in-game chat.

## Capabilities

### New Capabilities

- `friend-direct-chat-backend`: Defines backend persistence, REST API, authorization rules, and tests for friend direct chat.

### Modified Capabilities

(none)

## Impact

- Affected specs: friend-direct-chat-backend
- Affected code:
  - New: server/src/services/chatService.js
  - New: server/src/controllers/chatController.js
  - New: server/src/routes/chatRoutes.js
  - New: server/tests/chatService.test.js
  - New: server/tests/chatController.test.js
  - Modified: server/src/app.js
  - Modified: server/src/db/schema.sql
