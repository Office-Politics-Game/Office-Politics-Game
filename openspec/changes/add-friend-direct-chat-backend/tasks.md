## 1. Data Model

- [x] 1.1 Deliver Store direct messages in a dedicated table by adding a `direct_messages` schema contract with sender, receiver, content, and created_at fields; verify by content review of `server/src/db/schema.sql` and by `npm test -- chatService.test.js` after service tests are added.

## 2. Service Rules And Tests

- [x] 2.1 Cover Direct messages can be sent between accepted friends and Trim and validate message content before saving with `server/tests/chatService.test.js` cases for accepted friend success, non-friend rejection, blocked rejection, and whitespace rejection; verify by running `npm test -- chatService.test.js` and seeing the tests fail before implementation.
- [x] 2.2 Implement Put relationship authorization in chatService so `sendDirectMessage({ playerId, friendId, content })` stores trimmed messages only for accepted, unblocked friends; verify by running `npm test -- chatService.test.js`.
- [x] 2.3 Cover Direct message history is visible only to authorized friends with `server/tests/chatService.test.js` cases for chronological accepted-friend history and unauthorized or blocked history rejection; verify by running `npm test -- chatService.test.js`.
- [x] 2.4 Implement Direct message history is visible only to authorized friends in chatService so `getDirectMessages({ playerId, friendId })` returns only the two-player conversation ordered oldest to newest; verify by running `npm test -- chatService.test.js`.

## 3. REST API

- [x] 3.1 Cover Direct chat REST API exposes backend messaging and Use REST API as the first backend interface with `server/tests/chatController.test.js` cases for POST success, POST validation failure, GET success, and GET validation failure; verify by running `npm test -- chatController.test.js` and seeing the tests fail before controller/routes implementation.
- [x] 3.2 Implement Direct chat REST API exposes backend messaging with `POST /api/chats/direct/:friendId/messages` and `GET /api/chats/direct/:friendId/messages`, preserving service status codes and JSON shapes; verify by running `npm test -- chatController.test.js`.
- [x] 3.3 Register chat routes under `/api/chats` in the Express app so backend callers can reach the direct chat endpoints; verify by source review of `server/src/app.js` and by `npm test -- chatController.test.js`.

## 4. Final Verification

- [x] 4.1 Run backend verification for the completed friend direct chat backend by executing `npm test -- chatService.test.js chatController.test.js`; verify all direct chat tests pass.
- [x] 4.2 Confirm the change stays within backend-only scope with no `src/` frontend changes and no Socket.IO event changes; verify with `git diff --stat` and source review.

## 5. Fresh Database Completeness

- [x] 5.1 Cover Friend relationships have schema support and Document friend relationships in schema.sql by adding a `friends` table with player foreign keys, status validation, self-relationship prevention, and unordered pair uniqueness; verify by content review of `server/src/db/schema.sql`, `spectra validate add-friend-direct-chat-backend`, and `npm.cmd test -- --runInBand --cacheDirectory=.jest-cache`.
