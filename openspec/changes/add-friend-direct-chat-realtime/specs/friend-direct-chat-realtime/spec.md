## ADDED Requirements

### Requirement: Authenticated player chat subscription

The server SHALL expose a chat:subscribe Socket.IO event that accepts a member token, verifies the token through the existing authentication service, derives the player ID from the verified identity, and joins only the room named chat:player:<playerId>. The server MUST NOT trust a client-provided player ID for chat-room membership.

#### Scenario: Valid member subscribes

- **WHEN** a socket emits chat:subscribe with a valid member token for player 2
- **THEN** the server joins that socket to chat:player:2
- **AND** the acknowledgement is { ok: true, data: { playerId: 2 } }

#### Scenario: Invalid token is rejected

- **WHEN** a socket emits chat:subscribe without a token or with a token that authentication rejects
- **THEN** the socket joins no player chat room
- **AND** the acknowledgement is { ok: false, error: { message: <authentication error> } }

#### Scenario: Socket changes authenticated chat identity

- **WHEN** a socket subscribed as player 2 successfully subscribes with a valid token for player 3
- **THEN** the server leaves chat:player:2 before joining chat:player:3
- **AND** socket.data.chatPlayerId equals 3

### Requirement: Idempotent player chat unsubscription

The server SHALL expose a chat:unsubscribe Socket.IO event that leaves the room associated with socket.data.chatPlayerId and clears that chat identity. Calling the event without an active chat identity MUST succeed without leaving unrelated room or game subscriptions.

#### Scenario: Subscribed player unsubscribes

- **WHEN** a socket subscribed as player 2 emits chat:unsubscribe
- **THEN** the server leaves chat:player:2
- **AND** the acknowledgement is { ok: true, data: { playerId: 2 } }
- **AND** socket.data.chatPlayerId is cleared

#### Scenario: Socket without chat identity unsubscribes

- **WHEN** a socket without socket.data.chatPlayerId emits chat:unsubscribe
- **THEN** the acknowledgement is { ok: true, data: { playerId: null } }
- **AND** no unrelated Socket.IO room is left

### Requirement: REST-triggered direct message delivery

The existing POST /api/chats/direct/:friendId/messages endpoint SHALL remain the only direct-message write interface. After the existing service successfully persists a direct message, the controller SHALL emit chat:message with the returned directMessage to chat:player:<receiverPlayerId>. The controller MUST NOT emit when service validation or persistence fails.

#### Scenario: Persisted direct message is delivered

- **WHEN** player 1 successfully sends a REST direct message to player 2
- **THEN** the endpoint returns its existing 201 response with directMessage
- **AND** the server emits chat:message with that directMessage to chat:player:2

#### Scenario: Rejected direct message is not delivered

- **WHEN** the direct-message service rejects a non-friend, blocked, blank, or failed persistence request
- **THEN** the endpoint preserves the service error response
- **AND** the server emits no chat:message

#### Scenario: Socket delivery is unavailable after persistence

- **WHEN** the direct-message service persists a message but the Socket.IO server is unavailable or emit throws an error
- **THEN** the endpoint still returns the existing 201 response with directMessage
- **AND** the delivery error does not trigger another database write

### Requirement: Realtime conversation synchronization

The frontend chat store SHALL listen for chat:message while realtime chat is active. A valid received message SHALL be stored under the sender player's conversation even when another friend is selected. All REST history, REST send responses, and Socket.IO events MUST use one merge rule that deduplicates by message ID and orders messages by createdAt and then ID.

#### Scenario: Message arrives from a non-selected friend

- **WHEN** player 2 is viewing player 3 and receives a valid chat:message from player 1
- **THEN** the message is added to player 1's conversation
- **AND** player 3's conversation remains unchanged

#### Scenario: Duplicate message arrives from multiple sources

- **WHEN** message ID 99 exists in cached state and also appears in REST history or chat:message
- **THEN** the conversation contains exactly one message with ID 99

##### Example: merged message order

- **GIVEN** cached messages 50 at 10:00 and 52 at 10:02, and REST history contains messages 50, 51 at 10:01, and 52
- **WHEN** the store merges the history
- **THEN** the conversation IDs are 50, 51, 52

#### Scenario: Invalid Socket message is ignored

- **WHEN** chat:message lacks a valid id, senderPlayerId, or receiverPlayerId
- **THEN** the store changes no conversation

### Requirement: Reconnect subscription and selected-conversation recovery

The frontend chat store SHALL provide startRealtime and stopRealtime lifecycle actions. startRealtime MUST bind stable chat:message and connect handlers at most once, subscribe immediately with the current member token, and subscribe again after reconnect. After a reconnect subscription succeeds, the store SHALL reload and merge the currently selected friend's REST history when selectedFriendId exists.

