import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('player avatar keeps the player data and token rendering contract', async () => {
  const avatarSource = await readSource('src/components/game/PlayerAvatar.vue')
  const seatsSource = await readSource('src/components/game/PlayerSeats.vue')

  for (const propName of [
    'name',
    'avatarUrl',
    'roundWins',
    'level',
    'isCurrentPlayer',
    'isMirrored',
  ]) {
    assert.match(avatarSource, new RegExp(`${propName}:`))
  }

  assert.match(avatarSource, /player-avatar--current/)
  assert.match(avatarSource, /player-avatar__portrait/)
  assert.match(avatarSource, /player-avatar__level/)
  assert.match(avatarSource, /\{\{ level \}\}/)
  assert.match(avatarSource, /v-for="slot in 3"/)
  assert.match(avatarSource, /v-if="slot <= roundWins"/)
  assert.match(avatarSource, /v-else/)
  assert.match(avatarSource, /bonusChequeTokenUrl/)
  assert.match(avatarSource, /player-avatar__cheque-placeholder/)
  assert.match(avatarSource, /border-dashed/)
  assert.match(avatarSource, /flex-row-reverse/)
  assert.match(avatarSource, /player-avatar__info--mirrored/)
  assert.match(avatarSource, /@keyframes current-player-glow/)
  assert.doesNotMatch(avatarSource, /victoryTokens|勝利 TOKEN/)
  assert.doesNotMatch(avatarSource, /player-avatar--winner|winner-gold|isMatchWinner/)
  assert.doesNotMatch(avatarSource, /grayscale\(1\) brightness\(0\.58\)/)
  assert.doesNotMatch(avatarSource, /<button/)

  assert.match(seatsSource, /Number\.isInteger\(player\?\.roundWins\)/)
  assert.match(seatsSource, /player\?\.roundWins >= 0/)
  assert.match(seatsSource, /player\?\.roundWins <= 3/)
  assert.match(seatsSource, /player\?\.level/)
  assert.match(seatsSource, /positionClasses/)

  for (const position of ['top', 'left', 'right', 'bottom']) {
    assert.match(seatsSource, new RegExp(`${position}:`))
  }

  assert.match(seatsSource, /<PlayerAvatar/)
  assert.match(seatsSource, /:level="player\.level"/)
  assert.match(seatsSource, /:is-mirrored="player\.position === 'right'"/)
  assert.doesNotMatch(seatsSource, /victoryTokens/)
})

test('game view derives four viewer-relative player records and passes them through the stage', async () => {
  const gameViewSource = await readSource('src/views/GameView.vue')
  const gameStageSource = await readSource('src/components/game/GameStage.vue')

  assert.match(gameViewSource, /const seatPositions = \['top', 'left', 'right', 'bottom'\]/)
  assert.match(gameViewSource, /const players = computed\(\(\) =>/)
  assert.match(gameViewSource, /viewerRelativePlayers\.slice\(0, 4\)\.map/)
  assert.match(gameViewSource, /id: playerId/)
  assert.match(gameViewSource, /position: seatPositions\[index\] \?\? 'bottom'/)
  assert.match(gameViewSource, /roundWins: normalizeRoundWins/)
  assert.match(gameViewSource, /isCurrentPlayer: playerId === resolvedCurrentPlayerId\.value/)
  assert.match(gameViewSource, /:players="players"/)
  assert.match(gameStageSource, /players:/)
  assert.match(gameStageSource, /<PlayerSeats[\s\S]*:players="players"/)
})

test('the selected bonus cheque badge exists as a PNG asset', async () => {
  const assetUrl = new URL(
    '../src/assets/images/bonus-cheque-token.png',
    import.meta.url,
  )

  await access(assetUrl)
  const signature = (await readFile(assetUrl)).subarray(0, 8)

  assert.deepEqual([...signature], [137, 80, 78, 71, 13, 10, 26, 10])
})

test('game table shows the brand beside a standalone settings icon', async () => {
  const gameStageSource = await readSource('src/components/game/GameStage.vue')
  const settingsSource = await readSource(
    'src/components/game/GameSettingsIcon.vue',
  )

  assert.match(gameStageSource, /logo-en-white\.png/)
  assert.match(gameStageSource, /game-brand-tools/)
  assert.match(gameStageSource, /<GameSettingsIcon/)
  assert.match(settingsSource, /<button/)
  assert.match(settingsSource, /emit\('open'\)/)
})
