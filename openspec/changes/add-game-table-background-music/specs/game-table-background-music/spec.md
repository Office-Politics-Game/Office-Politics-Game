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

When `pre-game-lobby-theme.mp3` was explicitly activated before game entry, the frontend MUST preserve that activation while navigating through `Loading` and `Game` without playing the pre-game theme on either route. Confirming the game settings return-lobby action MUST also register an explicit one-shot resume intent before navigation so that a missing in-memory activation does not suppress the requested return music. When navigation changes from `Game` to a pre-game lobby route while shared music remains enabled and its volume is greater than zero, the frontend MUST restart the pre-game theme at zero volume and linearly fade it to the configured target volume over 900 milliseconds. This transition MUST NOT change shared music settings, other background music, sound effects, or the existing behavior for navigation from non-Game routes.

#### Scenario: Return to the lobby from an active game

- **WHEN** the pre-game lobby theme was explicitly activated before game entry, shared music is enabled with volume greater than zero, the previous route is `Game`, and navigation changes to a pre-game lobby route
- **THEN** `pre-game-lobby-theme.mp3` starts at zero volume
- **AND** it linearly fades to the current shared music volume multiplied by 0.2 over 900 milliseconds
- **AND** shared music settings and other audio players remain unchanged

#### Scenario: Return through the game settings modal

- **WHEN** the player confirms the return-lobby action in the game settings modal while the current route is `Game`
- **AND** the in-memory pre-game activation is unavailable
- **THEN** the frontend navigates to the named `LobbyHome` route through the game page's return-lobby event flow
- **AND** the confirmation registers a pre-game resume intent before navigation without playing the theme on `Game`
- **AND** the resulting `Game` to `LobbyHome` transition resumes `pre-game-lobby-theme.mp3` with the 900 millisecond fade-in behavior

#### Scenario: Loading and Game preserve activation without playing the lobby theme

- **WHEN** the pre-game lobby theme was explicitly activated and navigation proceeds through `Loading` to `Game`
- **THEN** the pre-game lobby activation remains available for a later lobby return
- **AND** `pre-game-lobby-theme.mp3` remains paused on `Loading` and `Game`

#### Scenario: Return while pre-game playback is not allowed

- **WHEN** navigation changes from `Game` to a pre-game lobby route while shared music is disabled, its volume is zero, or the pre-game theme was never explicitly activated and no confirmed settings return requested a resume
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

### Requirement: Formal game table draws play a sound

The frontend SHALL use `game-card-draw.mp3` for every valid card draw animation on the formal game table. After the shared formal-table draw path validates both source and target rectangles and immediately before it starts either the self or opponent draw animation, the frontend MUST play the sound once from zero seconds at the bounded shared sound volume multiplied by 0.35. The initial deal MUST use this same shared trigger without an additional direct playback. Role-effect animations and the animation demo page MUST NOT trigger this sound.

#### Scenario: Initial deal distributes one card to each player

- **WHEN** the initial round deal sequence iterates through the active players while `soundEnabled` is true and `soundVolume` is greater than zero
- **THEN** `game-card-draw.mp3` starts once before each player's card draw animation
- **AND** each playback starts at zero seconds with volume equal to the bounded shared sound volume multiplied by 0.35

#### Scenario: A player draws during the formal game

- **WHEN** the formal game table starts a valid self or opponent draw animation outside the initial deal while `soundEnabled` is true and `soundVolume` is greater than zero
- **THEN** `game-card-draw.mp3` starts exactly once after the draw rectangles are validated and before the card begins flying
- **AND** playback starts at zero seconds with volume equal to the bounded shared sound volume multiplied by 0.35

#### Scenario: Draw animation geometry is unavailable

- **WHEN** the formal game table cannot resolve either the source or target rectangle for a requested draw
- **THEN** the draw animation does not start
- **AND** `game-card-draw.mp3` is not played

#### Scenario: Draw runs outside the formal game table path

- **WHEN** a role-effect animation or the animation demo page runs a draw animation
- **THEN** `game-card-draw.mp3` is not played

#### Scenario: Deal sound playback is disabled

- **WHEN** a formal-table draw runs while `soundEnabled` is false, `soundVolume` is zero, or the Audio API is unavailable
- **THEN** no draw sound is played
- **AND** the draw animation sequence continues without interruption

#### Scenario: Browser rejects deal sound playback

