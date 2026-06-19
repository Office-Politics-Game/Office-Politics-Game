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

test('game view owns four complete player records and passes them through the stage', async () => {
  const gameViewSource = await readSource('src/views/GameView.vue')
  const gameStageSource = await readSource('src/components/game/GameStage.vue')

  for (const playerId of [
    'player-top',
    'player-left',
    'player-right',
    'player-bottom',
  ]) {
    assert.match(gameViewSource, new RegExp(`id: '${playerId}'`))
  }

  for (const position of ['top', 'left', 'right', 'bottom']) {
    assert.match(gameViewSource, new RegExp(`position: '${position}'`))
  }

  assert.equal((gameViewSource.match(/level: 12/g) ?? []).length, 4)
  assert.equal((gameViewSource.match(/isCurrentPlayer: true/g) ?? []).length, 1)
  assert.match(gameViewSource, /id: 'player-top'[\s\S]*roundWins: 3/)
  assert.match(gameViewSource, /id: 'player-left'[\s\S]*roundWins: 0/)
  assert.match(gameViewSource, /id: 'player-right'[\s\S]*roundWins: 1/)
  assert.match(gameViewSource, /id: 'player-bottom'[\s\S]*roundWins: 2/)
  assert.doesNotMatch(gameViewSource, /victoryTokens|132|32/)
  assert.match(gameViewSource, /:players="players"/)
  assert.match(gameStageSource, /players:/)
  assert.match(gameStageSource, /<PlayerSeats :players="players"/)
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
