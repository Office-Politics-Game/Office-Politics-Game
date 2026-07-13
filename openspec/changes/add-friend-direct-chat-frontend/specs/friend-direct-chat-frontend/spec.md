## ADDED Requirements

### Requirement: Direct chat frontend API wrapper

The frontend SHALL expose direct friend chat API functions that call the existing backend REST endpoints under /chats/direct/:friendId/messages. The wrapper MUST fetch message history with playerId as a query parameter and MUST send messages with playerId and content in the request body.

#### Scenario: Fetch direct message history

- **WHEN** the frontend requests direct message history for player 1 and friend 2
- **THEN** the chat API wrapper calls GET /chats/direct/2/messages with playerId 1 as a query parameter

#### Scenario: Send direct message

- **WHEN** the frontend sends content "hello" from player 1 to friend 2
- **THEN** the chat API wrapper calls POST /chats/direct/2/messages with playerId 1 and content "hello" in the request body

### Requirement: Direct chat state management

The frontend SHALL provide direct chat state management for the selected friend conversation. The store MUST track message lists by friend, loading state, sending state, and error text, and MUST reject blank message content before calling the API.

#### Scenario: Selected friend messages are loaded

- **WHEN** the chat store loads messages for player 1 and friend 2
- **THEN** it stores the returned direct messages for friend 2 and clears the loading state

#### Scenario: Blank direct message is rejected on the client

- **WHEN** the chat store is asked to send content containing only whitespace
- **THEN** it records a user-visible error and does not call the send message API

#### Scenario: Sent direct message is appended

- **WHEN** the chat store sends non-empty content and the API returns a directMessage
- **THEN** it appends the returned message to the selected friend conversation and clears the sending state

### Requirement: Friend page direct chat panel

The friend page SHALL show a direct chat panel for the selected friend when the authenticated player can use the friend system. The panel MUST display message history, message direction, loading state, empty state, errors, and a text input with a send action.

#### Scenario: Selected friend shows chat panel

- **WHEN** an authenticated player selects a friend on the friend page
- **THEN** the page renders the direct chat panel for that friend instead of the previous not-connected placeholder

#### Scenario: No selected friend shows empty state

- **WHEN** an authenticated player has no selected friend
- **THEN** the page displays an empty state prompting the player to select a friend

#### Scenario: Unauthenticated player remains locked

- **WHEN** the player is not authenticated
- **THEN** the page displays the existing login-required state and does not render the direct chat input
