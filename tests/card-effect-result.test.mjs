import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8')

const animationFiles = [
  'InternAnimation.vue',
  'CleanerAnimation.vue',
  'ManagerAnimation.vue',
  'PMAnimation.vue',
]

test('the former combined result component is removed', async () => {
  await assert.rejects(
    access(new URL('../src/components/game/CardEffectResult.vue', import.meta.url)),
  )

  const stage = await readSource('src/components/game/ui/GameStage.vue')
  const demo = await readSource('src/views/CardPlayTestView.vue')
  assert.doesNotMatch(stage, /CardEffectResult/)
  assert.doesNotMatch(demo, /CardEffectResult/)
})

test('each card result animation is a self-contained teleported GSAP component', async () => {
  for (const filename of animationFiles) {
    const source = await readSource(`src/components/game/animations/${filename}`)
    assert.match(source, /<Teleport to="body">/)
    assert.match(source, /import \{ gsap \} from 'gsap'/)
    assert.match(source, /gsap\.timeline\(/)
    assert.match(source, /prefers-reduced-motion:\s*reduce/)
    assert.match(source, /onBeforeUnmount\(stop\)/)
    assert.match(source, /timeline\?\.kill\(\)/)
    assert.match(source, /emit\('complete'/)
  }
})

test('intern animation supports correct and incorrect outcomes', async () => {
  const source = await readSource('src/components/game/animations/InternAnimation.vue')
  assert.match(source, /playCorrect/)
  assert.match(source, /playIncorrect/)
  assert.match(source, /猜對啦/)
  assert.match(source, /猜錯啦/)
  assert.match(source, /rgba\(74,222,128/)
  assert.match(source, /rgba\(251,113,133/)
  assert.match(source, /rotationY:\s*180/)
  assert.match(source, /rotationY:\s*0/)
  assert.match(source, /discardRect/)
  assert.match(source, /getEffectCardHeight\(\)/)
  assert.doesNotMatch(source, /originRect\.height \* 2\.4/)
})

test('cardplay demo supports another player guessing the current player', async () => {
  const source = await readSource('src/views/CardPlayTestView.vue')

  assert.match(source, /intern-targeted-correct/)
  assert.match(source, /intern-targeted-incorrect/)
  assert.equal(
    (source.match(/targetPlayerId:\s*'player-bottom'/g) ?? []).length >= 2,
    true,
  )
  assert.match(source, /sourceElements\.value\[handCard\?\.id\]\?\.getBoundingClientRect/)
})

test('cleaner animation reveals for two seconds and returns to its hand', async () => {
  const source = await readSource('src/components/game/animations/CleanerAnimation.vue')
  assert.match(source, /getPlayerHandRect/)
  assert.match(source, /\.to\(\{\}, \{ duration: 2 \}\)/)
  assert.match(source, /rotationY:\s*180/)
  assert.match(source, /rotationY:\s*0/)
  assert.match(source, /x: 0,[\s\S]*y: 0,[\s\S]*scale: startScale/)
  assert.doesNotMatch(source, /glow|ring|slash|shockwave/)
})

test('cleaner keeps cards hidden when another player performs the viewing', async () => {
  const source = await readSource('src/components/game/animations/CleanerAnimation.vue')
  const demo = await readSource('src/views/CardPlayTestView.vue')

  assert.match(source, /result\.viewerPlayerId/)
  assert.match(source, /hiddenFromViewer = result\.revealCard === false/)
  assert.match(source, /viewerTranslation = getTranslation\(originRect, viewerRect\)/)
  assert.match(source, /viewerTranslation\.x/)
  assert.match(source, /viewerTranslation\.y/)
  assert.match(source, /getScaleForHeight\(viewerRect, height\) \* 2/)
  assert.match(source, /if \(!hiddenFromViewer\)/)
  assert.match(source, /\.to\(\{\}, \{ duration: 2 \}\)/)
  assert.match(source, /v-if="activeResult\.revealCard !== false"/)
  assert.match(demo, /key:\s*'cleaner-opponent-opponent'/)
  assert.match(demo, /key:\s*'cleaner-opponent-self'/)
  assert.equal((demo.match(/revealCard:\s*false/g) ?? []).length >= 2, true)
  assert.match(demo, /viewerPlayerId:\s*'player-left'/)
  assert.match(
    demo,
    /cleaner-opponent-self[\s\S]*targetPlayerId:\s*'player-bottom'/,
  )
})

test('cleaner flips the current player card from front to back without fading', async () => {
  const source = await readSource('src/components/game/animations/CleanerAnimation.vue')
  const stage = await readSource('src/components/game/ui/GameStage.vue')
  const demo = await readSource('src/views/CardPlayTestView.vue')

  assert.match(source, /isSelfPlayer:/)
  assert.match(
    source,
    /startsFaceUp =[\s\S]*props\.isSelfPlayer\?\.\(result\.targetPlayerId\)/,
  )
  assert.match(source, /rotationY: startsFaceUp \? 0 : 180/)
  assert.match(
    source,
    /if \(startsFaceUp\)[\s\S]*rotationY: 180[\s\S]*'<',/,
  )
  assert.match(
    source,
    /x: 0,[\s\S]*y: 0,[\s\S]*if \(startsFaceUp\)[\s\S]*rotationY: 0[\s\S]*'<',/,
  )
  const cardSetSource = source.slice(
    source.indexOf('gsap.set(cardRef.value'),
    source.indexOf('gsap.set(flipperRef.value'),
  )
  assert.doesNotMatch(cardSetSource, /opacity:/)
  assert.doesNotMatch(
    source,
    /\.to\(cardRef\.value,\s*\{[^}]*opacity:/,
  )
  assert.match(stage, /:is-self-player="animationRects\.isSelfPlayer"/)
  assert.match(
    demo,
    /:is-self-player="\(playerId\) => playerId === 'player-bottom'"/,
  )
})

test('manager animation compares, emphasizes, returns the winner, and discards the loser', async () => {
  const source = await readSource('src/components/game/animations/ManagerAnimation.vue')
  assert.match(source, /sourceWins = result\.outcome === 'win'/)
  assert.match(source, /targetWins = result\.outcome === 'lose'/)
  assert.match(source, /\.to\(\{\}, \{ duration: 0\.5 \}\)/)
  assert.match(source, /scale: 1\.18/)
  assert.match(source, /scale: 0\.76/)
  assert.match(source, /loserGlowRef/)
  assert.match(source, /discardTranslation = getTranslation\(loserRect, discardRect\)/)
  assert.match(source, /winnerScale/)
})

test('manager reveals the opponent loser while shrinking, before it reaches discard', async () => {
  const source = await readSource('src/components/game/animations/ManagerAnimation.vue')
  const demo = await readSource('src/views/CardPlayTestView.vue')

  assert.match(source, /revealAtCenter = result\.revealCards !== false/)
  assert.match(source, /if \(revealAtCenter\)/)
  assert.match(source, /if \(!revealAtCenter\)/)
  assert.match(source, /loserFlipper/)
  assert.match(
    source,
    /\.to\(loser,[\s\S]*scale: 0\.76[\s\S]*if \(!revealAtCenter\)[\s\S]*rotationY: 0[\s\S]*x: discardTranslation\.x/,
  )
  assert.doesNotMatch(source, /\.to\(\{\}, \{ duration: 0\.65 \}\)/)
  assert.match(demo, /key:\s*'manager-opponents'/)
  assert.match(demo, /revealCards:\s*false/)
  assert.match(demo, /sourcePlayerId:\s*'player-left'/)
  assert.match(demo, /targetPlayerId:\s*'player-right'/)
})

test('project manager animation discards then reuses normal draw animation', async () => {
  const source = await readSource('src/components/game/animations/PMAnimation.vue')
  const drawSource = await readSource('src/components/game/animations/CardDrawAnimation.vue')
  assert.match(source, /import CardDrawAnimation/)
  assert.match(source, /getDeckRect/)
  assert.match(source, /drawRef\.value\?\.selfDraw/)
  assert.match(source, /drawRef\.value\?\.othersDraw/)
  assert.match(source, /result\.discardedCard/)
  assert.match(source, /result\.newCard/)
  assert.match(
    source,
    /\.to\(cardRef\.value, \{ x: discardTranslation\.x/,
  )
  assert.match(
    source,
    /showDiscardCard\.value = false[\s\S]*await nextTick\(\)[\s\S]*showVeil\.value = false[\s\S]*await nextTick\(\)[\s\S]*duration: 0\.5[\s\S]*drawRef\.value\?\.selfDraw/,
  )
  assert.match(source, /v-if="showVeil" ref="veilRef"/)
  assert.match(source, /v-if="showDiscardCard" ref="cardRef"/)
  assert.doesNotMatch(source, /glow|ring|slash|shockwave/)
  assert.match(drawSource, /function stop\(\)/)
  assert.match(drawSource, /stop,/)
})

test('game stage and demo mount all four animations directly', async () => {
  const stage = await readSource('src/components/game/ui/GameStage.vue')
  const demo = await readSource('src/views/CardPlayTestView.vue')

  for (const component of [
    'InternAnimation',
    'CleanerAnimation',
    'ManagerAnimation',
    'PMAnimation',
  ]) {
    assert.match(stage, new RegExp(`import ${component}`))
    assert.match(stage, new RegExp(`<${component}`))
    assert.match(demo, new RegExp(`import ${component}`))
    assert.match(demo, new RegExp(`<${component}`))
  }

  assert.match(stage, /effectResult:/)
  assert.match(stage, /'effect-result-complete'/)
  assert.equal((stage.match(/@complete="emit\('effect-result-complete', \$event\)"/g) ?? []).length, 4)
  assert.equal((demo.match(/@complete="handleEffectComplete"/g) ?? []).length, 4)
})

test('cardplay demo removes the three floating opponent source cards', async () => {
  const source = await readSource('src/views/CardPlayTestView.vue')

  assert.doesNotMatch(source, /class="cardplay-test__source-card"/)
  assert.doesNotMatch(source, /cardplay-test__source-card-label/)
  assert.match(
    source,
    /v-for="source in opponentSources"[\s\S]*setSourceElement\(source\.playerId, element\)/,
  )
})
