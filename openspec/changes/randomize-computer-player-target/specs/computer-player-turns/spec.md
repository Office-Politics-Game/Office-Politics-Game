## MODIFIED Requirements

### Requirement: Computer turns are decided by the backend

The system SHALL decide computer player draw, card selection, target selection, guessed card, and play action on the backend.

#### Scenario: Computer turn draws before playing when needed

- **WHEN** the current turn player is a computer player with fewer than two cards and the deck has cards
- **THEN** the backend SHALL perform a draw action before selecting and playing a card

#### Scenario: Computer turn keeps the existing card and guess strategy

- **WHEN** the current turn player is a computer player with playable cards
- **THEN** the backend SHALL choose a legal card by prioritizing lower ranks, keeping CEO as the last choice, obeying Advisor restrictions, and guessing `CEO` for Intern

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

#### Scenario: Human turn does not trigger computer action

- **WHEN** computer turn execution is requested while the current turn player is not a computer player
- **THEN** the backend MUST NOT draw, play, or mutate game state for a computer player
