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

test('game table audio controller plays the deal sound at reduced gain', async () => {
  const audioDirectory = new URL('../src/assets/audio/', import.meta.url)
  const audioFiles = await readdir(audioDirectory)
  const source = await readSource('src/composables/UseGameTableAudio.js')

  assert.ok(audioFiles.includes('game-card-draw.mp3'))
  assert.ok(
    (await stat(new URL('game-card-draw.mp3', audioDirectory))).size > 0,
  )
  assert.match(source, /gameCardDealSoundUrl/)
  assert.match(source, /GAME_CARD_DEAL_SOUND_GAIN = 0\.35/)
  assert.match(source, /new Audio\(gameCardDealSoundUrl\)/)
  assert.match(source, /function playGameCardDealSound/)
  assert.match(source, /targetVolume \* GAME_CARD_DEAL_SOUND_GAIN/)
  assert.match(source, /playGameCardDealSound,/)
})

test('game table audio controller plays the card-play rise sound at reduced gain', async () => {
  const audioDirectory = new URL('../src/assets/audio/', import.meta.url)
  const audioFiles = await readdir(audioDirectory)
  const source = await readSource('src/composables/UseGameTableAudio.js')

  assert.ok(audioFiles.includes('game-card-play-rise.mp3'))
  assert.ok(
    (await stat(new URL('game-card-play-rise.mp3', audioDirectory))).size > 0,
  )
  assert.match(source, /gameCardPlaySoundUrl/)
  assert.match(source, /GAME_CARD_PLAY_SOUND_GAIN = 0\.4/)
  assert.equal(
    (source.match(/new Audio\(gameCardPlaySoundUrl\)/g) ?? []).length,
    1,
  )
  assert.match(source, /function playGameCardPlaySound/)
  assert.match(source, /audio\.currentTime = 0/)
  assert.match(source, /targetVolume \* GAME_CARD_PLAY_SOUND_GAIN/)
  assert.match(source, /playGameCardPlaySound,/)
})

test('card-play rise sound asset is trimmed for responsive playback', async () => {
  const audioFile = new URL(
    '../src/assets/audio/game-card-play-rise.mp3',
    import.meta.url,
  )
  const { size } = await stat(audioFile)

  assert.ok(size > 25 * 1024, 'trimmed rise sound must retain its full tail')
  assert.ok(size < 40 * 1024, 'trimmed rise sound must remove its silent prefix')
})

