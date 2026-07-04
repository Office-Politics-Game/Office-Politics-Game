import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('card deal animation exposes a replayable four-card GSAP sequence', async () => {
  const componentUrl = new URL(
    '../src/components/game/animations/CardDealAnimation.vue',
    import.meta.url,
  )

  await access(componentUrl)
  const source = await readFile(componentUrl, 'utf8')

  assert.match(source, /import \{ gsap \} from 'gsap'/)
  assert.match(source, /card-bg-back\.webp/)
  assert.match(source, /function play\(\{[\s\S]*startRect[\s\S]*deals/)
  assert.match(source, /onCardStart/)
  assert.match(source, /onCardLanded/)
  assert.match(source, /const DEAL_STAGGER = 0\.25/)
  assert.match(source, /const DEAL_DURATION = 0\.55/)
  assert.match(source, /deal\.rotation/)
  assert.match(source, /autoAlpha:\s*0/)
  assert.match(
    source,
    /cardTimeline[\s\S]*\.set\(element,\s*\{[\s\S]*autoAlpha:\s*1/,
  )
  assert.match(source, /defineExpose\(\{[\s\S]*play[\s\S]*cancel/)
})

test('card deal animation supports reduced motion and cleans up timelines', async () => {
  const source = await readSource(
    'src/components/game/animations/CardDealAnimation.vue',
  )

  assert.match(source, /prefers-reduced-motion:\s*reduce/)
  assert.match(source, /function playReducedMotion/)
  assert.match(source, /function cancel\(\)/)
  assert.match(source, /timeline\?\.kill\(\)/)
  assert.match(source, /onUnmounted\(/)
  assert.match(source, /dealCards\.value = \[\]/)
})

test('player hand and opponent seats expose dedicated deal targets', async () => {
  const handSource = await readSource('src/components/game/ui/PlayerHand.vue')
  const seatsSource = await readSource('src/components/game/ui/PlayerSeats.vue')

  assert.match(handSource, /const dealTarget = ref\(null\)/)
  assert.match(handSource, /function getDealTargetRect\(\)/)
  assert.match(handSource, /ref="dealTarget"/)
  assert.match(handSource, /game-card-arrangement--deal-target/)
  assert.match(handSource, /defineExpose\(\{[\s\S]*getDealTargetRect/)

  assert.match(seatsSource, /dealtPlayerIds:/)
  assert.match(seatsSource, /card-bg-back\.webp/)
  assert.match(seatsSource, /player-seat-hand-target/)
  assert.match(seatsSource, /function getHandTargetRect\(playerId\)/)
  assert.match(seatsSource, /defineExpose\(\{[\s\S]*getHandTargetRect/)
  assert.doesNotMatch(seatsSource, /rounded-/)
})

test('card deal demo resets and deals bottom left top right', async () => {
  const source = await readSource('src/views/CardDealDemoView.vue')

  assert.match(source, /const INITIAL_DECK_COUNT = 28/)
  assert.match(
    source,
    /const DEAL_ORDER = \['bottom', 'left', 'top', 'right'\]/,
  )
  assert.match(
    source,
    /const DEAL_ROTATIONS = \{[\s\S]*bottom: 0[\s\S]*left: 90[\s\S]*top: 180[\s\S]*right: -90/,
  )
  assert.match(source, /async function playDeal\(\)/)
  assert.match(source, /if \(isDealing\.value\)/)
  assert.match(source, /function resetDealState\(\)/)
  assert.match(source, /deckCount\.value = INITIAL_DECK_COUNT/)
  assert.match(source, /dealtPlayerIds\.value = \[\]/)
  assert.match(source, /dealAnimation\.value\?\.cancel\(\)/)
  assert.match(source, /onCardStart:/)
  assert.match(source, /deckCount\.value -= 1/)
  assert.match(source, /onCardLanded:/)
  assert.match(source, /dealtPlayerIds\.value = \[/)
  assert.match(source, /isDealing\.value = true/)
  assert.match(source, /isDealing\.value = false/)
  assert.match(source, /無法取得完整的發牌位置/)
  assert.match(source, /<CardDealAnimation/)
  assert.match(source, /<PlayerSeats/)
  assert.match(source, /<PlayerHand/)
  assert.doesNotMatch(source, /rounded-/)
})

test('router registers the card deal demo route', async () => {
  const source = await readSource('src/router/index.js')

  assert.match(source, /import CardDealDemoView from ["']@\/views\/CardDealDemoView\.vue["']/)
  assert.match(source, /path:\s*["']\/card-deal-demo["']/)
  assert.match(source, /name:\s*["']CardDealDemo["']/)
  assert.match(source, /component:\s*CardDealDemoView/)
})
