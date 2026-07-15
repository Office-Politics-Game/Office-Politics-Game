import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('pre-game audio assets use semantic filenames', async () => {
  const audioFiles = await readdir(new URL('../src/assets/audio/', import.meta.url))

  assert.equal(audioFiles.includes('lobby-ambience-office-60s.mp3'), false)
  assert.ok(audioFiles.includes('login-button-click.mp3'))
  assert.ok(audioFiles.includes('lobby-navigation-whoosh.mp3'))
  assert.ok(audioFiles.includes('lobby-money-chant-theme.mp3'))
  assert.ok(audioFiles.includes('pre-game-lobby-theme.mp3'))
  assert.equal(
    audioFiles.includes('Red Right Hand 2011 Remaster  Nick Cave  The Bad Seeds  Instrumental.mp3'),
    false,
  )
  assert.ok(audioFiles.includes('lobby-footsteps-heels-01.mp3'))
  assert.ok(audioFiles.includes('lobby-footsteps-heels-02.mp3'))
  assert.ok(audioFiles.includes('lobby-footsteps-heels-03.mp3'))
  assert.ok(audioFiles.includes('lobby-footsteps-heels-04.mp3'))
  assert.equal(audioFiles.some((fileName) => fileName.endsWith('.mp3.mp3')), false)
})

test('pre-game audio controller maps ui sounds', async () => {
  const source = await readSource('src/composables/UsePreGameAudio.js')

  assert.match(source, /loginButtonClickUrl/)
  assert.match(source, /lobbyNavigationWhooshUrl/)
  assert.match(source, /lobbyMoneyChantThemeUrl/)
  assert.match(source, /preGameLobbyThemeUrl/)
  assert.match(source, /function syncPreGameRouteAudio/)
  assert.match(source, /function playPreGameSound/)
  assert.match(source, /musicEnabled/)
  assert.match(source, /soundEnabled/)
})

test('pre-game audio controller does not load looping ambience music', async () => {
  const source = await readSource('src/composables/UsePreGameAudio.js')

  assert.doesNotMatch(source, /lobby-ambience-office-60s/)
  assert.doesNotMatch(source, /lobbyAmbienceOfficeUrl/)
  assert.doesNotMatch(source, /LOBBY_AMBIENCE_GAIN/)
  assert.doesNotMatch(source, /ambienceAudio/)
  assert.doesNotMatch(source, /ensureAmbienceAudio/)
})

test('pre-game audio controller loops lobby background music', async () => {
  const source = await readSource('src/composables/UsePreGameAudio.js')

  assert.match(source, /PRE_LOGIN_MUSIC_GAIN = 1\.0/)
  assert.match(source, /PRE_GAME_MUSIC_GAIN = [\d.]+/)
  assert.match(source, /loginLobbyMusicAudio/)
  assert.match(source, /ensureLoginLobbyMusicAudio/)
  assert.match(source, /playLoginLobbyMusic/)
  assert.match(source, /preGameLobbyMusicAudio/)
  assert.match(source, /ensurePreGameLobbyMusicAudio/)
  assert.match(source, /playPreGameLobbyMusic/)
  assert.match(source, /createAudio\(lobbyMoneyChantThemeUrl, \{ loop: true \}\)/)
  assert.match(source, /createAudio\(preGameLobbyThemeUrl, \{ loop: true \}\)/)
  assert.match(source, /pauseAudio\(loginLobbyMusicAudio, \{ reset: true \}\)/)
  assert.match(source, /pauseAudio\(preGameLobbyMusicAudio, \{ reset: true \}\)/)
})

test('login-before audio switches to the pre-game theme after explicit start', async () => {
  const source = await readSource('src/composables/UsePreGameAudio.js')

  assert.match(source, /PRE_LOGIN_AUDIO_ROUTE_NAMES/)
  assert.match(source, /function startPreLoginBackground/)
  assert.match(source, /function isPreLoginAudioRoute/)
  assert.match(source, /pauseAudio\(loginLobbyMusicAudio, \{ reset: true \}\)/)
  assert.match(source, /startPreGameBackground\(\{ fadeIn = false, userInitiated = false \} = \{\}\)/)
})