- **WHEN** the browser rejects the deal sound `play()` Promise
- **THEN** the rejection is handled silently
- **AND** the current and remaining formal-table card draw animations continue

### Requirement: Senior protection activation plays a dedicated sound

The frontend SHALL use `game-senior-protection-activate.mp3` for the protection activation caused by playing the Senior card. When an effect animation starts with `type` equal to `protection` and `sourceType` equal to `senior`, the frontend MUST play the sound exactly once from zero seconds at the bounded shared sound volume multiplied by 0.45. Protection removal and protection animations caused by another card being blocked MUST NOT play this sound.

#### Scenario: Senior card activates protection

- **WHEN** an effect animation starts with `type` equal to `protection`, `sourceType` equal to `senior`, `soundEnabled` true, and `soundVolume` greater than zero
- **THEN** `game-senior-protection-activate.mp3` starts exactly once from zero seconds
- **AND** its volume equals the bounded shared sound volume multiplied by 0.45

#### Scenario: Existing protection blocks another card

- **WHEN** a protection animation starts with `sourceType` equal to `cleaner`, `intern`, `manager`, or `hr`
- **THEN** the Senior protection activation sound does not play

#### Scenario: Senior protection ends

- **WHEN** the Senior protection aura is removed because the protection duration ends
- **THEN** the Senior protection activation sound does not play

#### Scenario: Senior protection sound playback is unavailable

- **WHEN** Senior protection activates while `soundEnabled` is false, `soundVolume` is zero, the Audio API is unavailable, or the browser rejects the sound's `play()` Promise
- **THEN** no unhandled error interrupts the protection animation

### Requirement: Game table UI controls play the shared click sound

The frontend SHALL use the existing `login-button-click` sound for enabled button interactions on the formal game table. Each enabled menu choice, player target avatar, settings gear, game-table confirmation control, and button inside the teleported game settings modal MUST play the sound exactly once through the shared sound settings. Volume sliders, non-button areas, disabled controls, and interactions while shared sound playback is disabled MUST NOT play the sound.

#### Scenario: Player activates a game table selection control

- **WHEN** `soundEnabled` is true, `soundVolume` is greater than zero, and the player clicks an enabled menu choice, selectable player target avatar, settings gear, or game-table confirmation control
- **THEN** `login-button-click` plays exactly once through the shared sound controller
- **AND** the original selection, settings, confirmation, or cancellation behavior continues unchanged

#### Scenario: Player activates a button in the game settings modal

- **WHEN** `soundEnabled` is true, `soundVolume` is greater than zero, and the player clicks an enabled close, music toggle, sound toggle, return-lobby, restart-game, confirmation, or cancellation button in the teleported game settings modal
- **THEN** `login-button-click` plays exactly once through the shared sound controller
- **AND** the original settings or navigation action continues unchanged

#### Scenario: UI click sound is not allowed

- **WHEN** the player moves a volume slider, clicks a non-button area, clicks a native disabled or `aria-disabled="true"` control, or activates a control while `soundEnabled` is false or `soundVolume` is zero
- **THEN** `login-button-click` does not play
- **AND** clicking the control that enables sound remains silent for that click
- **AND** a subsequent enabled button click plays the sound when shared sound playback is allowed

### Requirement: Custom room waiting controls play the shared click sound

The frontend SHALL use the existing `login-button-click` sound for enabled button interactions in the custom-room waiting screen. Enabled copy-room-code, player-slot, invite-friend modal, return-lobby, and start-game button controls MUST play the sound exactly once through the shared sound settings. Inputs, non-button areas, native disabled controls, `aria-disabled="true"` controls, and interactions while shared sound playback is disabled MUST NOT play the sound.

#### Scenario: Player activates an enabled custom-room control

- **WHEN** `soundEnabled` is true, `soundVolume` is greater than zero, and the player clicks an enabled copy-room-code, player-slot, invite-friend modal, return-lobby, or start-game button control
- **THEN** `login-button-click` plays exactly once through the shared sound controller
- **AND** the original copy, room operation, invitation, navigation, or start-game behavior continues unchanged

#### Scenario: Custom-room click sound is not allowed

- **WHEN** the player clicks an input, a non-button area, a native disabled control, an `aria-disabled="true"` control, or a control while `soundEnabled` is false or `soundVolume` is zero
- **THEN** `login-button-click` does not play

### Requirement: Formal game table card plays use the rise sound

