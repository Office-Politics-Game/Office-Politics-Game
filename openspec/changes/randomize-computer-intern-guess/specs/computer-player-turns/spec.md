## MODIFIED Requirements

### Requirement: Computer turns are decided by the backend

The system SHALL decide computer player draw, card selection, target selection, guessed card, and play action on the backend.

#### Scenario: Computer turn draws before playing when needed

- **WHEN** the current turn player is a computer player with fewer than two cards and the deck has cards
- **THEN** the backend SHALL perform a draw action before selecting and playing a card

#### Scenario: Computer turn keeps the existing card strategy

- **WHEN** the current turn player is a computer player with playable cards
- **THEN** the backend SHALL choose a legal card by prioritizing lower ranks, keeping CEO as the last choice, and obeying Advisor restrictions

#### Scenario: Computer Intern guess randomly selects an eligible rank

- **WHEN** a computer player plays Intern
- **THEN** the backend SHALL select one card name uniformly from the distinct configured ranks 2 through 8
- **AND** the backend MUST exclude a rank when the configured deck contains exactly one copy of that rank and the acting computer player holds that copy
- **AND** the backend MUST retain a rank when the configured deck contains more than one copy, even if the acting computer player holds one copy
- **AND** the selected name SHALL use the backend deck's canonical card name

##### Example: guess eligibility from the acting computer hand

| Other card in computer hand | Copies in configured deck | Expected guess eligibility |
| --------------------------- | ------------------------- | -------------------------- |
| CEO | 1 | CEO excluded |
| Adviser | 1 | Adviser excluded |
| HR | 1 | HR excluded |
| Manager | 2 | Manager included |
| PM | 2 | PM included |
| Intern | 5 | all ranks 2 through 8 included |

#### Scenario: Computer turn randomly selects an eligible target

- **WHEN** a computer player plays a card that requires a target
- **THEN** the backend SHALL select one eligible target using uniform random selection
- **AND** the eligible targets SHALL include every non-eliminated player allowed by the card self-target rule
- **AND** the selection SHALL NOT depend on player seat order

##### Example: target eligibility by card and player state

| Played card | Candidate state | Expected eligibility |
| ----------- | --------------- | -------------------- |
| Intern | acting computer player | excluded |
| Intern | other non-eliminated computer player | included |
| Intern | non-eliminated human player | included |
| Intern | eliminated player | excluded |
| PM | acting computer player | included |

#### Scenario: Computer readiness waits for the complete backend turn

- **WHEN** the frontend sends computer-turn readiness and the backend needs more than the shared five-second acknowledgement window to finish the draw and play operations
- **THEN** the frontend SHALL wait up to fifteen seconds for the computer-turn acknowledgement
- **AND** the longer timeout MUST apply only to computer-turn readiness

##### Example: backend finishes after the shared timeout

- **GIVEN** the backend acknowledges a computer turn after 5.1 seconds
- **WHEN** the frontend sends `game:ready-for-computer-turn`
- **THEN** the request remains active and SHALL NOT be reported as failed

#### Scenario: Human turn does not trigger computer action

- **WHEN** computer turn execution is requested while the current turn player is not a computer player
- **THEN** the backend MUST NOT draw, play, or mutate game state for a computer player
