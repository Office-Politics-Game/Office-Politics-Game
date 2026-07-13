## 1. Tests First

- [x] 1.1 Cover Direct chat frontend API wrapper and Keep direct chat API access in a dedicated chatApi module by updating tests/friend-api-integration.test.mjs to expect getDirectMessages and sendDirectMessage wrappers targeting /chats/direct/:friendId/messages; verify by running node tests/friend-api-integration.test.mjs and seeing it fail because src/services/chatApi.js does not exist yet.
- [x] 1.2 Cover Direct chat state management and Keep message state in a dedicated chatStore by updating tests/friend-api-integration.test.mjs to expect a chat store with loadMessages, sendMessage, clearChatData, conversations, loading, sending, and blank-message validation; verify by running node tests/friend-api-integration.test.mjs and seeing it fail because src/stores/chatStore.js does not exist yet.
- [x] 1.3 Cover Friend page direct chat panel, Render the MVP chat panel inside FriendView right pane, and Use REST-only behavior for the first frontend MVP by updating tests/friend-api-integration.test.mjs to expect FriendChatPanel integration, removal of the not-connected placeholder, and no Socket.IO chat additions; verify by running node tests/friend-api-integration.test.mjs and seeing it fail before implementation.

## 2. REST MVP Implementation

- [x] 2.1 Implement Direct chat frontend API wrapper in src/services/chatApi.js so frontend callers can fetch history and send messages through the existing REST endpoints; verify with node tests/friend-api-integration.test.mjs.
- [x] 2.2 Implement Direct chat state management in src/stores/chatStore.js so conversations are keyed by friendId, selected friend messages load from REST, blank messages are blocked before API calls, successful sends append directMessage, and auth/friend errors are surfaced; verify with node tests/friend-api-integration.test.mjs.
- [ ] 2.3 Implement Friend page direct chat panel in src/components/friend/FriendChatPanel.vue so the selected friend conversation shows loading, empty, error, message direction, input, and disabled sending states using Square UI styling; verify with node tests/friend-api-integration.test.mjs and npm run build.
- [ ] 2.4 Wire Friend page direct chat panel into src/views/FriendView.vue so authenticated players see chat for the selected friend, unauthenticated players keep the login-required state, and no-selected-friend state prompts selection; verify with node tests/friend-api-integration.test.mjs and npm run build.

## 3. Final Verification

- [ ] 3.1 Verify the REST-only frontend MVP by running node tests/friend-api-integration.test.mjs and npm run build, then reviewing source to confirm no Socket.IO live delivery, unread counts, typing state, read state, pagination, or backend changes were added.
