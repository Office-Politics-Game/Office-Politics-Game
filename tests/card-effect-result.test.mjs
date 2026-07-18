import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'
import { ref } from 'vue'
import { useGameStageCardVisibility } from '../src/composables/useGameStageCardVisibility.js'

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
  assert.match(source, /rotationY: keepsFaceUp \? 0 : 180/)
  assert.match(source, /getFlipVars\(0, timing\.flip\)/)
  assert.match(source, /getFlipVars\(180, timing\.flip\)/)
  assert.match(source, /getReturnToOriginVars\(startScale/)
  assert.match(source, /x: 0,[\s\S]*y: 0,[\s\S]*scale: startScale/)
  assert.doesNotMatch(source, /glowRef|ringRef|slashRef|shockwaveRef/)
})

test('cleaner keeps cards hidden when another player performs the viewing', async () => {
  const source = await readSource('src/components/game/animations/CleanerAnimation.vue')
  const demo = await readSource('src/views/CardPlayTestView.vue')

  assert.match(source, /result\.viewerPlayerId/)
  assert.match(source, /hiddenFromViewer = result\.revealCard === false/)
  assert.match(source, /viewerTranslation = getTranslation\(originRect, viewerRect\)/)
  assert.match(source, /getMoveVars\(viewerTranslation/)
  assert.match(source, /getScaleForHeight\(viewerRect, height\) \* 2/)
  assert.match(source, /if \(!hiddenFromViewer\)/)
  assert.match(source, /\.to\(\{\}, \{ duration: 2 \}\)/)
  assert.match(source, /v-if="activeResult\.revealCard !== false"/)
  assert.match(demo, /viewerPlayerId:\s*SELF_PLAYER_ID/)
  assert.match(demo, /targetPlayerId:\s*'player-top'/)
})

test('cleaner prompt shows only the target player', async () => {
  const source = await readSource('src/components/game/animations/CleanerAnimation.vue')
  const stage = await readSource('src/components/game/ui/GameStage.vue')
  const demo = await readSource('src/views/CardPlayTestView.vue')

  assert.match(source, /targetPlayerName:\s*\{ type: String, default: ['"]玩家['"] \}/)
  assert.doesNotMatch(source, /sourcePlayerName/)
  assert.match(source, /const promptRef = ref\(null\)/)
  assert.match(source, /const CLEANER_PROMPT_HOLD_SECONDS = 1/)
  assert.match(source, /ref="promptRef" class="cleaner-animation__prompt"/)
  assert.match(source, /偷看[\s\S]*cleaner-animation__prompt-value">[\s\S]*targetPlayerName[\s\S]*<\/span>[\s\S]*手牌/)
  assert.match(source, /\.to\(\{\}, \{ duration: CLEANER_PROMPT_HOLD_SECONDS \}\)[\s\S]*\.to\(\s*cardElement,/)
  assert.match(source, /\.to\(\{\}, \{ duration: 2 \}\)[\s\S]*\.set\(promptRef\.value, \{ opacity: 0 \}\)/)
  assert.match(source, /function getKillTargets\(\) \{[\s\S]*promptRef\.value/)
  assert.match(source, /\.cleaner-animation__prompt \{[\s\S]*top: 25%[\s\S]*width: min\(92vw, 900px\)[\s\S]*font-size: clamp\(14\.4px, 2\.7vw, 32\.4px\)/)
  assert.match(source, /\.cleaner-animation__prompt-value \{[\s\S]*color: #facc15/)
  assert.match(stage, /const activeCleanerTargetPlayerName = computed/)
  assert.match(stage, /activeEffectResult\.value\.targetPlayerId/)
  assert.match(stage, /:target-player-name="activeCleanerTargetPlayerName"/)
  assert.match(demo, /:target-player-name="getPlayerName\(cleanerResult\.targetPlayerId\)"/)
})

test('pm and hr prompts show only the yellow target player before their effects', async () => {
  const pm = await readSource('src/components/game/animations/PMAnimation.vue')
  const swap = await readSource('src/components/game/animations/CardSwapAnimation.vue')
  const stage = await readSource('src/components/game/ui/GameStage.vue')
  const demo = await readSource('src/views/CardPlayTestView.vue')

  assert.match(pm, /指定[\s\S]*targetPlayerName[\s\S]*棄牌重抽/)
  assert.match(pm, /duration: PM_PROMPT_HOLD_SECONDS/)
  assert.match(pm, /pm-animation__prompt-value \{ color: #facc15; \}/)
  assert.match(swap, /與[\s\S]*targetPlayerName[\s\S]*交換手牌/)
  assert.match(swap, /duration: SWAP_PROMPT_HOLD_SECONDS/)
  assert.match(swap, /card-swap-animation__prompt-value \{ color: #facc15; \}/)
  assert.doesNotMatch(pm, /sourcePlayerName/)
  assert.doesNotMatch(swap, /sourcePlayerName/)
  assert.match(stage, /:target-player-name="activePmTargetPlayerName"/)
  assert.match(stage, /:target-player-name="activeSwapTargetPlayerName"/)
  assert.match(demo, /:target-player-name="getPlayerName\(pmResult\.targetPlayerId\)"/)
  assert.match(demo, /:target-player-name="getPlayerName\(swapResult\.targetPlayerId\)"/)
})

test('hr swap reveals only the card owned by the viewer at each end of the exchange', async () => {
  const source = await readSource('src/components/game/animations/CardSwapAnimation.vue')
  const socketActions = await readSource('src/composables/useGameSocketActions.js')
  const demo = await readSource('src/views/CardPlayTestView.vue')

  assert.match(source, /sourceCardReveal === 'before-swap'/)
  assert.match(source, /targetCardReveal === 'before-swap'/)
  assert.match(source, /sourceCardReveal === 'after-swap'/)
  assert.match(source, /targetCardReveal === 'after-swap'/)
  assert.match(source, /getFlipVars\(sourceFinalRotation, timing\.flip\)/)
  assert.match(source, /getFlipVars\(targetFinalRotation, timing\.flip\)/)
  assert.doesNotMatch(source, /gsap\.set\(sourceFlipperElement, \{ rotationY: 0/)
  assert.match(socketActions, /const SWAP_REVEAL_STAGES = new Set/)
  assert.match(socketActions, /sourceCardReveal/)
  assert.match(socketActions, /targetCardReveal/)
  assert.match(demo, /sourceCardReveal: bystander \? 'never' : 'before-swap'/)
  assert.match(demo, /targetCardReveal: bystander \? 'never' : 'after-swap'/)
})

test('HR swap emits one motion-start event after the prompt hold in both motion modes', async () => {
  const source = await readSource('src/components/game/animations/CardSwapAnimation.vue')

  assert.match(source, /defineEmits\(\['complete', 'swap-motion-start'\]\)/)
  assert.match(
    source,
    /if \(reduced\) \{[\s\S]*?\.to\(\{\}, \{ duration: SWAP_PROMPT_HOLD_SECONDS \}\)\s*\.call\(\(\) => emit\('swap-motion-start'\)\)\s*\.set\(\[sourceFlipperElement, targetFlipperElement\]/,
  )
  assert.match(
    source,
    /return\s*\}\s*timeline\.value\s*\.to\(\{\}, \{ duration: SWAP_PROMPT_HOLD_SECONDS \}\)\s*\.call\(\(\) => emit\('swap-motion-start'\)\)\s*\.to\(sourceFlipperElement/,
  )
  assert.equal(
    (source.match(/emit\('swap-motion-start'\)/g) ?? []).length,
    2,
  )
})

test('cleaner keeps the current player card face up while moving it out and back', async () => {
  const source = await readSource('src/components/game/animations/CleanerAnimation.vue')
  const stage = await readSource('src/components/game/ui/GameStage.vue')
  const hand = await readSource('src/components/game/ui/PlayerHand.vue')
  const visibility = await readSource('src/composables/useGameStageCardVisibility.js')

  assert.match(source, /isSelfPlayer:/)
  assert.match(
    source,
    /keepsFaceUp =[\s\S]*props\.isSelfPlayer\?\.\(result\.targetPlayerId\) === true/,
  )
  assert.match(source, /rotationY: keepsFaceUp \? 0 : 180/)
  assert.doesNotMatch(source, /if \(keepsFaceUp\)/)
  const cardSetSource = source.slice(
    source.indexOf('gsap.set(cardElement'),
    source.indexOf('gsap.set(flipperElement'),
  )
  assert.doesNotMatch(cardSetSource, /opacity:/)
  assert.doesNotMatch(
    source,
    /\.to\(cardElement,\s*\{[^}]*opacity:/,
  )
  assert.match(stage, /useGameStageCardVisibility/)
  assert.match(visibility, /const activeCleanerAnimationResult = computed/)
  assert.match(visibility, /const targetCard = unref\(handCards\)\?\.\[0\] \?\? null/)
  assert.match(stage, /:result="activeCleanerAnimationResult"/)
  assert.match(stage, /:temporarily-hidden-card-ids="temporarilyHiddenCardIds"/)
  assert.match(stage, /:is-self-player="animationRects\.isSelfPlayer"/)
  assert.match(hand, /temporarilyHiddenCardIds/)
  assert.match(hand, /game-card-arrangement--temporarily-hidden/)
  assert.match(hand, /visibility: hidden/)
})

test('cleaner hides the original opponent card back without revealing it to bystanders', async () => {
  const source = await readSource('src/components/game/animations/CleanerAnimation.vue')
  const stage = await readSource('src/components/game/ui/GameStage.vue')
  const seats = await readSource('src/components/game/ui/PlayerSeats.vue')
  const visibility = await readSource('src/composables/useGameStageCardVisibility.js')

  assert.match(visibility, /const temporarilyHiddenSeatHandPlayerIds = computed/)
  assert.match(visibility, /cleanerResult\?\.targetPlayerId/)
  assert.match(visibility, /return \[String\(targetPlayerId\)\]/)
  assert.match(stage, /:temporarily-hidden-hand-card-player-ids="temporarilyHiddenSeatHandPlayerIds"/)
  assert.match(seats, /temporarilyHiddenHandCardPlayerIds/)
  assert.match(seats, /index === 0/)
  assert.match(seats, /player-seat-hand-target__card--temporarily-hidden/)
  assert.match(source, /rotationY: keepsFaceUp \? 0 : 180/)
  assert.match(source, /Boolean\(result\.targetCard\)/)
})

test('intern hides the original target card only after a correct guess', async () => {
  const stage = await readSource('src/components/game/ui/GameStage.vue')
  const visibility = await readSource('src/composables/useGameStageCardVisibility.js')

  assert.match(
    visibility,
    /result\?\.type === "intern"[\s\S]*result\.outcome === "correct"/,
  )
  assert.match(
    visibility,
    /shouldHideInternCard[\s\S]*isSelfPlayer\?\.\(result\.targetPlayerId\) === true/,
  )
  assert.match(
    visibility,
    /result\?\.type === "intern" && result\.outcome === "correct"[\s\S]*result\.targetPlayerId/,
  )
  assert.match(stage, /temporarilyHiddenCardIds/)
  assert.match(stage, /temporarilyHiddenSeatHandPlayerIds/)
})

test('effect card visibility resolves cleaner, intern, pm, and hr views without duplicate cards', () => {
  const activeEffectResult = ref(null)
  const handCards = ref([{ id: '7', name: 'Manager' }])
  const {
    activeCleanerAnimationResult,
    temporarilyHiddenCardIds,
    temporarilyHiddenSeatHandPlayerIds,
  } = useGameStageCardVisibility({
    activeEffectResult,
    handCards,
    isSelfPlayer: (playerId) => playerId === 'self',
  })

  activeEffectResult.value = {
    type: 'cleaner',
    targetPlayerId: 'self',
    targetCard: null,
    revealCard: false,
  }
  assert.equal(activeCleanerAnimationResult.value.targetCard, handCards.value[0])
  assert.deepEqual(temporarilyHiddenCardIds.value, ['7'])
  assert.deepEqual(temporarilyHiddenSeatHandPlayerIds.value, [])

  activeEffectResult.value = {
    type: 'cleaner',
    targetPlayerId: 'other',
    targetCard: null,
    revealCard: false,
  }
  assert.deepEqual(temporarilyHiddenCardIds.value, [])
  assert.deepEqual(temporarilyHiddenSeatHandPlayerIds.value, ['other'])

  activeEffectResult.value = {
    type: 'intern',
    targetPlayerId: 'self',
    targetCard: { id: '7', name: 'Manager' },
    outcome: 'correct',
  }
  assert.deepEqual(temporarilyHiddenCardIds.value, ['7'])
  assert.deepEqual(temporarilyHiddenSeatHandPlayerIds.value, [])

  activeEffectResult.value = {
    type: 'intern',
    targetPlayerId: 'other',
    targetCard: { id: '7', name: 'Manager' },
    outcome: 'correct',
  }
  assert.deepEqual(temporarilyHiddenCardIds.value, [])
  assert.deepEqual(temporarilyHiddenSeatHandPlayerIds.value, ['other'])

  activeEffectResult.value = {
    type: 'intern',
    targetPlayerId: 'self',
    targetCard: { id: '7', name: 'Manager' },
    outcome: 'incorrect',
  }
  assert.deepEqual(temporarilyHiddenCardIds.value, [])
  assert.deepEqual(temporarilyHiddenSeatHandPlayerIds.value, [])

  activeEffectResult.value = {
    type: 'pm',
    targetPlayerId: 'self',
    discardedCard: { id: '7', name: 'Manager' },
    newCardDrawn: true,
  }
  assert.deepEqual(temporarilyHiddenCardIds.value, ['7'])
  assert.deepEqual(temporarilyHiddenSeatHandPlayerIds.value, [])

  activeEffectResult.value = {
    type: 'pm',
    targetPlayerId: 'other',
    discardedCard: { id: '7', name: 'Manager' },
    newCardDrawn: true,
  }
  assert.deepEqual(temporarilyHiddenCardIds.value, [])
  assert.deepEqual(temporarilyHiddenSeatHandPlayerIds.value, ['other'])

  activeEffectResult.value = {
    type: 'swap',
    sourcePlayerId: 'self',
    targetPlayerId: 'other',
    sourceCard: { id: '7', name: 'Manager' },
    targetCard: { id: '8', name: 'CEO' },
  }
  assert.deepEqual(temporarilyHiddenCardIds.value, ['7'])
  assert.deepEqual(temporarilyHiddenSeatHandPlayerIds.value, ['other'])

  activeEffectResult.value = {
    type: 'swap',
    sourcePlayerId: 'left',
    targetPlayerId: 'right',
    sourceCard: null,
    targetCard: null,
  }
  assert.deepEqual(temporarilyHiddenCardIds.value, [])
  assert.deepEqual(temporarilyHiddenSeatHandPlayerIds.value, ['left', 'right'])
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

test('manager animation shows only the target player in its comparison prompt', async () => {
  const source = await readSource('src/components/game/animations/ManagerAnimation.vue')
  const stage = await readSource('src/components/game/ui/GameStage.vue')
  const demo = await readSource('src/views/CardPlayTestView.vue')

  assert.match(source, /targetPlayerName: \{ type: String, default: '玩家' \}/)
  assert.match(source, /與[\s\S]*targetPlayerName[\s\S]*比大小/)
  assert.doesNotMatch(source, /sourcePlayerName/)
  assert.match(source, /duration: MANAGER_PROMPT_HOLD_SECONDS/)
  assert.match(source, /promptRef/)
  assert.match(source, /manager-animation__prompt-value \{ color: #facc15; \}/)
  assert.match(stage, /:target-player-name="activeManagerTargetPlayerName"/)
  assert.match(demo, /:target-player-name="getPlayerName\(managerResult\.targetPlayerId\)"/)
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
  const socketSource = await readSource('src/composables/useGameSocketActions.js')
  assert.match(source, /import CardDrawAnimation/)
  assert.match(source, /getDeckRect/)
  assert.match(source, /drawRef\.value\?\.selfDraw/)
  assert.match(source, /drawRef\.value\?\.othersDraw/)
  assert.match(source, /result\.discardedCard/)
  assert.match(source, /result\.newCard/)
  assert.match(source, /shouldDrawNewCard = result\.newCardDrawn === true \|\| Boolean\(result\.newCard\)/)
  assert.match(
    source,
    /getDiscardVars\(discardTranslation, discardRect, height/,
  )
  assert.match(
    source,
    /showDiscardCard\.value = false[\s\S]*await nextTick\(\)[\s\S]*duration: 0\.5[\s\S]*if \(shouldDrawNewCard\)[\s\S]*drawRef\.value\?\.selfDraw/,
  )
  assert.match(source, /v-if="showDiscardCard"/)
  assert.match(source, /ref="cardLayerRef"/)
  assert.match(source, /<CardDrawAnimation ref="drawRef" :card="drawCard"/)
  assert.doesNotMatch(source, /pm-animation__(glow|ring|slash|shockwave)/)
  assert.match(drawSource, /function stop\(\)/)
  assert.match(drawSource, /stop,/)
  assert.match(socketSource, /const newCardDrawn = result\.newCardDrawn === true \|\| Boolean\(newCard\)/)
  assert.match(socketSource, /newCardDrawn,[\s\S]*newCard,/)
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