#### Scenario: Socket reconnects with a selected friend

- **WHEN** an active realtime store reconnects while friend 2 is selected
- **THEN** the store successfully emits chat:subscribe with the current member token
- **AND** the store loads friend 2's REST history after the acknowledgement
- **AND** the loaded history is merged without duplicate message IDs

#### Scenario: Socket reconnects without a selected friend

- **WHEN** an active realtime store reconnects without selectedFriendId
- **THEN** the store successfully emits chat:subscribe
- **AND** no conversation history request is made

#### Scenario: Realtime startup is called repeatedly

- **WHEN** startRealtime is called more than once before stopRealtime
- **THEN** exactly one chat:message handler and one connect handler remain registered

### Requirement: Realtime lifecycle preserves REST chat

The friend page SHALL start realtime chat only for an authenticated member who can use the friend system. Leaving the friend page SHALL stop realtime listeners without clearing unrelated Socket.IO listeners. Logging out or clearing chat data SHALL stop realtime listeners, attempt chat:unsubscribe, and clear chat state. Realtime subscription failure MUST NOT disable REST history loading or REST message sending.

#### Scenario: Authenticated member opens and leaves the friend page

- **WHEN** an authenticated member opens the friend page and then navigates away
- **THEN** realtime chat starts while the page is active
- **AND** the chat-specific handlers are removed when the page unmounts
- **AND** room and game Socket.IO handlers remain registered

#### Scenario: Member logs out while realtime chat is active

- **WHEN** the friend system becomes unavailable because the member logs out
- **THEN** the store stops realtime chat and clears conversations
- **AND** subsequent chat:message events do not update chat state

#### Scenario: Realtime subscription fails

- **WHEN** chat:subscribe returns a failure acknowledgement
- **THEN** the player can still load history and send messages through the existing REST API
- **AND** the store does not register duplicate handlers during a later retry

### Requirement: Scrollable direct chat layout and speech bubble presentation

The friend chat panel SHALL remain within the vertical space allocated by the friend page. The toolbar and message composer MUST remain visible while only the message body scrolls when message content exceeds the available height. Message bubbles SHALL retain square corners and use a maximum width of 62 percent on desktop and 82 percent on small screens. Current-player messages MUST align left, use a white bubble with a left-pointing CSS triangle tail, and display the label \"我\" above the bubble. Friend messages MUST align right, use a light-gray bubble with a right-pointing CSS triangle tail, and display only the selected friend's actual player ID above the bubble without a descriptive prefix.

#### Scenario: Long conversation remains usable

- **WHEN** the rendered messages exceed the available chat panel height
- **THEN** the message body provides vertical scrolling
- **AND** the toolbar and composer remain visible inside the panel

#### Scenario: Message direction is visible in the bubble shape

- **WHEN** the conversation renders messages from both the current player and the friend
- **THEN** current-player bubbles align left and have a left-pointing triangle tail
- **AND** friend bubbles align right and have a right-pointing triangle tail
- **AND** both bubble variants retain square corners and wrap long text

#### Scenario: Message ownership is visible through color and identity

- **WHEN** the conversation renders a current-player message and a friend message for friend player ID 123
- **THEN** the current-player message uses a white bubble with the label \"我\" above it
- **AND** the friend message uses a light-gray bubble with only \"123\" above it
- **AND** neither identity label is rendered inside the message bubble

#### Scenario: Bubble width remains readable across screen sizes

- **WHEN** the chat panel is rendered on a desktop viewport
- **THEN** each message bubble uses a maximum width of 62 percent
- **AND WHEN** the chat panel is rendered on a small-screen viewport
- **THEN** each message bubble uses a maximum width of 82 percent

### Requirement: Keyboard-friendly direct message submission

The friend chat textarea SHALL treat an unmodified Enter keydown as a submit shortcut when the message is non-blank and no send request is active. Shift+Enter MUST retain the textarea's native line-break behavior. Enter keydowns with Ctrl, Alt, or Meta modifiers and Enter keydowns generated while an input method editor is composing text MUST NOT submit the message or suppress the native input behavior. A submit shortcut received while the message is blank or a send request is active MUST NOT invoke the message-send action.

#### Scenario: Unmodified Enter sends one message

- **WHEN** the textarea contains "hello", no send request is active, and the player presses Enter without modifiers outside IME composition
- **THEN** the keydown default is prevented
- **AND** the existing message-submit action is invoked exactly once

#### Scenario: Shift Enter inserts a line break

