## ADDED Requirements

### Requirement: Loading fades out the pre-game lobby theme

The frontend SHALL treat the Loading route as an audio transition rather than a route that continues pre-game background music. When the Loading route becomes active after the pre-game lobby theme has started, the frontend MUST linearly fade the current pre-game lobby volume to zero over 4000 milliseconds, then pause the audio and reset its playback position to zero. Other existing pre-game exit transitions SHALL retain their 900 millisecond duration.

#### Scenario: Enter Loading from a pre-game route

- **WHEN** the pre-game lobby theme is playing and the active route changes to Loading
- **THEN** the pre-game lobby theme fades from its current volume to zero over 4000 milliseconds
- **AND** the audio is paused and its playback position is reset to zero after the fade completes
- **AND** the game table theme does not play during Loading

#### Scenario: Leave a pre-game route for a non-Loading page

- **WHEN** the pre-game lobby theme is playing and the active route changes to a non-pre-game route other than Loading
- **THEN** the existing 900 millisecond pre-game fade-out behavior remains in effect

### Requirement: Game table theme starts only when the table is ready

The frontend SHALL use `game-table-start-theme.mp3` as the repeating game table background theme. The frontend MUST start it only after `GameView` has completed its initial state load and displays `GameStage`, and MUST linearly fade it from zero to the configured target volume over 5000 milliseconds. Each time this specific audio file naturally ends while the table remains active, the frontend MUST restart the same audio instance from zero seconds and repeat the 5000 millisecond fade-in. This replay behavior MUST NOT change any other background music or sound effect.

#### Scenario: GameView is still loading initial state

- **WHEN** `hasLoadedInitialState` is false and `GameView` displays `LoadingScreen`
- **THEN** the game table theme is not started

#### Scenario: GameStage becomes the active game view

- **WHEN** `hasLoadedInitialState` changes to true and `GameView` displays `GameStage`
- **THEN** the game table theme starts from zero volume
- **AND** it linearly reaches the current shared music volume multiplied by 0.2 over 5000 milliseconds

#### Scenario: Game table theme reaches the end while the table is active

- **WHEN** `game-table-start-theme.mp3` naturally reaches its end while `GameStage` is active, `musicEnabled` is true, and `musicVolume` is greater than zero
- **THEN** the same game table audio instance resets its playback position to zero
- **AND** it starts playing again at zero volume
- **AND** it linearly reaches the current shared music volume multiplied by 0.2 over 5000 milliseconds
- **AND** no other background music or sound effect changes its replay behavior

#### Scenario: Game table theme ends after playback is no longer allowed

- **WHEN** `game-table-start-theme.mp3` reaches its end after the table becomes inactive, music is disabled, or the shared music volume becomes zero
- **THEN** the game table theme does not restart

#### Scenario: Start is requested more than once

- **WHEN** the game table theme is already playing or fading in and the start operation is requested again
- **THEN** the existing playback position and fade progress are preserved
- **AND** no second audio instance or fade interval is created

### Requirement: Game table theme follows shared music settings and lifecycle

The game table theme MUST use the shared `musicEnabled` and `musicVolume` settings. The controller SHALL expose `startGameTableBackground()` and `stopGameTableBackground()`. Stopping MUST clear the fade interval, pause the audio, and reset its playback position to zero.

#### Scenario: Shared music is disabled before table entry

- **WHEN** `musicEnabled` is false or `musicVolume` is zero when `GameStage` becomes active
- **THEN** the game table theme does not play

#### Scenario: Shared music is enabled while the table is active

- **WHEN** `GameStage` is active and the user changes `musicEnabled` from false to true with a music volume greater than zero
- **THEN** the game table theme starts a 5000 millisecond fade-in from zero to the current shared music volume multiplied by 0.2

#### Scenario: Shared music volume changes

- **WHEN** the game table theme is active and `musicVolume` changes
- **THEN** its target volume is recalculated as the bounded shared music volume multiplied by 0.2
- **AND** the resulting audio volume remains between zero and one

#### Scenario: GameView is unmounted

- **WHEN** the user leaves `GameView`
- **THEN** the game table fade interval is cleared
- **AND** the game table theme is paused
- **AND** its playback position is reset to zero

### Requirement: Audio playback failures do not block the game

The game table audio controller MUST no-op when the browser Audio API is unavailable. It MUST handle a rejected `play()` Promise without producing an unhandled rejection, interrupting navigation, or preventing `GameStage` from rendering.

#### Scenario: Browser rejects audio playback

- **WHEN** the browser rejects the game table theme `play()` Promise
- **THEN** the rejection is handled silently
- **AND** `GameStage` remains rendered and usable

#### Scenario: Audio API is unavailable

- **WHEN** the game table audio controller runs in an environment without the Audio API
- **THEN** start and stop operations complete without throwing

### Requirement: Returning from Game keeps the pre-game lobby theme stopped

When navigation changes from `Game` to a pre-game lobby route, the frontend MUST keep `pre-game-lobby-theme.mp3` paused and reset its playback position to zero. The frontend MUST NOT start or fade in this theme as part of that route transition. This suppression MUST NOT change shared music settings, other background music, sound effects, or the existing behavior for navigation from non-Game routes.

#### Scenario: Return to the lobby from an active game

- **WHEN** the previous route is `Game` and navigation changes to a pre-game lobby route
- **THEN** `pre-game-lobby-theme.mp3` is paused and its playback position is reset to zero
- **AND** the pre-game lobby theme does not start or fade in during that transition
- **AND** shared music settings and other audio players remain unchanged

#### Scenario: Enter the lobby from a non-Game route

- **WHEN** navigation changes to a pre-game lobby route and the previous route is not `Game`
- **THEN** the existing pre-game route audio behavior remains in effect
