import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('player avatar components expose the planned static presentation contract', async () => {
  const avatarSource = await readSource('src/components/game/PlayerAvatar.vue')
  const seatsSource = await readSource('src/components/game/PlayerSeats.vue')

  for (const propName of ['name', 'avatarUrl', 'roundWins', 'isCurrentPlayer']) {
    assert.match(avatarSource, new RegExp(`${propName}:`))
  }

  assert.match(avatarSource, /player-avatar--current/)
  assert.match(avatarSource, /player-avatar--winner/)
  assert.match(avatarSource, /v-for="slot in 3"/)
  assert.match(avatarSource, /slot <= roundWins/)
  assert.match(avatarSource, /年度分紅得主/)
  assert.match(avatarSource, /已取得 \$\{roundWins\}／3 枚年終支票/)
  assert.doesNotMatch(avatarSource, /YOUR TURN/)
  assert.match(avatarSource, /animation:\s*current-player-glow 1\.6s ease-in-out infinite/)
  assert.match(avatarSource, /@keyframes current-player-glow/)
  assert.match(avatarSource, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(
    avatarSource,
    /@media \(max-height: 480px\) and \(orientation: landscape\)/,
  )
  assert.match(avatarSource, /width:\s*22px/)
  assert.match(avatarSource, /height:\s*14px/)
  assert.match(avatarSource, /gap:\s*2px/)
  assert.match(avatarSource, /padding:\s*4px 5px/)
  assert.match(
    avatarSource,
    /\.player-avatar--winner\.player-avatar--current \.player-avatar__frame/,
  )
  assert.doesNotMatch(avatarSource, /victoryTokens|勝利 TOKEN/)
  assert.doesNotMatch(avatarSource, /<button|rounded-/)
  assert.match(seatsSource, /Number\.isInteger\(player\?\.roundWins\)/)
  assert.match(seatsSource, /player\?\.roundWins >= 0/)
  assert.match(seatsSource, /player\?\.roundWins <= 3/)
  assert.doesNotMatch(seatsSource, /victoryTokens/)
  assert.match(seatsSource, /positionClasses/)
  assert.match(seatsSource, /top:/)
  assert.match(seatsSource, /left:/)
  assert.match(seatsSource, /right:/)
  assert.match(seatsSource, /bottom:/)
  assert.match(seatsSource, /<PlayerAvatar/)
  assert.doesNotMatch(
    seatsSource,
    /\.player-seats__seat :deep\(\.player-avatar__info\)\s*\{\s*padding:/,
  )
  assert.doesNotMatch(
    seatsSource,
    /\.player-seats__seat :deep\(\.player-avatar\)\s*\{\s*gap:/,
  )
})

test('game view owns four complete player records and passes them through the stage', async () => {
  const gameViewSource = await readSource('src/views/GameView.vue')
  const gameStageSource = await readSource('src/components/game/GameStage.vue')

  for (const playerName of ['摸魚大師', '小菜雞', '豬隊666', '薪水小偷']) {
    assert.match(gameViewSource, new RegExp(playerName))
  }

  for (const position of ['top', 'left', 'right', 'bottom']) {
    assert.match(gameViewSource, new RegExp(`position: '${position}'`))
  }

  assert.equal((gameViewSource.match(/isCurrentPlayer: true/g) ?? []).length, 1)
  assert.match(gameViewSource, /name: '摸魚大師'[\s\S]*roundWins: 3/)
  assert.match(gameViewSource, /name: '小菜雞'[\s\S]*roundWins: 0/)
  assert.match(gameViewSource, /name: '豬隊666'[\s\S]*roundWins: 1/)
  assert.match(gameViewSource, /name: '薪水小偷'[\s\S]*roundWins: 2/)
  assert.doesNotMatch(gameViewSource, /victoryTokens|132|32|12/)
  assert.match(gameViewSource, /:players="players"/)
  assert.match(gameStageSource, /players:/)
  assert.match(gameStageSource, /<PlayerSeats :players="players"/)
})

test('the selected bonus cheque badge exists as a PNG asset', async () => {
  const assetUrl = new URL('../src/assets/BonusChequeToken.png', import.meta.url)

  await access(assetUrl)
  const signature = (await readFile(assetUrl)).subarray(0, 8)

  assert.deepEqual([...signature], [137, 80, 78, 71, 13, 10, 26, 10])
})

test('game table shows the brand beside a standalone settings icon', async () => {
  const gameStageSource = await readSource('src/components/game/GameStage.vue')
  const settingsSource = await readSource('src/components/game/GameSettingsIcon.vue')

  assert.match(gameStageSource, /LOGO_En_W\.png/)
  assert.match(gameStageSource, /game-brand-tools/)
  assert.match(gameStageSource, /<GameSettingsIcon/)
  assert.match(settingsSource, /size-\[clamp\(42px,4\.8vw,58px\)\]/)
  assert.doesNotMatch(settingsSource, /<button|rounded-|bg-\[|\bborder\b|border-|backdrop-blur/)
})
