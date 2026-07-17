## ADDED Requirements

### Requirement: Intern guess treats Advisor and Adviser as equivalent

The backend SHALL treat `Advisor` and `Adviser` as equivalent names for the rank 7 card when resolving an Intern guess. The card effect and its animation result MUST use the same equivalence rule. Names for every other rank MUST retain exact matching behavior.

#### Scenario: Advisor spelling eliminates a target holding Adviser

- **WHEN** an Intern targets a player holding `{ id: 7, name: "Adviser" }` and the submitted `guessedCardName` is `Advisor`
- **THEN** the backend SHALL eliminate the target player as a correct guess

#### Scenario: Advisor spelling produces a correct animation outcome

- **WHEN** an Intern animation context contains a target card `{ id: 7, name: "Adviser" }` and the submitted `guessedCardName` is `Advisor`
- **THEN** the animation result SHALL preserve `guessedCardName: "Advisor"` and contain `outcome: "correct"`
