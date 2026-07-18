import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'
import { reactive, readonly } from 'vue'
import { filterVisibleHandCards } from '../src/composables/useGameStageCardPlay.js'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('card guess selector renders disabled intern and selectable rank choices', async () => {
  const componentUrl = new URL(
    '../src/components/game/ui/CardGuessSelector.vue',
    import.meta.url,
  )

  await access(componentUrl)
  const source = await readFile(componentUrl, 'utf8')

  assert.match(source, /guessOptions:/)
  assert.match(source, /excludedRanks:/)
  assert.match(source, /v-for="option in guessOptions"/)
  assert.match(source, /:disabled="excludedRankSet\.has\(option\.rank\)"/)
  assert.match(source, /emit\('select', option\.rank\)/)
  assert.match(source, /card-guess-selector__option--selected/)
  assert.match(source, /\.card-guess-selector__option:disabled/)
  assert.doesNotMatch(source, /rounded-/)
})

test('player seats support avatar target selection without changing seat layout', async () => {
  const source = await readSource('src/components/game/ui/PlayerSeats.vue')

  assert.match(source, /isTargetSelectionActive:/)
  assert.match(source, /selectablePlayerIds:/)
  assert.match(source, /selectedTargetPlayerId:/)
  assert.match(source, /defineEmits\(\[["']target-select["']\]\);?/)
  assert.match(source, /selectablePlayerIdSet/)
  assert.match(source, /player-seats--target-selection-active/)
  assert.match(source, /player-seats__seat--target-selectable/)
  assert.match(source, /player-seats__seat--target-selected/)
  assert.match(source, /player-seats__target-button/)
  assert.match(source, /player-seats__target-button--selectable/)
  assert.match(source, /player-seats__target-button--selected/)
  assert.match(source, /player-seats__seat--target-selected :deep\(\.player-avatar__frame img\)/)
  assert.match(source, /hue-rotate\(/)
  assert.match(source, /saturate\(/)
  assert.match(source, /@keyframes target-choice-pulse/)
  assert.doesNotMatch(source, /<img\s+[^>]*:src="player\.avatarUrl"/)
  assert.match(source, /emit\(["']target-select["'], player\.id\);?/)
})

test('game stage coordinates pending play target and guess confirmation', async () => {
  const source = await readSource('src/components/game/ui/GameStage.vue')
  const cardPlaySource = await readSource('src/composables/useGameStageCardPlay.js')
  const confirmPanelSource = await readSource('src/components/game/ui/CardPlayConfirmPanel.vue')

  assert.match(confirmPanelSource, /import CardGuessSelector from ["']\.\/CardGuessSelector\.vue["']/)
  assert.match(cardPlaySource, /const pendingPlay = ref\(null\)/)
  assert.match(cardPlaySource, /const selectedTargetPlayerId = ref\(null\)/)
  assert.match(cardPlaySource, /const selectedGuessRank = ref\(null\)/)
  assert.match(cardPlaySource, /selectableTargetPlayerIds/)
  assert.match(cardPlaySource, /function confirmPendingPlay\(\)/)
  assert.match(cardPlaySource, /function cancelPendingPlay\(\)/)
  assert.match(cardPlaySource, /emit\(["']play-card["']/)
  assert.match(source, /v-if="pendingPlay"[\s\S]*class="play-target-backdrop"/)
  assert.match(source, /\.play-target-backdrop \{[\s\S]*z-index: 44[\s\S]*background: rgba\(0, 0, 0, 0\.42\)[\s\S]*backdrop-filter: blur\(5px\)/)
  assert.match(source, /<CardPlayConfirmPanel/)
  assert.match(source, /import \{ CARD_INFO_BY_RANK \} from ["']@\/constants\/cardInfo["']/)
  assert.match(source, /Object\.entries\(CARD_INFO_BY_RANK\)/)
  assert.match(confirmPanelSource, /<CardGuessSelector/)
  assert.match(source, /@target-select="selectTargetPlayer"/)
  assert.match(confirmPanelSource, /:disabled="!canConfirmPendingPlay"/)
  assert.match(confirmPanelSource, /\.play-confirm-panel \{[\s\S]*left: 50%[\s\S]*top: 50%[\s\S]*transform: translate\(-50%, -50%\)/)
  assert.match(confirmPanelSource, /\.play-confirm-panel \{[\s\S]*min-width: 440px[\s\S]*overflow: auto/)
})

test('game stage prunes hidden played cards through extracted card-play state', async () => {
  const source = await readSource('src/components/game/ui/GameStage.vue')
  const cardPlaySource = await readSource('src/composables/useGameStageCardPlay.js')

  assert.match(cardPlaySource, /function pruneHiddenPlayedCards\(handCards\)/)
  assert.match(source, /pruneHiddenPlayedCards\(handCards\)/)
  assert.doesNotMatch(source, /locallyHiddenPlayedCardIds/)
  assert.doesNotMatch(source, /clearHiddenPlayedCard/)
})

test('playing one of two equal cards hides only the selected card instance', () => {
  const firstCard = { id: '1', name: 'Intern' }
  const secondCard = { id: '1', name: 'Intern' }
  const handCards = [firstCard, secondCard]

  assert.deepEqual(
    filterVisibleHandCards(handCards, secondCard, []),
    [firstCard],
  )
  assert.deepEqual(
    filterVisibleHandCards(handCards, null, [secondCard]),
    [firstCard],
  )
})

test('submitted card stays hidden when Vue wraps the same card with another proxy', () => {
  const playedCard = { id: '1', name: 'Intern' }
  const otherEqualCard = { id: '1', name: 'Intern' }
  const handCards = reactive([playedCard, otherEqualCard])
  const submittedCard = readonly(playedCard)

  assert.deepEqual(
    filterVisibleHandCards(handCards, null, [submittedCard]),
    [handCards[1]],
  )
})

test('submitted cards stay hidden while their effect or staged discard is active', async () => {
  const source = await readSource('src/composables/useGameStageCardPlay.js')

  assert.match(source, /const HIDDEN_PLAYED_CARD_FALLBACK_MS = 5000/)
  assert.match(source, /const HIDDEN_PLAYED_CARD_RETRY_MS = 250/)
  assert.match(source, /function scheduleHiddenPlayedCardCleanup/)
  assert.match(source, /stagedDiscardCard\.value\?\.id === card\.id/)
  assert.match(source, /Boolean\(activeEffectResult\.value\)/)
  assert.match(
    source,
    /scheduleHiddenPlayedCardCleanup\(card, HIDDEN_PLAYED_CARD_RETRY_MS\)/,
  )
  assert.match(source, /scheduleHiddenPlayedCardCleanup\(cardInstance\)/)
})

test('remote players lose one visible hand card as soon as they play it', async () => {
  const stage = await readSource('src/components/game/ui/GameStage.vue')
  const cardPlaySource = await readSource('src/composables/useGameStageCardPlay.js')

  assert.match(cardPlaySource, /const stagedRemotePlayedCard = ref\(null\)/)
  assert.match(cardPlaySource, /const visiblePlayerHandCardCounts = computed/)
  assert.match(
    cardPlaySource,
    /remainingCount: currentCount - 1/,
  )
  assert.match(
    cardPlaySource,
    /Math\.min\([\s\S]*currentCount,[\s\S]*stagedPlay\.remainingCount/,
  )
  assert.match(
    cardPlaySource,
    /stagedRemotePlayedCard\.value = null/,
  )
  assert.match(stage, /resolvedPlayerHandCardCounts,/)
  assert.match(stage, /:player-hand-card-counts="visiblePlayerHandCardCounts"/)
})

test('intern animation normalization requires and preserves the submitted guess', async () => {
  const source = await readSource('src/composables/useGameSocketActions.js')

  assert.match(source, /typeof result\.guessedCardName === ['"]string['"]/)
  assert.match(source, /result\.guessedCardName\.trim\(\)/)
  assert.match(source, /targetPlayerId && targetCard && guessedCardName/)
  assert.match(source, /\{ \.\.\.result, id, targetPlayerId, targetCard, guessedCardName \}/)
})

test('game stage resolves the intern target name with a stable fallback', async () => {
  const source = await readSource('src/components/game/ui/GameStage.vue')

  assert.match(source, /const activeInternTargetPlayerName = computed/)
  assert.match(source, /String\(player\.id\) === String\(activeEffectResult\.value\.targetPlayerId\)/)
  assert.match(source, /\?\.name \?\? ["']玩家["']/)
  assert.match(source, /:target-player-name="activeInternTargetPlayerName"/)
})

test('intern animation shows the submitted position before a persistent outcome', async () => {
  const source = await readSource('src/components/game/animations/InternAnimation.vue')
  const incorrectSource = source.slice(
    source.indexOf('async function playIncorrect'),
    source.indexOf('async function playCorrect'),
  )
  const correctSource = source.slice(
    source.indexOf('async function playCorrect'),
    source.indexOf('async function play(result)'),
  )
  const outcomeRevealSequence = /\.to\(\{\}, \{ duration: GUESS_PROMPT_HOLD_SECONDS \}\)\s*\.call\(\(\) => \{\s*emit\("outcome-reveal", result\.outcome\);\s*\}\)\s*\.set\(outcomeRef\.value/

  assert.match(source, /defineEmits\(\["complete", "outcome-reveal"\]\)/)
  assert.match(source, /targetPlayerName: \{ type: String, default: ['"]玩家['"] \}/)
  assert.match(source, /intern-animation__prompt-value">[\s\S]*?targetPlayerName[\s\S]*?<\/span>/)
  assert.match(source, /intern-animation__prompt-value">[\s\S]*?activeResult\.guessedCardName[\s\S]*?<\/span>/)
  assert.match(source, /\.intern-animation__prompt \{[\s\S]*font-size: clamp\(14\.4px, 2\.7vw, 32\.4px\)/)
  assert.match(source, /\.intern-animation__prompt-value \{[\s\S]*color: #facc15;[\s\S]*\}/)
  assert.match(source, /const GUESS_PROMPT_HOLD_SECONDS = 1/)
  assert.match(incorrectSource, outcomeRevealSequence)
  assert.match(correctSource, outcomeRevealSequence)
  assert.equal(
    (source.match(/emit\("outcome-reveal", result\.outcome\)/g) ?? []).length,
    2,
  )
  assert.match(source, /\[glowRef\.value, promptRef\.value, outcomeRef\.value\]/)
  assert.match(source, /isReducedMotion\(\)/)
  assert.match(source, /\.intern-animation__prompt \{[\s\S]*width: min\(92vw, 900px\)[\s\S]*overflow-wrap: anywhere/)
})

test('all targeted cards select a player before opening the confirmation dialog', async () => {
  const stageSource = await readSource('src/components/game/ui/GameStage.vue')
  const cardPlaySource = await readSource('src/composables/useGameStageCardPlay.js')

  assert.match(cardPlaySource, /const isPendingTargetSelectionActive = computed/)
  assert.match(cardPlaySource, /pendingRequiresTarget\.value &&\s*!selectedTargetPlayerId\.value/)
  assert.match(cardPlaySource, /const isPendingPlayPanelVisible = computed/)
  assert.match(cardPlaySource, /!pendingRequiresTarget\.value \|\|\s*Boolean\(selectedTargetPlayerId\.value\)/)
  assert.match(cardPlaySource, /if \(!selectableTargetPlayerIds\.value\.includes\(playerId\)\) \{\s*return;/)
  assert.match(stageSource, /:is-target-selection-active="isPendingTargetSelectionActive"/)
  assert.match(stageSource, /v-if="isPendingTargetSelectionActive"/)
  assert.match(stageSource, />\s*請選擇玩家\s*<\/p>/)
  assert.match(stageSource, /\.play-target-prompt \{[\s\S]*z-index: 45[\s\S]*pointer-events: none/)
  assert.match(stageSource, /<CardPlayConfirmPanel[\s\S]*v-if="isPendingPlayPanelVisible"/)
})

test('cards without a player target bypass pending target selection', async () => {
  const cardPlaySource = await readSource('src/composables/useGameStageCardPlay.js')

  assert.match(
    cardPlaySource,
    /function cardRequiresPlayChoices\(card\) \{[\s\S]*card\?\.targetMode === "opponent" \|\|[\s\S]*card\?\.targetMode === "anyPlayer" \|\|[\s\S]*Boolean\(card\?\.requiresGuess\)/,
  )
  assert.match(
    cardPlaySource,
    /if \(cardRequiresPlayChoices\(card\)\) \{\s*preparePendingPlay\(card\);\s*\} else \{\s*emitPlayCard\(card\);/,
  )
})

test('card play uses a six pixel drag threshold and inspection state', async () => {
  const cardPlaySource = await readSource('src/composables/useGameStageCardPlay.js')
  const stageSource = await readSource('src/components/game/ui/GameStage.vue')

  assert.match(cardPlaySource, /const DRAG_THRESHOLD_PX = 6/)
  assert.match(cardPlaySource, /distance <= DRAG_THRESHOLD_PX/)
  assert.match(cardPlaySource, /const inspectedCard = ref\(null\)/)
  assert.match(cardPlaySource, /releasedSource === "inspection" \? null : releasedCard/)
  assert.match(cardPlaySource, /if \(isOverPlayZone\.value\) \{\s*playActiveCard\(\)/)
  assert.match(cardPlaySource, /function canDragCard\(card\)/)
  assert.match(cardPlaySource, /!isHandPlayInteractionLocked\.value/)
  assert.match(stageSource, /import CardInspectionOverlay/)
  assert.match(stageSource, /v-if="inspectedCard && !isDragging"/)
  assert.match(stageSource, /@card-pointerdown="handleCardPointerDown"/)
})

test('inspection supports card, backdrop, and escape dismissal', async () => {
  const source = await readSource('src/components/game/ui/CardInspectionOverlay.vue')

  assert.match(source, /@pointerdown\.self="emit\('close'\)"/)
  assert.match(source, /if \(event\.key === "Escape"\) emit\("close"\)/)
  assert.match(source, /emit\("card-pointerdown", props\.card, event, "inspection"\)/)
  assert.match(source, /window\.removeEventListener\("keydown", handleKeydown\)/)
})
