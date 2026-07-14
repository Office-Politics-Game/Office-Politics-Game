# intern-guess-prompt-animation Specification

## Purpose

Define the intern card guess-selection flow and animation prompt behavior so the submitted guess, target identity, outcome timing, and visual emphasis remain clear and consistent.

## Requirements

### Requirement: Intern animation result preserves the submitted guess

The backend SHALL include the submitted `guessedCardName` in every unprotected intern animation result that contains a target card and a `correct` or `incorrect` outcome. The frontend MUST preserve that field when normalizing the animation result.

#### Scenario: Incorrect guess retains the guessed position

- **WHEN** an intern card targets a player holding `Manager` and the submitted `guessedCardName` is `CEO`
- **THEN** the intern animation result contains `guessedCardName: "CEO"` and `outcome: "incorrect"`

#### Scenario: Correct guess retains the guessed position

- **WHEN** an intern card targets a player holding `Manager` and the submitted `guessedCardName` is `Manager`
- **THEN** the intern animation result contains `guessedCardName: "Manager"` and `outcome: "correct"`

### Requirement: Guess prompt identifies the target and guessed position

The game stage SHALL resolve the target nickname by matching the intern animation result `targetPlayerId` against the current player list. The intern animation SHALL render the prompt as `猜 {target nickname} 是 {guessedCardName}`. If the target player cannot be resolved, the game stage MUST use `玩家` as the target nickname.

#### Scenario: Known target player

- **WHEN** the target player ID resolves to a player named `小明` and `guessedCardName` is `Manager`
- **THEN** the animation displays `猜 小明 是 Manager`

#### Scenario: Missing target player metadata

- **WHEN** the target player ID is absent from the current player list and `guessedCardName` is `CEO`
- **THEN** the animation displays `猜 玩家 是 CEO`

### Requirement: Sequential intern target and position selection

When an Intern card enters pending-play state, the game stage SHALL present target-player selection first and MUST NOT render the position-selection dialog before a valid target is selected. After the target is selected, the game stage SHALL stop target-selection mode and SHALL render the position-selection dialog for ranks 2 through 8. The common target-card flow SHALL govern the same target-first ordering for cards that require a player target without a guessed position.

#### Scenario: Intern waits for target selection

- **WHEN** an Intern card enters pending-play state and no target player has been selected
- **THEN** eligible player avatars are selectable, `請選擇玩家` is displayed, and the position-selection dialog is not rendered

#### Scenario: Target selection opens the position dialog

- **WHEN** the player selects an eligible target for a pending Intern card
- **THEN** target-selection mode stops and the position-selection dialog is rendered for choosing ranks 2 through 8

### Requirement: Guess prompt precedes and persists through the result

The intern animation SHALL display the guess prompt before the outcome text, SHALL keep the prompt visible for one second before revealing `猜對啦` or `猜錯啦`, and SHALL keep both text elements visible until they disappear together at the result exit point. Reduced-motion mode MUST preserve the one-second informational hold and the same ordering.

#### Scenario: Correct outcome sequence

- **WHEN** a correct intern animation begins after card-play animation completion
- **THEN** the guess prompt appears first, the `猜對啦` result appears after a one-second hold, and both texts disappear together before the effect completes

#### Scenario: Incorrect outcome sequence

- **WHEN** an incorrect intern animation begins after card-play animation completion
- **THEN** the guess prompt appears first, the `猜錯啦` result appears after a one-second hold, and both texts disappear together before the effect completes

### Requirement: Guess prompt emphasizes dynamic values

The intern animation SHALL render the entire guess prompt at 60 percent of its original font size. The target nickname and guessed position SHALL use `#facc15`, while the static words `猜` and `是` MUST retain the base prompt color.

#### Scenario: Dynamic values use compact yellow styling

- **WHEN** the prompt displays `猜 小明 是 Manager`
- **THEN** the entire line uses 60 percent sizing, `小明` and `Manager` are yellow, and `猜` and `是` retain the base prompt color
