import assert from 'node:assert/strict'
import { readdir, readFile, stat } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8').catch((error) => {
    if (error?.code === 'ENOENT') {
      return ''
    }

    throw error
  })

test('game table background music uses the supplied semantic audio asset', async () => {
  const audioDirectory = new URL('../src/assets/audio/', import.meta.url)
  const audioFiles = await readdir(audioDirectory)
  const themeFileName = 'game-table-start-theme.mp3'

  assert.ok(audioFiles.includes(themeFileName))
  assert.ok((await stat(new URL(themeFileName, audioDirectory))).size > 0)
})

test('game table audio controller plays the shuffle effect using sound settings', async () => {
  const audioDirectory = new URL('../src/assets/audio/', import.meta.url)
  const audioFiles = await readdir(audioDirectory)
  const source = await readSource('src/composables/UseGameTableAudio.js')

  assert.ok(audioFiles.includes('game-card-shuffle.ogg'))
  assert.ok(
    (await stat(new URL('game-card-shuffle.ogg', audioDirectory))).size > 0,
  )
  assert.match(source, /gameCardShuffleSoundUrl/)
  assert.match(source, /new Audio\(gameCardShuffleSoundUrl\)/)
  assert.match(source, /function playGameCardShuffleSound/)
  assert.match(source, /soundEnabled/)
  assert.match(source, /soundVolume/)
  assert.match(source, /audio\.currentTime = 0/)
  assert.match(source, /playGameCardShuffleSound,/)
})

test('shuffle effect uses two short low-gain layers and clears stale playback', async () => {
  const source = await readSource('src/composables/UseGameTableAudio.js')

  assert.match(source, /GAME_CARD_SHUFFLE_SOUND_DURATION_MS = 1200/)
  assert.match(source, /GAME_CARD_SHUFFLE_LAYER_DELAY_MS = 100/)
  assert.match(source, /GAME_CARD_SHUFFLE_PRIMARY_GAIN = 0\.25/)
  assert.match(source, /GAME_CARD_SHUFFLE_SECONDARY_GAIN = 0\.15/)
  assert.equal(
    (source.match(/new Audio\(gameCardShuffleSoundUrl\)/g) ?? []).length,
    2,
  )
  assert.match(source, /window\.setTimeout/)
  assert.match(source, /window\.clearTimeout/)
  assert.match(source, /audio\.pause\(\)/)
  assert.match(source, /targetVolume \* GAME_CARD_SHUFFLE_PRIMARY_GAIN/)
  assert.match(source, /targetVolume \* GAME_CARD_SHUFFLE_SECONDARY_GAIN/)
  assert.match(
    source,
    /GAME_CARD_SHUFFLE_LAYER_DELAY_MS \+\s*GAME_CARD_SHUFFLE_SOUND_DURATION_MS/,
  )
})

test('shuffle animation starts one sound after validating its input', async () => {
  const source = await readSource(
    'src/components/game/animations/CardShuffleAnimation.vue',
  )
  const guardIndex = source.indexOf(
    'if (!resolvedDeckPose?.rect || deckCount <= 0)',
  )
  const soundIndex = source.indexOf('playGameCardShuffleSound()')
  const timelineIndex = source.indexOf('await waitForTimeline')

  assert.match(source, /useGameTableAudio/)
  assert.equal((source.match(/playGameCardShuffleSound\(\)/g) ?? []).length, 1)
  assert.ok(guardIndex >= 0)
  assert.ok(soundIndex > guardIndex)
  assert.ok(timelineIndex > soundIndex)
})