The frontend SHALL play a latency-trimmed `game-card-play-rise.mp3` exactly once immediately before each valid local or remote player card-play animation on the formal game table. The asset MUST retain its complete tail, have a container duration below 1.5 seconds, and contain less than 0.06 seconds of leading silence at a -45 dB threshold. Playback MUST start from zero seconds at bounded shared `soundVolume × 0.4`, MUST respect `soundEnabled`, and MUST NOT be triggered by invalid animation geometry, a remote event for the local player, or animation-only demo views.

#### Scenario: Card-play rise asset starts responsively

- **WHEN** `game-card-play-rise.mp3` is decoded from zero seconds
- **THEN** audible content begins within 0.06 seconds at a -45 dB threshold
- **AND** the container duration is below 1.5 seconds
- **AND** the original audio tail after the removed 0.65-second prefix remains intact

#### Scenario: Local player starts a valid card-play animation

- **WHEN** the local player plays a card and the card, release origin rectangle, and discard target rectangle are valid
- **THEN** `game-card-play-rise.mp3` plays exactly once immediately before the local `cardPlayAnimation.play()` call
- **AND** playback starts from zero seconds at bounded `soundVolume × 0.4`

#### Scenario: Remote player starts a valid card-play animation

- **WHEN** a different player plays a card and the card, player-hand origin rectangle, and discard target rectangle are valid
- **THEN** `game-card-play-rise.mp3` plays exactly once immediately before the remote `cardPlayAnimation.play()` call

#### Scenario: Card-play rise sound is not allowed

- **WHEN** the event represents the local player in the remote path, required card or geometry data is invalid, `soundEnabled` is false, `soundVolume` is zero, the Audio API is unavailable, the browser rejects playback, or `CardPlayAnimation` runs only in a demo view
- **THEN** no duplicate sound or unhandled error interrupts the card-play flow

### Requirement: Intern guess result reveal plays a semantic sound

The frontend SHALL play a semantic sound exactly once when the Intern animation reveals its guess result on the formal game table. After the existing one-second guess prompt hold and immediately before the outcome text becomes visible, a `correct` result MUST play `intern-guess-correct.mp3` and an `incorrect` result MUST play `intern-guess-incorrect.mp3`. Playback MUST start from zero seconds at bounded shared `soundVolume × 0.45`, MUST respect `soundEnabled`, and MUST NOT be wired into animation-only demo views.

#### Scenario: Intern guess is correct

- **WHEN** the formal-table Intern animation finishes its one-second guess prompt hold with outcome `correct`
- **THEN** it emits `outcome-reveal` exactly once immediately before showing the correct outcome text
- **AND** `intern-guess-correct.mp3` plays exactly once from zero seconds at bounded shared `soundVolume × 0.45`

#### Scenario: Intern guess is incorrect

- **WHEN** the formal-table Intern animation finishes its one-second guess prompt hold with outcome `incorrect`
- **THEN** it emits `outcome-reveal` exactly once immediately before showing the incorrect outcome text
- **AND** `intern-guess-incorrect.mp3` plays exactly once from zero seconds at bounded shared `soundVolume × 0.45`

#### Scenario: Intern result sound is unavailable or out of scope

- **WHEN** the outcome is unknown, `soundEnabled` is false, `soundVolume` is zero, the Audio API is unavailable, the browser rejects playback, or the animation runs only in a demo view
- **THEN** no result sound or unhandled error interrupts the Intern animation

### Requirement: Player elimination notice plays a dedicated sound

The frontend SHALL use `game-player-eliminated.mp3` when any player first transitions from active to eliminated on the formal game table. The frontend MUST play the sound exactly once when the corresponding player-elimination notice opens, from zero seconds at bounded shared `soundVolume × 0.45`. Repeated renders of an already-eliminated player, disabled sound playback, unavailable Audio API access, and rejected playback MUST NOT interrupt the notice or play duplicate audio.

#### Scenario: A player becomes eliminated

- **WHEN** any formal-table player's `isEliminated` state transitions from false to true while `soundEnabled` is true and `soundVolume` is greater than zero
- **THEN** the player-elimination notice opens for that player
- **AND** `game-player-eliminated.mp3` plays exactly once from zero seconds at bounded `soundVolume × 0.45`

#### Scenario: An eliminated player remains eliminated