test('Intern guess result sound controller maps semantic outcomes to dedicated assets', async () => {
  const audioDirectory = new URL('../src/assets/audio/', import.meta.url)
  const audioFiles = await readdir(audioDirectory)
  const source = await readSource('src/composables/UseGameTableAudio.js')
  const resultSoundSource = source.slice(
    source.indexOf('function playInternGuessResultSound'),
    source.indexOf('function playSeniorProtectionActivateSound'),
  )
  const resultAudioFactorySource = source.slice(
    source.indexOf('function ensureInternGuessResultAudios'),
    source.indexOf('function ensureGameSeniorProtectionActivateAudio'),
  )
  const safePlaybackSource = source.slice(
    source.indexOf('function playAudio'),
    source.indexOf('function playGameCardShuffleSound'),
  )

  for (const fileName of [
    'intern-guess-correct.mp3',
    'intern-guess-incorrect.mp3',
  ]) {
    assert.ok(audioFiles.includes(fileName))
    assert.ok((await stat(new URL(fileName, audioDirectory))).size > 0)
  }

  assert.match(
    source,
    /import internGuessCorrectSoundUrl from ["']@\/assets\/audio\/intern-guess-correct\.mp3["'];/,
  )
  assert.match(
    source,
    /import internGuessIncorrectSoundUrl from ["']@\/assets\/audio\/intern-guess-incorrect\.mp3["'];/,
  )
  assert.match(source, /INTERN_GUESS_RESULT_SOUND_GAIN = 0\.45/)
  assert.match(source, /let internGuessResultAudios = null/)
  assert.equal(
    (source.match(/new Audio\(internGuessCorrectSoundUrl\)/g) ?? []).length,
    1,
  )
  assert.equal(
    (source.match(/new Audio\(internGuessIncorrectSoundUrl\)/g) ?? []).length,
    1,
  )
  assert.match(
    resultAudioFactorySource,
    /Object\.values\(internGuessResultAudios\)\.forEach\(\(audio\) => \{\s*audio\.preload = ["']auto["'];\s*\}\);/,
  )
  assert.match(
    resultSoundSource,
    /if \(!canUseAudio\(\) \|\| !\["correct", "incorrect"\]\.includes\(outcome\)\) \{\s*return;/,
  )
  assert.ok(
    resultSoundSource.indexOf('canUseAudio()') <
      resultSoundSource.indexOf('useAudioSettings()'),
  )
  assert.match(
    resultSoundSource,
    /const \{ soundEnabled, soundVolume \} = useAudioSettings\(\)/,
  )
  assert.match(
    resultSoundSource,
    /if \(!soundEnabled\.value \|\| targetVolume <= 0\) \{\s*return;/,
  )
  assert.match(
    resultSoundSource,
    /ensureInternGuessResultAudios\(\)\[outcome\]/,
  )
  assert.match(resultSoundSource, /audio\.currentTime = 0/)
  assert.match(
    resultSoundSource,
    /targetVolume \* INTERN_GUESS_RESULT_SOUND_GAIN/,
  )
  assert.match(resultSoundSource, /playAudio\(audio\)/)
  assert.match(
    safePlaybackSource,
    /try \{\s*const playResult = audio\.play\(\);/,
  )
  assert.match(
    safePlaybackSource,
    /playResult && typeof playResult\.catch === ["']function["']/,
  )
  assert.match(safePlaybackSource, /playResult\.catch\(\(\) => \{\}\)/)
  assert.match(safePlaybackSource, /\} catch \{[\s\S]*?\}/)
  assert.match(source, /playInternGuessResultSound,/)
})

test('formal table wires Intern result reveal sound while the animation demo stays silent', async () => {
  const stageSource = await readSource('src/components/game/ui/GameStage.vue')
  const demoSource = await readSource('src/views/CardPlayTestView.vue')

  assert.match(
    stageSource,
    /const \{[\s\S]*playInternGuessResultSound[\s\S]*\} = useGameTableAudio\(\)/,
  )
  assert.match(
    stageSource,
    /<InternAnimation[\s\S]*@outcome-reveal="playInternGuessResultSound"[\s\S]*\/>/,
  )
  assert.doesNotMatch(demoSource, /playInternGuessResultSound/)
  assert.doesNotMatch(demoSource, /@outcome-reveal/)
})

test('formal table plays one card-play rise sound before each valid player animation', async () => {
  const stageSource = await readSource('src/components/game/ui/GameStage.vue')
  const cardPlaySource = await readSource(
    'src/composables/useGameStageCardPlay.js',
  )
  const demoSource = await readSource('src/views/CardPlayTestView.vue')
  const localPlaySource = cardPlaySource.slice(
    cardPlaySource.indexOf('async function playActiveCard'),
    cardPlaySource.indexOf('function handleWindowPointerMove'),
  )
  const remotePlaySource = cardPlaySource.slice(
    cardPlaySource.indexOf('async function playRemoteCardPlayAnimation'),
    cardPlaySource.indexOf('function cleanupCardPlay'),
  )
  const localGuardIndex = localPlaySource.indexOf(
    'if (!card || !releaseRect || !discardRect.value)',
  )
  const localSoundIndex = localPlaySource.indexOf('playGameCardPlaySound()')
  const localAnimationIndex = localPlaySource.indexOf(
    'cardPlayAnimation.value?.play',
  )
  const remoteGuardIndex = remotePlaySource.indexOf(
    'if (!originRect || !targetRect)',
  )
  const remoteSoundIndex = remotePlaySource.indexOf('playGameCardPlaySound()')
  const remoteAnimationIndex = remotePlaySource.indexOf(
    'cardPlayAnimation.value?.play',
  )

  assert.match(
    stageSource,
    /const \{[\s\S]*playGameCardPlaySound[\s\S]*\} = useGameTableAudio\(\)/,
  )
  assert.match(
    stageSource,
    /useGameStageCardPlay\(\{[\s\S]*playGameCardPlaySound/,
  )
  assert.match(cardPlaySource, /playGameCardPlaySound = \(\) => \{\}/)
  assert.equal(
    (cardPlaySource.match(/playGameCardPlaySound\(\)/g) ?? []).length,
    2,
  )
  assert.ok(localGuardIndex >= 0)
  assert.ok(localSoundIndex > localGuardIndex)
  assert.ok(localAnimationIndex > localSoundIndex)
  assert.ok(remoteGuardIndex >= 0)
  assert.ok(remoteSoundIndex > remoteGuardIndex)
  assert.ok(remoteAnimationIndex > remoteSoundIndex)
  assert.match(
    remotePlaySource,
    /if \(!playerId \|\| !card \|\| animationRects\.isSelfPlayer\(playerId\)\) \{\s*return false;/,
  )
  assert.doesNotMatch(demoSource, /playGameCardPlaySound/)
})

test('formal table plays one deal sound for every valid draw animation', async () => {
  const stageSource = await readSource('src/components/game/ui/GameStage.vue')
  const sequenceSource = await readSource(
    'src/composables/useGameStageDrawSequence.js',
  )
  const demoSource = await readSource('src/views/CardPlayTestView.vue')
  const regularDrawSource = sequenceSource.slice(
    sequenceSource.indexOf('async function playDrawAnimation'),
    sequenceSource.indexOf('async function playInitialRoundDrawSequence'),
  )
  const initialDealSource = sequenceSource.slice(
    sequenceSource.indexOf('async function playInitialRoundDrawSequence'),
  )
  const invalidRectGuardIndex = regularDrawSource.indexOf(
    'if (!startRect || !targetRect)',
  )
  const invalidRectReturnIndex = regularDrawSource.indexOf(
    'return false;',
    invalidRectGuardIndex,
  )
  const soundIndex = regularDrawSource.indexOf('playGameCardDealSound()')
  const animationIndex = regularDrawSource.indexOf(
    'await cardDrawAnimation.value?.selfDraw',
  )

  assert.match(stageSource, /useGameTableAudio/)
  assert.match(stageSource, /playGameCardDealSound/)
  assert.match(
    stageSource,
    /useGameStageDrawSequence\(\{[\s\S]*playGameCardDealSound/,
  )
  assert.match(sequenceSource, /playGameCardDealSound = \(\) => \{\}/)
  assert.equal(
    (regularDrawSource.match(/playGameCardDealSound\(\)/g) ?? []).length,
    1,
  )
  assert.ok(invalidRectGuardIndex >= 0)
  assert.ok(invalidRectReturnIndex > invalidRectGuardIndex)
  assert.ok(soundIndex > invalidRectReturnIndex)
  assert.ok(animationIndex > soundIndex)
  assert.match(
    initialDealSource,
    /for \(const player of props\.players\) \{\s*const didDraw = await playDrawAnimation/,
  )
  assert.doesNotMatch(demoSource, /playGameCardDealSound/)
})

test('Senior protection uses a dedicated activation sound with shared settings', async () => {
  const audioDirectory = new URL('../src/assets/audio/', import.meta.url)
  const audioFiles = await readdir(audioDirectory)
  const source = await readSource('src/composables/UseGameTableAudio.js')

  assert.ok(audioFiles.includes('game-senior-protection-activate.mp3'))
  assert.ok(
    (
      await stat(
        new URL('game-senior-protection-activate.mp3', audioDirectory),
      )
    ).size > 0,
  )
  assert.ok(!audioFiles.includes('Cheesy force field on and off Sound effect.mp3'))
  assert.match(source, /gameSeniorProtectionActivateSoundUrl/)
  assert.match(source, /GAME_SENIOR_PROTECTION_ACTIVATE_SOUND_GAIN = 0\.45/)
  assert.match(source, /new Audio\(gameSeniorProtectionActivateSoundUrl\)/)
  assert.match(source, /function playSeniorProtectionActivateSound/)
  assert.match(source, /soundEnabled/)
  assert.match(source, /soundVolume/)
  assert.match(source, /audio\.currentTime = 0/)
  assert.match(
    source,
    /targetVolume \* GAME_SENIOR_PROTECTION_ACTIVATE_SOUND_GAIN/,
  )
  assert.match(source, /playSeniorProtectionActivateSound,/)
})

test('Senior protection sound starts only for the Senior activation animation', async () => {
  const stageSource = await readSource('src/components/game/ui/GameStage.vue')
  const effectSource = await readSource(
    'src/composables/useGameStageEffectAnimation.js',
  )
  const playEffectSource = effectSource.slice(
    effectSource.indexOf('function playEffectAnimation'),
    effectSource.indexOf('function handleEffectAnimationComplete'),
  )

  assert.match(
    stageSource,
    /const \{[\s\S]*playSeniorProtectionActivateSound[\s\S]*\} = useGameTableAudio\(\)/,
  )
  assert.match(
    stageSource,
    /useGameStageEffectAnimation\(\{[\s\S]*playSeniorProtectionActivateSound/,
  )
  assert.match(
    effectSource,
    /playSeniorProtectionActivateSound = \(\) => \{\}/,
  )
  assert.match(
    playEffectSource,
    /if \(nextResult\.type === ["']protection["'] && nextResult\.sourceType === ["']senior["']\) \{\s*playSeniorProtectionActivateSound\(\);\s*\}/,
  )
  assert.equal(
    (playEffectSource.match(/playSeniorProtectionActivateSound\(\)/g) ?? [])
      .length,
    1,
  )
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