test('game table audio controller owns one repeating theme and a five second fade', async () => {
  const source = await readSource('src/composables/UseGameTableAudio.js')

  assert.match(source, /gameTableStartThemeUrl/)
  assert.match(source, /GAME_TABLE_MUSIC_GAIN = 0\.2/)
  assert.match(source, /GAME_TABLE_MUSIC_FADE_IN_MS = 5000/)
  assert.match(source, /let gameTableMusicAudio = null/)
  assert.match(source, /let gameTableMusicFadeTimerId = null/)
  assert.match(source, /function ensureGameTableMusicAudio/)
  assert.match(source, /new Audio\(gameTableStartThemeUrl\)/)
  assert.match(source, /audio\.loop = false/)
  assert.match(source, /audio\.preload = ["']auto["']/)
  assert.match(source, /window\.setInterval/)
  assert.match(
    source,
    /\(Date\.now\(\) - fadeStartedAt\) \/ GAME_TABLE_MUSIC_FADE_IN_MS/,
  )
})

test('game table theme manually restarts with a fresh fade after each ending', async () => {
  const source = await readSource('src/composables/UseGameTableAudio.js')

  assert.match(source, /function handleGameTableMusicEnded/)
  assert.match(
    source,
    /audio\.addEventListener\(["']ended["'], handleGameTableMusicEnded\)/,
  )
  assert.equal(
    (source.match(/addEventListener\(["']ended["']/g) ?? []).length,
    1,
  )
  assert.match(
    source,
    /if \(!gameTableBackgroundActive \|\| !musicEnabled\.value \|\| targetVolume <= 0\) \{\s*return;/,
  )
  assert.match(
    source,
    /audio\.currentTime = 0;\s*fadeInGameTableMusic\(audio\);/,
  )
  assert.doesNotMatch(source, /preGameLobbyTheme|lobbyMoneyChant|soundEffect/)
})

test('game table audio controller exposes idempotent lifecycle commands', async () => {
  const source = await readSource('src/composables/UseGameTableAudio.js')

  assert.match(source, /export function useGameTableAudio/)
  assert.match(source, /function startGameTableBackground/)
  assert.match(source, /function stopGameTableBackground/)
  assert.match(source, /startGameTableBackground,/)
  assert.match(source, /stopGameTableBackground,/)
  assert.match(
    source,
    /if \(!audio\.paused \|\| gameTableMusicFadeTimerId !== null\) \{\s*return;/,
  )
  assert.match(source, /window\.clearInterval\(gameTableMusicFadeTimerId\)/)
  assert.match(source, /audio\.pause\(\)/)
  assert.match(source, /audio\.currentTime = 0/)
})

test('game table background follows shared music settings without using sound settings', async () => {
  const source = await readSource('src/composables/UseGameTableAudio.js')
  const settingsWatcherSource = source.slice(
    source.indexOf('function ensureSettingsWatcher()'),
    source.indexOf('export function useGameTableAudio()'),
  )

  assert.match(source, /useAudioSettings/)
  assert.match(source, /musicEnabled/)
  assert.match(source, /musicVolume/)
  assert.match(source, /watch\(\s*\[musicEnabled, musicVolume\]/)
  assert.match(source, /gameTableBackgroundActive/)
  assert.match(
    source,
    /Math\.min\(1, Math\.max\(0, numericVolume \/ 100\)\) \* GAME_TABLE_MUSIC_GAIN/,
  )
  assert.doesNotMatch(settingsWatcherSource, /soundEnabled/)
  assert.doesNotMatch(settingsWatcherSource, /soundVolume/)
})

test('game table audio safely handles unavailable or rejected playback', async () => {
  const source = await readSource('src/composables/UseGameTableAudio.js')

  assert.match(
    source,
    /typeof window !== ["']undefined["'] && typeof Audio !== ["']undefined["']/,
  )
  assert.match(source, /if \(!canUseAudio\(\)\) \{\s*return;/)
  assert.match(source, /playResult\.catch\(\(\) => \{\}\)/)
})

test('GameView starts music only after GameStage is ready and stops it on unmount', async () => {
  const source = await readSource('src/views/GameView.vue')

  assert.match(source, /useGameTableAudio/)
  assert.match(
    source,
    /const \{ startGameTableBackground, stopGameTableBackground \} =\s*useGameTableAudio\(\)/,
  )
  assert.match(
    source,
    /watch\(\s*hasLoadedInitialState,\s*\(isGameStageReady\) => \{\s*if \(isGameStageReady\) \{\s*startGameTableBackground\(\)/,
  )
  assert.match(source, /\{ flush: ["']post["'] \}/)
  assert.match(
    source,
    /onBeforeUnmount\(\(\) => \{[\s\S]*?stopGameTableBackground\(\)[\s\S]*?cleanupGameSocket\(\)/,
  )

  const startCalls = source.match(/startGameTableBackground\(\)/g) ?? []
  assert.equal(startCalls.length, 1)
})
