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

### Requirement: Returning from Game resumes the pre-game lobby theme

When `pre-game-lobby-theme.mp3` was explicitly activated before game entry, the frontend MUST preserve that activation while navigating through `Loading` and `Game` without playing the pre-game theme on either route. When navigation changes from `Game` to a pre-game lobby route while shared music remains enabled and its volume is greater than zero, the frontend MUST restart the pre-game theme at zero volume and linearly fade it to the configured target volume over 900 milliseconds. This transition MUST NOT change shared music settings, other background music, sound effects, or the existing behavior for navigation from non-Game routes.

#### Scenario: Return to the lobby from an active game

- **WHEN** the pre-game lobby theme was explicitly activated before game entry, shared music is enabled with volume greater than zero, the previous route is `Game`, and navigation changes to a pre-game lobby route
- **THEN** `pre-game-lobby-theme.mp3` starts at zero volume
- **AND** it linearly fades to the current shared music volume multiplied by 0.2 over 900 milliseconds
- **AND** shared music settings and other audio players remain unchanged

#### Scenario: Loading and Game preserve activation without playing the lobby theme

- **WHEN** the pre-game lobby theme was explicitly activated and navigation proceeds through `Loading` to `Game`
- **THEN** the pre-game lobby activation remains available for a later lobby return
- **AND** `pre-game-lobby-theme.mp3` remains paused on `Loading` and `Game`

#### Scenario: Return while pre-game playback is not allowed

- **WHEN** navigation changes from `Game` to a pre-game lobby route while shared music is disabled, its volume is zero, or the pre-game theme was never explicitly activated
- **THEN** the frontend does not force `pre-game-lobby-theme.mp3` to play

#### Scenario: Enter the lobby from a non-Game route

- **WHEN** navigation changes to a pre-game lobby route and the previous route is not `Game`
- **THEN** the existing pre-game route audio behavior remains in effect

### Requirement: Game card shuffle sound uses two short low-gain layers

The frontend SHALL play `game-card-shuffle.ogg` as two independently controlled HTML Audio layers when a valid card shuffle animation starts. The primary layer MUST start immediately at the bounded shared sound volume multiplied by 0.25 and MUST stop after 1200 milliseconds. The secondary layer MUST start after 100 milliseconds at the bounded shared sound volume multiplied by 0.15 and MUST stop 1200 milliseconds after its own start. Stopping a layer MUST pause it and reset its playback position to zero.

#### Scenario: Valid shuffle animation starts

- **WHEN** a card shuffle animation has a valid deck position, a positive deck count, `soundEnabled` is true, and `soundVolume` is greater than zero
- **THEN** the primary shuffle layer starts immediately at the bounded shared sound volume multiplied by 0.25
- **AND** the secondary shuffle layer starts 100 milliseconds later at the bounded shared sound volume multiplied by 0.15
- **AND** each layer is paused and reset to zero after 1200 milliseconds of its own playback

#### Scenario: Another shuffle starts before the previous layers finish

- **WHEN** a valid shuffle animation starts while either shuffle layer or any shuffle timeout from the previous animation remains active
- **THEN** every previous shuffle timeout is cleared
- **AND** both previous shuffle layers are paused and reset to zero
- **AND** exactly one new primary layer and one new secondary layer are scheduled

#### Scenario: Shuffle sound playback is disabled

- **WHEN** a valid shuffle animation starts while `soundEnabled` is false or `soundVolume` is zero
- **THEN** no shuffle layer is played or scheduled

#### Scenario: Browser rejects a shuffle layer

- **WHEN** the browser rejects either shuffle layer's `play()` Promise
- **THEN** the rejection is handled silently
- **AND** the card shuffle animation continues without interruption
