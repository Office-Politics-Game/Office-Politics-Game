import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('card guess selector renders rank choices and excludes intern guesses', async () => {
  const componentUrl = new URL(
    '../src/components/game/ui/CardGuessSelector.vue',
    import.meta.url,
  )

  await access(componentUrl)
  const source = await readFile(componentUrl, 'utf8')

  assert.match(source, /guessOptions:/)
  assert.match(source, /excludedRanks:/)
  assert.match(source, /availableGuessOptions/)
  assert.match(source, /!excludedRankSet\.value\.has\(option\.rank\)/)
  assert.match(source, /emit\('select', option\.rank\)/)
  assert.match(source, /card-guess-selector__option--selected/)
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
  assert.match(confirmPanelSource, /<CardGuessSelector/)
  assert.match(source, /@target-select="selectTargetPlayer"/)
  assert.match(confirmPanelSource, /:disabled="!canConfirmPendingPlay"/)
  assert.match(confirmPanelSource, /\.play-confirm-panel \{[\s\S]*left: 50%[\s\S]*top: 50%[\s\S]*transform: translate\(-50%, -50%\)/)
  assert.match(confirmPanelSource, /\.play-confirm-panel \{[\s\S]*max-height: min\(420px, calc\(100dvh - 224px\)\)[\s\S]*overflow: auto/)
})

test('game stage prunes hidden played cards through extracted card-play state', async () => {
  const source = await readSource('src/components/game/ui/GameStage.vue')
  const cardPlaySource = await readSource('src/composables/useGameStageCardPlay.js')

  assert.match(cardPlaySource, /function pruneHiddenPlayedCards\(cardIds\)/)
  assert.match(source, /pruneHiddenPlayedCards\(cardIds\)/)
  assert.doesNotMatch(source, /locallyHiddenPlayedCardIds/)
  assert.doesNotMatch(source, /clearHiddenPlayedCard/)
})