- **WHEN** the formal game table receives another render or state update where the same player's `isEliminated` state remains true
- **THEN** no additional player-elimination notice or elimination sound is started for that unchanged state

#### Scenario: Elimination sound playback is unavailable

- **WHEN** a player becomes eliminated while `soundEnabled` is false, `soundVolume` is zero, the Audio API is unavailable, or the browser rejects playback
- **THEN** no unhandled error interrupts the player-elimination notice or game flow

### Requirement: HR card swap motion plays whoosh 04 followed by whoosh 05

The frontend SHALL play `game-card-swap-whoosh-04.mp3` exactly once when a valid HR card swap animation begins its card motion on the formal game table, then SHALL play `game-card-swap-whoosh-05.mp3` exactly once immediately after 04 naturally ends. In both standard and reduced-motion timelines, 04 playback MUST occur after the existing one-second swap prompt hold and immediately before the first flip or position-exchange operation. Both clips MUST start from zero seconds at bounded shared `soundVolume × 0.45`, MUST respect `soundEnabled`, and MUST NOT be wired into animation-only demo views. Starting another swap sequence MUST pause and reset both clips before the new 04 playback begins.

#### Scenario: Standard HR swap begins card motion

- **WHEN** a valid standard-motion HR swap animation finishes its one-second prompt hold
- **THEN** it emits `swap-motion-start` exactly once immediately before the first card flip
- **AND** `game-card-swap-whoosh-04.mp3` plays exactly once from zero seconds at bounded shared `soundVolume × 0.45`
- **AND** `game-card-swap-whoosh-05.mp3` plays exactly once from zero seconds immediately after 04 ends at bounded shared `soundVolume × 0.45`

#### Scenario: Reduced-motion HR swap begins card motion

- **WHEN** a valid reduced-motion HR swap animation finishes its one-second prompt hold
- **THEN** it emits `swap-motion-start` exactly once immediately before applying the swapped card state
- **AND** `game-card-swap-whoosh-04.mp3` plays exactly once from zero seconds at bounded shared `soundVolume × 0.45`
- **AND** `game-card-swap-whoosh-05.mp3` plays exactly once from zero seconds immediately after 04 ends at bounded shared `soundVolume × 0.45`

#### Scenario: Another HR swap starts before the current sequence ends

- **WHEN** another valid HR swap begins while 04 or 05 from the previous swap is still playing
- **THEN** the frontend pauses and resets both previous clips
- **AND** the new sequence starts only `game-card-swap-whoosh-04.mp3` from zero seconds

#### Scenario: HR swap sound is unavailable or out of scope

- **WHEN** required animation geometry is invalid, the animation is stale, `soundEnabled` is false, `soundVolume` is zero, the Audio API is unavailable, the browser rejects playback, or the animation runs only in a demo view
- **THEN** the 04 → 05 sequence does not produce an unhandled error or interrupt the HR animation
- **AND** if shared sound becomes disabled or zero before 04 ends, 05 does not play

### Requirement: Round winner notice plays a three-second cheer

The frontend SHALL use `game-round-win-cheer.mp3` when any formal-table player's `roundWins` value increases. The asset MUST contain the source audio from zero through 3.00 seconds, MUST apply a linear fade-out during the final 180 milliseconds, MUST have a container duration no greater than 3.05 seconds, and MUST replace the non-semantic `kids_cheering.mp3` filename. Playback MUST start from zero seconds exactly once at bounded shared `soundVolume × 0.45` before the corresponding round-winner notice is requested.

#### Scenario: Any player wins a round

- **WHEN** any formal-table player's `roundWins` value increases relative to the previous player snapshot while `soundEnabled` is true and `soundVolume` is greater than zero
- **THEN** `game-round-win-cheer.mp3` plays exactly once from zero seconds at bounded shared `soundVolume × 0.45`
- **AND** the round-winner notice is requested for that same player

#### Scenario: Round-win state is rendered again

- **WHEN** the formal table receives another render where every player's `roundWins` value is unchanged
- **THEN** no additional round-win cheer or round-winner notice is started for that unchanged state

#### Scenario: Round-win sound playback is unavailable or out of scope

- **WHEN** a player's `roundWins` value increases while `soundEnabled` is false, `soundVolume` is zero, the Audio API is unavailable, the browser rejects playback, or a round-winner notice is opened only in the animation demo view
- **THEN** no unhandled error or demo audio interrupts the round-winner notice or game flow