- **WHEN** the player presses Shift+Enter in the textarea
- **THEN** the keydown default is not prevented
- **AND** the message-submit action is not invoked

#### Scenario: IME confirmation does not send

- **WHEN** the player presses Enter while `isComposing` is true
- **THEN** the keydown default is not prevented
- **AND** the message-submit action is not invoked

#### Scenario: Submit shortcut is disabled

- **WHEN** the player presses unmodified Enter while the message is blank or a send request is active
- **THEN** the keydown default is prevented
- **AND** the message-submit action is not invoked

### Requirement: Automatic latest-message visibility

The friend chat panel SHALL scroll the active message body to its maximum vertical position after the selected friend changes, REST history renders, or the current conversation gains a new latest message from either the REST send response or chat:message. The panel MUST wait until Vue finishes the corresponding DOM update before scrolling. A new latest message MUST force the active conversation to the bottom even when the player was reading older messages. This behavior MUST NOT mutate conversation data or change REST, Socket.IO, or chat-store contracts.

#### Scenario: Sender sees the newly sent message

- **WHEN** the current player successfully sends a message and the REST response is merged into the active conversation
- **THEN** the message body scrolls to its maximum vertical position after the new message renders
- **AND** the newly sent message is visible without manual scrollbar movement

#### Scenario: Receiver sees the realtime message

- **WHEN** the active conversation receives a valid chat:message and renders it as the new latest message
- **THEN** the message body scrolls to its maximum vertical position after the new message renders
- **AND** the received message is visible without manual scrollbar movement

#### Scenario: Friend selection or history load displays the latest message

- **WHEN** the player selects another friend or REST history finishes rendering for the active friend
- **THEN** the active message body scrolls to its maximum vertical position
- **AND** the most recent rendered message is visible

#### Scenario: New message interrupts older-message reading

- **WHEN** the player has manually scrolled upward and the active conversation gains a new latest message
- **THEN** the message body returns to its maximum vertical position
- **AND** no unread prompt or additional player action is required

### Requirement: Recoverable realtime subscription

While realtime chat remains active, the frontend chat store SHALL automatically retry a failed chat:subscribe acknowledgement up to three times without registering duplicate Socket.IO listeners. A repeated startRealtime call while the store is started but unsubscribed MUST immediately retry the subscription. Subscription or connection failure MUST be visible in the friend chat panel, and REST history loading and message sending MUST remain available.

#### Scenario: Initial subscription fails temporarily

- **WHEN** the first chat:subscribe acknowledgement fails while the socket remains connected
- **THEN** the store automatically retries chat:subscribe without a page refresh
- **AND** a later successful acknowledgement marks realtime chat as subscribed
- **AND** exactly one handler remains registered for each chat lifecycle event

#### Scenario: Player manually retries an unsubscribed realtime session

- **WHEN** realtime chat is started but unsubscribed and the player activates the reconnect control
- **THEN** startRealtime retries chat:subscribe immediately
- **AND** the existing Socket.IO listeners are reused

#### Scenario: Realtime failure remains non-blocking

- **WHEN** chat:subscribe or the Socket.IO connection fails
- **THEN** the friend chat panel displays a realtime connection warning and reconnect control
- **AND** REST history loading and REST message sending remain available

### Requirement: Stable realtime lifecycle identity

The frontend chat store SHALL index its non-reactive realtime generation, Socket.IO handler bundle, retry timer, and retry count by the raw Pinia store identity. Equivalent Vue Proxy wrappers for the same raw store MUST share one realtime lifecycle, while callbacks from a stopped generation MUST remain inactive.

#### Scenario: Reconnect callback enters through an equivalent store Proxy

- **WHEN** startRealtime initializes a lifecycle through one Vue Proxy and the Socket.IO connect callback invokes subscribeRealtime through another Proxy for the same raw Pinia store
- **THEN** the existing generation remains active
- **AND** chat:subscribe is emitted with the current member token
- **AND** the existing Socket.IO handlers are reused

##### Example: two Proxies share one lifecycle

- **GIVEN** Proxy A and Proxy B both resolve to raw chat store R, and Proxy A initializes generation 1 with one handler bundle
- **WHEN** Proxy B handles the connect callback for generation 1
- **THEN** Proxy B resolves generation 1 and the same handler bundle stored for R

#### Scenario: Equivalent store Proxy stops realtime chat

- **WHEN** stopRealtime is invoked through an equivalent Proxy for the active raw Pinia store
- **THEN** the shared handlers and pending retry timer are removed
- **AND** callbacks from the stopped generation cannot subscribe or merge recovered history
