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

The friend chat panel SHALL remain within the vertical space allocated by the friend page. The toolbar and message composer MUST remain visible while only the message body scrolls when message content exceeds the available height. Message bubbles SHALL retain square corners, use a maximum width of 62 percent on desktop and 82 percent on small screens, and display a CSS triangle tail pointing right for the current player and left for the friend.

#### Scenario: Long conversation remains usable

- **WHEN** the rendered messages exceed the available chat panel height
- **THEN** the message body provides vertical scrolling
- **AND** the toolbar and composer remain visible inside the panel

#### Scenario: Message direction is visible in the bubble shape

- **WHEN** the conversation renders messages from both the current player and the friend
- **THEN** current-player bubbles have a right-pointing triangle tail
- **AND** friend bubbles have a left-pointing triangle tail
- **AND** both bubble variants retain square corners and wrap long text

#### Scenario: Bubble width remains readable across screen sizes

- **WHEN** the chat panel is rendered on a desktop viewport
- **THEN** each message bubble uses a maximum width of 62 percent
- **AND WHEN** the chat panel is rendered on a small-screen viewport
- **THEN** each message bubble uses a maximum width of 82 percent

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
