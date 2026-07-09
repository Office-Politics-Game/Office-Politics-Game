import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('pre-game audio assets use semantic filenames', async () => {
  const audioFiles = await readdir(new URL('../src/assets/audio/', import.meta.url))

  assert.equal(audioFiles.includes('lobby-ambience-office-60s.mp3'), false)
  assert.ok(audioFiles.includes('login-button-click.mp3'))
  assert.ok(audioFiles.includes('lobby-navigation-whoosh.mp3'))
  assert.ok(audioFiles.includes('lobby-footsteps-heels-01.mp3'))
  assert.ok(audioFiles.includes('lobby-footsteps-heels-02.mp3'))
  assert.ok(audioFiles.includes('lobby-footsteps-heels-03.mp3'))
  assert.ok(audioFiles.includes('lobby-footsteps-heels-04.mp3'))
  assert.equal(audioFiles.some((fileName) => fileName.endsWith('.mp3.mp3')), false)
})

test('pre-game audio controller maps detail layers and ui sounds', async () => {
  const source = await readSource('src/composables/UsePreGameAudio.js')

  assert.match(source, /loginButtonClickUrl/)
  assert.match(source, /lobbyNavigationWhooshUrl/)
  assert.match(source, /lobbyFootstepsHeels01Url/)
  assert.match(source, /lobbyFootstepsHeels02Url/)
  assert.match(source, /lobbyFootstepsHeels03Url/)
  assert.match(source, /lobbyFootstepsHeels04Url/)
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

test('pre-game background audio only runs on entry and auth screens', async () => {
  const source = await readSource('src/composables/UsePreGameAudio.js')
  const routeNamesMatch = source.match(
    /PRE_GAME_AUDIO_ROUTE_NAMES = Object\.freeze\(\[([\s\S]*?)\]\)/,
  )

  assert.ok(routeNamesMatch)

  const routeNames = Array.from(routeNamesMatch[1].matchAll(/"([^"]+)"/g)).map(
    ([, routeName]) => routeName,
  )

  assert.deepEqual(routeNames, ["Entry", "Login", "Register"])
})

test('lobby footstep layer uses all heel sounds with stereo spread', async () => {
  const source = await readSource('src/composables/UsePreGameAudio.js')
  const layerUrls = Array.from(
    source.matchAll(/url: (lobbyFootstepsHeels\d\dUrl)/g),
  ).map(([, layerUrl]) => layerUrl)

  assert.match(source, /LOBBY_FOOTSTEP_LAYERS/)
  assert.match(source, /lobbyFootstepsHeels01Url/)
  assert.match(source, /lobbyFootstepsHeels02Url/)
  assert.match(source, /lobbyFootstepsHeels03Url/)
  assert.match(source, /lobbyFootstepsHeels04Url/)
  assert.deepEqual(layerUrls, [
    'lobbyFootstepsHeels01Url',
    'lobbyFootstepsHeels02Url',
    'lobbyFootstepsHeels03Url',
    'lobbyFootstepsHeels04Url',
  ])
  assert.match(source, /createStereoPanner/)
  assert.match(source, /\.pan\.value/)
  assert.match(source, /playFootstepLayer/)
  assert.match(source, /FOOTSTEP_INITIAL_DELAY_MS/)
  assert.match(source, /scheduleFootstepLayer\(\{ initial: true \}\)/)
  assert.match(source, /layers\.forEach/)
  assert.doesNotMatch(source, /Math\.floor\(Math\.random\(\) \* audios\.length\)/)
})

test('pre-game audio mix keeps footsteps present without ambience music', async () => {
  const source = await readSource('src/composables/UsePreGameAudio.js')
  const detailGain = Number(source.match(/LOBBY_DETAIL_GAIN = ([\d.]+)/)?.[1])
  const layerGains = Array.from(source.matchAll(/gain: ([\d.]+)/g)).map(([, gain]) =>
    Number(gain),
  )

  assert.ok(detailGain >= 0.5)
  assert.ok(layerGains.length >= 4)
  assert.ok(layerGains.every((gain) => gain >= 0.9))
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