test('pre-game lobby music fades out when leaving the auth flow', async () => {
  const source = await readSource('src/composables/UsePreGameAudio.js')

  assert.match(source, /LOBBY_MUSIC_FADE_OUT_MS = 900/)
  assert.match(source, /lobbyMusicFadeTimerId/)
  assert.match(source, /function fadeOutAudio/)
  assert.match(source, /window\.setInterval/)
  assert.match(source, /stopPreGameBackground\(\{\s*fadeOut: true,/)
  assert.match(
    source,
    /stopPreGameBackground\(\{ fadeOut: false, preserveActivation: true \}\)/,
  )
})

test('loading route uses an extended pre-game lobby fade out', async () => {
  const source = await readSource('src/composables/UsePreGameAudio.js')

  assert.match(source, /LOADING_MUSIC_FADE_OUT_MS = 4000/)
  assert.match(
    source,
    /function stopPreGameBackground\(\{[\s\S]*?fadeOutMs = LOBBY_MUSIC_FADE_OUT_MS/,
  )
  assert.match(source, /fadeOutAudio\(preGameLobbyMusicAudio, fadeOutMs\)/)
  assert.match(
    source,
    /fadeOutMs:\s*routeName === "Loading"\s*\? LOADING_MUSIC_FADE_OUT_MS\s*:\s*LOBBY_MUSIC_FADE_OUT_MS/,
  )
})

test('pre-game lobby music fades in when explicitly started', async () => {
  const source = await readSource('src/composables/UsePreGameAudio.js')

  assert.match(source, /LOBBY_MUSIC_FADE_IN_MS = 900/)
  assert.match(source, /function fadeInAudio/)
  assert.match(source, /preGameBackgroundStarted/)
  assert.match(source, /playPreGameLobbyMusic\(\{ fadeIn \}\)/)

  const loginSource = await readSource('src/components/login/LoginContent.vue')
  const guestSource = await readSource('src/components/login/GuestLoginModal.vue')

  assert.match(loginSource, /startPreGameBackground\(\{ fadeIn: true, userInitiated: true \}\)/)
  assert.match(guestSource, /startPreGameBackground\(\{ fadeIn: true, userInitiated: true \}\)/)
})

test('pre-game background audio separates login-before and post-login routes', async () => {
  const source = await readSource('src/composables/UsePreGameAudio.js')
  const preLoginRouteNamesMatch = source.match(
    /PRE_LOGIN_AUDIO_ROUTE_NAMES = Object\.freeze\(\[([\s\S]*?)\]\)/,
  )
  const preGameRouteNamesMatch = source.match(
    /PRE_GAME_AUDIO_ROUTE_NAMES = Object\.freeze\(\[([\s\S]*?)\]\)/,
  )

  assert.ok(preLoginRouteNamesMatch)
  assert.ok(preGameRouteNamesMatch)

  const preLoginRouteNames = Array.from(
    preLoginRouteNamesMatch[1].matchAll(/"([^"]+)"/g),
  ).map(
    ([, routeName]) => routeName,
  )
  const preGameRouteNames = Array.from(
    preGameRouteNamesMatch[1].matchAll(/"([^"]+)"/g),
  ).map(([, routeName]) => routeName)

  assert.deepEqual(preLoginRouteNames, ["Entry", "Login", "Register"])
  assert.deepEqual(preGameRouteNames, [
    "LobbyHome",
    "LobbyGameMenu",
    "Matching",
    "JoinRoom",
    "CustomRoom",
    "Profile",
    "Friend",
    "Gacha",
  ])
})

test('pre-login lobby audio retries after user interaction and schedules footsteps', async () => {
  const source = await readSource('src/composables/UsePreGameAudio.js')

  assert.match(source, /AUDIO_UNLOCK_EVENTS/)
  assert.match(source, /function unlockAudio/)
  assert.match(source, /function installAudioUnlockListeners/)
  assert.match(
    source,
    /if \(currentPreLoginRouteActive\) \{[\s\S]*?playLoginLobbyMusic\(\);[\s\S]*?scheduleFootstepLayer\(\{ initial: true \}\)/,
  )
  assert.match(source, /LOBBY_FOOTSTEP_LAYERS/)
  assert.match(source, /function scheduleFootstepLayer/)
  assert.match(source, /function playLobbyFootstep/)
  assert.match(source, /function connectFootstepLayer/)
  assert.match(source, /lobbyFootstepsHeels01Url/)
  assert.match(source, /lobbyFootstepsHeels02Url/)
  assert.match(source, /lobbyFootstepsHeels03Url/)
  assert.match(source, /lobbyFootstepsHeels04Url/)
})

test('pre-login lobby audio mix includes footsteps and clears them on route exit', async () => {
  const source = await readSource('src/composables/UsePreGameAudio.js')

  assert.match(source, /PRE_LOGIN_MUSIC_GAIN/)
  assert.match(source, /PRE_GAME_MUSIC_GAIN/)
  assert.match(source, /LOBBY_DETAIL_GAIN/)
  assert.match(source, /clearFootstepTimer/)
  assert.match(
    source,
    /pauseAudio\(loginLobbyMusicAudio, \{ reset: true \}\);\s*stopLobbyFootsteps\(\)/,
  )
})

test('login page actions trigger the shared click sound, including close controls', async () => {
  const entrySource = await readSource('src/views/EntryPage.vue')
  const loginSource = await readSource('src/components/login/LoginContent.vue')
  const registerSource = await readSource('src/components/register/RegisterPage.vue')
  const guestSource = await readSource('src/components/login/GuestLoginModal.vue')

  assert.match(entrySource, /function playLoginClick/)
  assert.match(entrySource, /function handleAuthOverlayClose/)
  assert.match(entrySource, /function handleGuestOverlayClose/)

  assert.match(loginSource, /function playLoginClick/)
  assert.match(loginSource, /function closeLogin/)
  assert.match(loginSource, /function togglePasswordVisibility/)
  assert.match(loginSource, /@click="closeLogin"/)
  assert.match(loginSource, /@click="togglePasswordVisibility"/)

  assert.match(registerSource, /usePreGameAudio/)
  assert.match(registerSource, /function playRegisterClick/)
  assert.match(registerSource, /function closeRegister/)
  assert.match(registerSource, /function togglePasswordVisibility/)
  assert.match(registerSource, /function toggleConfirmPasswordVisibility/)
  assert.match(registerSource, /@click="closeRegister"/)

  assert.match(guestSource, /usePreGameAudio/)
  assert.match(guestSource, /function playGuestClick/)
  assert.match(guestSource, /function closeGuest/)
  assert.match(guestSource, /@click="closeGuest"/)
  assert.match(guestSource, /@click="selectPreviousAvatar"/)
  assert.match(guestSource, /@click="selectNextAvatar"/)
  assert.match(guestSource, /@click="rollNickname"/)
})

test('login and guest play actions start the pre-game background theme', async () => {
  const loginSource = await readSource('src/components/login/LoginContent.vue')
  const guestSource = await readSource('src/components/login/GuestLoginModal.vue')

  assert.match(loginSource, /startPreGameBackground\(\{ fadeIn: true, userInitiated: true \}\)/)
  assert.match(guestSource, /startPreGameBackground\(\{ fadeIn: true, userInitiated: true \}\)/)
})

test('login failure does not start the post-login theme', async () => {
  const loginSource = await readSource('src/components/login/LoginContent.vue')
  const loginHandler = loginSource.slice(loginSource.indexOf('async function handleLogin()'))
  const loginRequest = loginHandler.indexOf('await authStore.login')
  const startThemeBeforeRequest = loginHandler
    .slice(0, loginRequest)
    .includes('startPreGameBackground({ fadeIn: true, userInitiated: true })')

  assert.equal(startThemeBeforeRequest, false)
  assert.match(
    loginHandler,
    /await authStore\.login[\s\S]*?startPreGameBackground\(\{ fadeIn: true, userInitiated: true \}\)/,
  )
})

test('guest creation failure does not start the post-login theme', async () => {
  const guestSource = await readSource('src/components/login/GuestLoginModal.vue')
  const guestHandler = guestSource.slice(guestSource.indexOf('async function submitGuest()'))
  const guestRequest = guestHandler.indexOf('await createGuestPlayer')
  const startThemeBeforeRequest = guestHandler
    .slice(0, guestRequest)
    .includes('startPreGameBackground({ fadeIn: true, userInitiated: true })')

  assert.equal(startThemeBeforeRequest, false)
  assert.match(
    guestHandler,
    /await createGuestPlayer[\s\S]*?startPreGameBackground\(\{ fadeIn: true, userInitiated: true \}\)/,
  )
})

test('leaving the lobby stops the post-login background theme immediately', async () => {
  const audioSource = await readSource('src/composables/UsePreGameAudio.js')
  const lobbySource = await readSource('src/components/menu/LobbyMenu.vue')

  assert.match(audioSource, /function stopPreGameBackground/)
  assert.match(audioSource, /stopPreGameBackground,/)
  assert.match(lobbySource, /stopPreGameBackground\(\{ fadeOut: false \}\)/)
})

test('entry, login, and lobby screens are wired to pre-game audio', async () => {
  const appSource = await readSource('src/App.vue')
  const entrySource = await readSource('src/views/EntryPage.vue')
  const loginSource = await readSource('src/components/login/LoginContent.vue')
  const lobbyMenuSource = await readSource('src/components/menu/LobbyMenu.vue')
  const gameMenuSource = await readSource('src/components/gameRoom/GameMenuPanel.vue')

  assert.match(appSource, /usePreGameAudio/)
  assert.match(appSource, /syncPreGameRouteAudio/)
  assert.match(entrySource, /playPreGameSound\(["']login-button-click["']\)/)
  assert.match(loginSource, /playPreGameSound\(["']login-button-click["']\)/)
  assert.match(lobbyMenuSource, /playPreGameSound\(["']lobby-navigation-whoosh["']\)/)
  assert.match(gameMenuSource, /playPreGameSound\(["']lobby-navigation-whoosh["']\)/)
})

test('pre-game lobby music continues through personal, social, and recruitment pages', async () => {
  const source = await readSource('src/composables/UsePreGameAudio.js')
  const routeListStart = source.indexOf('export const PRE_GAME_AUDIO_ROUTE_NAMES')
  const routeListEnd = source.indexOf(']);', routeListStart)
  const routeList = source.slice(routeListStart, routeListEnd)

  for (const routeName of ['Profile', 'Friend', 'Gacha']) {
    assert.match(routeList, new RegExp(`"${routeName}"`))
  }
})

test('starting the game menu uses the lobby navigation sound', async () => {
  const source = await readSource('src/components/menu/LobbyMenu.vue')
  const startGameAction = source.slice(
    source.indexOf('function openGameMenu()'),
    source.indexOf('function openGachaPage()'),
  )

  assert.match(startGameAction, /playLobbyNavigationSound\(\)/)
  assert.doesNotMatch(startGameAction, /playPreGameSound\("login-button-click"\)/)
})

test('waiting room entry actions use the shared click sound', async () => {
  const source = await readSource('src/components/gameRoom/WaitingRoomMenu.vue')

  assert.match(source, /usePreGameAudio/)
  assert.match(source, /function playRoomActionClick/)
  assert.match(source, /playRoomActionClick\(\)/)
  assert.match(source, /async function handleJoinRoom\(\)[\s\S]*?playRoomActionClick\(\)/)
})

test('post-login pages delegate enabled button clicks to the shared click sound', async () => {
  const buttonAudioSource = await readSource('src/composables/UseButtonClickAudio.js')
  const profileSource = await readSource('src/components/profile/ProfileShell.vue')
  const friendSource = await readSource('src/views/FriendView.vue')
  const mallSource = await readSource('src/views/MallView.vue')

  assert.match(buttonAudioSource, /button, \[role="button"\]/)
  assert.match(buttonAudioSource, /closest\?\.\(BUTTON_CONTROL_SELECTOR\)/)
  assert.match(buttonAudioSource, /matches\(":disabled"\)/)
  assert.match(buttonAudioSource, /getAttribute\("aria-disabled"\) === "true"/)
  assert.match(buttonAudioSource, /playPreGameSound\("login-button-click"\)/)

  for (const source of [profileSource, friendSource, mallSource]) {
    assert.match(source, /useButtonClickAudio/)
    assert.match(source, /@click\.capture="handleButtonClick"/)
  }
})

test('custom room waiting controls use the shared click sound', async () => {
  const source = await readSource('src/views/CustomRoomView.vue')

  assert.match(source, /useButtonClickAudio/)
  assert.match(
    source,
    /const \{ handleButtonClick \} = useButtonClickAudio\(\)/,
  )
  assert.match(source, /<main[\s\S]*?@click\.capture="handleButtonClick"/)
})

test('game table selection and settings buttons use the shared click sound', async () => {
  const gameStageSource = await readSource('src/components/game/ui/GameStage.vue')
  const settingsModalSource = await readSource(
    'src/components/game/ui/GameSettingsModal.vue',
  )

  for (const source of [gameStageSource, settingsModalSource]) {
    assert.match(source, /useButtonClickAudio/)
    assert.match(source, /@click\.capture="handleButtonClick"/)
  }
})

test('mall entry and leave lobby actions use the shared click sound', async () => {
  const source = await readSource('src/components/menu/LobbyMenu.vue')
  const leaveStart = source.indexOf('function leaveLobby()')
  const mallStart = source.indexOf('function openMallPage()')
  const gameMenuStart = source.indexOf('function openGameMenu()')
  const leaveAction = source.slice(leaveStart, mallStart)
  const mallAction = source.slice(mallStart, gameMenuStart)

  assert.match(mallAction, /playPreGameSound\("login-button-click"\)/)
  assert.doesNotMatch(mallAction, /playLobbyNavigationSound\(\)/)
  assert.match(leaveAction, /playPreGameSound\("login-button-click"\)/)
})

test('mall entrance uses a delayed semantic bell sound', async () => {
  const audioFiles = await readdir(new URL('../src/assets/audio/', import.meta.url))
  const audioSource = await readSource('src/composables/UsePreGameAudio.js')
  const mallSource = await readSource('src/views/MallView.vue')
  const lobbySource = await readSource('src/components/menu/LobbyMenu.vue')

  assert.ok(audioFiles.includes('mall-entrance-bell.mp3'))
  assert.match(audioSource, /mallEntranceBellUrl/)
  assert.match(audioSource, /"mall-entrance-bell": mallEntranceBellUrl/)
  assert.match(lobbySource, /function openMallPage\(\)[\s\S]*?playPreGameSound\("login-button-click"\)/)
  assert.match(mallSource, /MALL_ENTRANCE_BELL_DELAY_MS = 200/)
  assert.match(mallSource, /playPreGameSound\("mall-entrance-bell"\)/)
  assert.match(mallSource, /window\.setTimeout/)
  assert.match(mallSource, /window\.clearTimeout/)
})

test('all mall return controls use the shared lobby handler', async () => {
  const mallSource = await readSource('src/views/MallView.vue')
  const returnHandlers = Array.from(mallSource.matchAll(/@click="goLobby"/g))

  assert.equal(returnHandlers.length, 3)
  assert.doesNotMatch(mallSource, /@click="router\.push\('\/lobby'\)"/)
})

test('returning from mall preserves activation and fades the pre-game theme in', async () => {
  const appSource = await readSource('src/App.vue')
  const audioSource = await readSource('src/composables/UsePreGameAudio.js')

  assert.match(appSource, /\(routeName, previousRouteName\) =>/)
  assert.match(appSource, /previousRouteName === "Mall"/)
  assert.match(appSource, /syncPreGameRouteAudio\(routeName, \{ fadeIn \}\)/)
  assert.match(
    audioSource,
    /function syncPreGameRouteAudio\(routeName, \{ fadeIn = false \} = \{\}\)/,
  )
  assert.match(audioSource, /startPreGameBackground\(\{ fadeIn \}\)/)
  assert.match(
    audioSource,
    /preserveActivation:\s*PRESERVE_PRE_GAME_ACTIVATION_ROUTE_NAMES\.has\(routeName\)/,
  )
})

test('returning from Game preserves activation and fades the pre-game theme in', async () => {
  const appSource = await readSource('src/App.vue')
  const audioSource = await readSource('src/composables/UsePreGameAudio.js')
  const preserveRouteNamesMatch = audioSource.match(
    /PRESERVE_PRE_GAME_ACTIVATION_ROUTE_NAMES = new Set\(\[([\s\S]*?)\]\)/,
  )
  const startPreGameSource = audioSource.slice(
    audioSource.indexOf('function startPreGameBackground'),
    audioSource.indexOf('function removeAudioUnlockListeners'),
  )

  assert.match(
    appSource,
    /const fadeIn =\s*previousRouteName === "Mall" \|\|\s*previousRouteName === "Game"/,
  )
  assert.match(appSource, /syncPreGameRouteAudio\(routeName, \{ fadeIn \}\)/)
  assert.doesNotMatch(appSource, /suppressBackground/)
  assert.doesNotMatch(audioSource, /suppressBackground/)

  assert.ok(preserveRouteNamesMatch)
  const preserveRouteNames = Array.from(
    preserveRouteNamesMatch[1].matchAll(/"([^"]+)"/g),
  ).map(([, routeName]) => routeName)
  assert.deepEqual(preserveRouteNames, ["Mall", "Loading", "Game"])
  assert.match(
    audioSource,
    /preserveActivation:\s*PRESERVE_PRE_GAME_ACTIVATION_ROUTE_NAMES\.has\(routeName\)/,
  )

  assert.match(startPreGameSource, /const \{ musicEnabled, musicVolume \} = getAudioSettings\(\)/)
  assert.match(
    startPreGameSource,
    /!musicEnabled\.value \|\|[\s\S]*?getBoundedVolume\(musicVolume\.value, PRE_GAME_MUSIC_GAIN\) <= 0/,
  )
})

test('game settings return-lobby flows through GameView to LobbyHome', async () => {
  const settingsModalSource = await readSource(
    'src/components/game/ui/GameSettingsModal.vue',
  )
  const gameStageSource = await readSource('src/components/game/ui/GameStage.vue')
  const gameViewSource = await readSource('src/views/GameView.vue')

  assert.match(
    settingsModalSource,
    /@click="openConfirmation\(['"]return-lobby['"]\)"/,
  )
  assert.match(settingsModalSource, /emit\(confirmationAction\.value\)/)
  assert.doesNotMatch(
    settingsModalSource,
    /\$router\.push\(['"]\/Lobby['"]\)/,
  )
  assert.match(gameStageSource, /@return-lobby="emit\(['"]return-lobby['"]\)"/)
  assert.match(gameViewSource, /useRouter/)
  assert.match(
    gameViewSource,
    /function handleReturnLobby\(\)[\s\S]*?router\.push\(\{ name: ['"]LobbyHome['"] \}\)/,
  )
  assert.match(gameViewSource, /@return-lobby="handleReturnLobby"/)
})
