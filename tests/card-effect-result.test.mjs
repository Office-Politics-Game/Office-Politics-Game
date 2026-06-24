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

  const stage = await readSource('src/components/game/GameStage.vue')
  const demo = await readSource('src/views/CardPlayTestView.vue')
  assert.doesNotMatch(stage, /CardEffectResult/)
  assert.doesNotMatch(demo, /CardEffectResult/)
})

test('each card result animation is a self-contained teleported GSAP component', async () => {
  for (const filename of animationFiles) {
    const source = await readSource(`src/components/game/${filename}`)
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
  const source = await readSource('src/components/game/InternAnimation.vue')
  assert.match(source, /playCorrect/)
  assert.match(source, /playIncorrect/)
  assert.match(source, /猜對啦/)
  assert.match(source, /猜錯啦/)
  assert.match(source, /rgba\(74,222,128/)
  assert.match(source, /rgba\(251,113,133/)
  assert.match(source, /rotationY:\s*180/)
  assert.match(source, /rotationY:\s*0/)
  assert.match(source, /discardRect/)
})

test('cleaner animation reveals for two seconds and returns to its hand', async () => {
  const source = await readSource('src/components/game/CleanerAnimation.vue')
  assert.match(source, /getPlayerHandRect/)
  assert.match(source, /\.to\(\{\}, \{ duration: 2 \}\)/)
  assert.match(source, /rotationY:\s*180/)
  assert.match(source, /rotationY:\s*0/)
  assert.match(source, /x: 0, y: 0, scale: startScale/)
  assert.doesNotMatch(source, /glow|ring|slash|shockwave/)
})

test('manager animation compares, emphasizes, returns the winner, and discards the loser', async () => {
  const source = await readSource('src/components/game/ManagerAnimation.vue')
  assert.match(source, /sourceWins = result\.outcome === 'win'/)
  assert.match(source, /targetWins = result\.outcome === 'lose'/)
  assert.match(source, /\.to\(\{\}, \{ duration: 0\.5 \}\)/)
  assert.match(source, /scale: 1\.18/)
  assert.match(source, /scale: 0\.76/)
  assert.match(source, /loserGlowRef/)
  assert.match(source, /discardX/)
  assert.match(source, /winnerScale/)
})

test('project manager animation discards then reuses normal draw animation', async () => {
  const source = await readSource('src/components/game/PMAnimation.vue')
  const drawSource = await readSource('src/components/game/CardDrawAnimation.vue')
  assert.match(source, /import CardDrawAnimation/)
  assert.match(source, /getDeckRect/)
  assert.match(source, /drawRef\.value\?\.selfDraw/)
  assert.match(source, /drawRef\.value\?\.othersDraw/)
  assert.match(source, /result\.discardedCard/)
  assert.match(source, /result\.newCard/)
  assert.doesNotMatch(source, /glow|ring|slash|shockwave/)
  assert.match(drawSource, /function stop\(\)/)
  assert.match(drawSource, /stop,/)
})

test('game stage and demo mount all four animations directly', async () => {
  const stage = await readSource('src/components/game/GameStage.vue')
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
