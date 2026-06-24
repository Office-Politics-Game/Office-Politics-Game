<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import gameTableBackgroundUrl from '@/assets/images/bg-game-table.webp'
import gameLogoUrl from '@/assets/images/logo-en-white.png'
import { useAudioSettings } from '@/composables/UseAudioSettings'
import CardDrawAnimation from './CardDrawAnimation.vue'
import CardGuessSelector from './CardGuessSelector.vue'
import CardPlayAnimation from './CardPlayAnimation.vue'
import GameCard from './GameCard.vue'
import GameSettingsIcon from './GameSettingsIcon.vue'
import GameSettingsModal from './GameSettingsModal.vue'
import PlayerHand from './PlayerHand.vue'
import PlayerSeats from './PlayerSeats.vue'
import RotateDeviceNotice from './RotateDeviceNotice.vue'
import TableCardPiles from './TableCardPiles.vue'
import TurnStatus from './TurnStatus.vue'

const props = defineProps({
  roundNumber: {
    type: [Number, String],
    required: true,
  },
  currentPhase: {
    type: String,
    required: true,
  },
  currentStep: {
    type: String,
    required: true,
  },
  deckCount: {
    type: [Number, String],
    required: true,
  },
  discardCard: {
    type: Object,
    default: null,
    validator: (card) => card === null || typeof card === 'object',
  },
  discardCards: {
    type: Array,
    default: () => [],
  },
  players: {
    type: Array,
    required: true,
  },
  playerHandCardCounts: {
    type: Object,
    default: () => ({}),
  },
  handCards: {
    type: Array,
    required: true,
    validator: (cards) =>
      cards.every(
        (card) =>
          typeof card?.id === "string" &&
          typeof card?.name === "string" &&
          typeof card?.backgroundUrl === "string" &&
          typeof card?.frameUrl === "string",
      ),
  },
  drawCard: {
    type: Object,
    default: null,
    validator: (card) =>
      card === null ||
      (typeof card?.id === "string" &&
        typeof card?.name === "string" &&
        typeof card?.backgroundUrl === "string" &&
        typeof card?.frameUrl === "string"),
  },
  drawPlayerId: {
    type: String,
    default: null,
  },
  currentPlayerId: {
    type: String,
    default: null,
  },
  currentTurnPlayerId: {
    type: [Number, String],
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'return-lobby',
  'restart-game',
  'draw-complete',
  'opponent-draw-complete',
  'play-card',
])
const isSettingsOpen = ref(false)
const isDrawAnimating = ref(false)
const activeDrawCard = ref(null)
const tableCardPilesRef = ref(null)
const playerSeats = ref(null)
const playerHand = ref(null)
const cardDrawAnimation = ref(null)
const cardPlayAnimation = ref(null)
const opponentDrawnPlayerIds = ref([])
const handCards = ref([])
const discardCards = ref([])
const activeCard = ref(null)
const originRect = ref(null)
const dragPoint = ref(null)
const playZoneRect = ref(null)
const discardRect = ref(null)
const draggingCardId = ref(null)
const isDragging = ref(false)
const isOverPlayZone = ref(false)
const pendingPlay = ref(null)
const selectedTargetPlayerId = ref(null)
const selectedGuessRank = ref(null)
let pointerMoveHandler = null
let pointerUpHandler = null
const resolvedCurrentPlayerId = computed(
  () =>
    props.currentPlayerId ??
    props.players.find((player) => player.isCurrentPlayer)?.id ??
    null,
)

const guessOptions = [
  { rank: 2, name: '打掃阿姨' },
  { rank: 3, name: '部門主管' },
  { rank: 4, name: '職場老鳥' },
  { rank: 5, name: '專案經理' },
  { rank: 6, name: '人資主管' },
  { rank: 7, name: '資深顧問' },
  { rank: 8, name: '執行長' },
]

const {
  musicEnabled,
  musicVolume,
  soundEnabled,
  soundVolume,
  setMusicEnabled,
  setMusicVolume,
  setSoundEnabled,
  setSoundVolume,
} = useAudioSettings();

const hasActivePlay = computed(() => Boolean(activeCard.value && originRect.value))
const isCurrentPlayerTurn = computed(() => {
  if (!props.currentTurnPlayerId || !resolvedCurrentPlayerId.value) {
    return true
  }

  return String(props.currentTurnPlayerId) === String(resolvedCurrentPlayerId.value)
})
const pendingTargetMode = computed(() => pendingPlay.value?.card.targetMode ?? 'none')
const pendingRequiresTarget = computed(() =>
  pendingTargetMode.value === 'opponent' ||
  pendingTargetMode.value === 'anyPlayer',
)
const pendingRequiresGuess = computed(() => Boolean(pendingPlay.value?.card.requiresGuess))
const selectableTargetPlayerIds = computed(() => {
  if (!pendingRequiresTarget.value) {
    return []
  }

  return props.players
    .filter((player) => {
      if (pendingTargetMode.value === 'opponent') {
        return !player.isCurrentPlayer
      }

      return true
    })
    .map((player) => player.id)
})
const resolvedPlayerHandCardCounts = computed(() =>
  Object.fromEntries(
    props.players.map((player) => {
      if (Number.isInteger(props.playerHandCardCounts[player.id])) {
        return [player.id, props.playerHandCardCounts[player.id]]
      }

      if (player.isCurrentPlayer) {
        return [player.id, handCards.value.length]
      }

      const drawnCount = opponentDrawnPlayerIds.value.includes(player.id) ? 1 : 0
      return [player.id, 1 + drawnCount]
    }),
  ),
)
const selectedTargetPlayer = computed(() =>
  props.players.find((player) => player.id === selectedTargetPlayerId.value) ?? null,
)
const selectedGuessOption = computed(() =>
  guessOptions.find((option) => option.rank === selectedGuessRank.value) ?? null,
)
const canConfirmPendingPlay = computed(() => {
  if (!pendingPlay.value) {
    return false
  }

  if (pendingRequiresTarget.value && !selectedTargetPlayerId.value) {
    return false
  }

  if (pendingRequiresGuess.value && !selectedGuessRank.value) {
    return false
  }

  return true
})
const isPlayInteractionLocked = computed(() =>
  props.isLoading ||
  !isCurrentPlayerTurn.value ||
  Boolean(activeCard.value) ||
  Boolean(pendingPlay.value) ||
  isDrawAnimating.value,
)
const dragPreviewStyle = computed(() => {
  if (!hasActivePlay.value || !originRect.value || !dragPoint.value || !isDragging.value) {
    return { display: 'none' }
  }

  const translateX = dragPoint.value.x - (originRect.value.left + originRect.value.width / 2)
  const translateY = dragPoint.value.y - (originRect.value.top + originRect.value.height / 2)

  return {
    ...rectToFixedStyle(originRect.value),
    transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${isOverPlayZone.value ? 1.06 : 1})`,
  }
})

function openSettings() {
  isSettingsOpen.value = true;
}

function closeSettings() {
  isSettingsOpen.value = false;
}

function handleReturnLobby() {
  emit("return-lobby");
}

function handleRestartGame() {
  emit("restart-game");
}

function isSelfDraw(playerId) {
  return !playerId || playerId === resolvedCurrentPlayerId.value
}

function markOpponentDrawn(playerId) {
  if (opponentDrawnPlayerIds.value.includes(playerId)) {
    return
  }

  opponentDrawnPlayerIds.value = [
    ...opponentDrawnPlayerIds.value,
    playerId,
  ]
}

async function playDrawAnimation() {
  if (isPlayInteractionLocked.value || !props.drawCard) {
    return;
  }

  const activeDrawPlayerId =
    props.drawPlayerId ?? resolvedCurrentPlayerId.value
  const shouldDrawSelf = isSelfDraw(activeDrawPlayerId)

  isDrawAnimating.value = true
  activeDrawCard.value = { ...props.drawCard }

  if (shouldDrawSelf) {
    playerHand.value?.prepareDrawTarget()
  }

  await nextTick()

  const startRect = tableCardPilesRef.value?.getDeckRect()
  const targetRect = shouldDrawSelf
    ? playerHand.value?.getDrawTargetRect()
    : playerSeats.value?.getHandTargetRect(activeDrawPlayerId)

  if (!startRect || !targetRect) {
    playerHand.value?.finishDraw();
    activeDrawCard.value = null;
    isDrawAnimating.value = false;
    return;
  }

  try {
    const onLanded = () => {
      if (shouldDrawSelf) {
        emit('draw-complete', activeDrawCard.value)
        return
      }

      markOpponentDrawn(activeDrawPlayerId)
      emit('opponent-draw-complete', {
        playerId: activeDrawPlayerId,
        card: activeDrawCard.value,
      })
    }

    if (shouldDrawSelf) {
      await cardDrawAnimation.value?.selfDraw({
        startRect,
        targetRect,
        onLanded,
      })
    } else {
      await cardDrawAnimation.value?.othersDraw({
        startRect,
        targetRect,
        onLanded,
      })
    }
    await nextTick()
  } finally {
    playerHand.value?.finishDraw();
    activeDrawCard.value = null;
    isDrawAnimating.value = false;
  }
}

function refreshDiscardRect() {
  discardRect.value = tableCardPilesRef.value?.getDiscardRect?.() ?? null
}

function refreshPlayZoneRect() {
  playZoneRect.value = tableCardPilesRef.value?.getPlayZoneRect?.() ?? null
}

function pointInsideRect(point, rect) {
  if (!point || !rect) {
    return false
  }

  return (
    point.x >= rect.left &&
    point.x <= rect.left + rect.width &&
    point.y >= rect.top &&
    point.y <= rect.top + rect.height
  )
}

function rectToFixedStyle(rect) {
  return {
    display: 'block',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  }
}

function clearPointerListeners() {
  if (pointerMoveHandler) {
    window.removeEventListener('pointermove', pointerMoveHandler)
    pointerMoveHandler = null
  }

  if (pointerUpHandler) {
    window.removeEventListener('pointerup', pointerUpHandler)
    window.removeEventListener('pointercancel', pointerUpHandler)
    pointerUpHandler = null
  }
}

function resetInteraction() {
  clearPointerListeners()
  activeCard.value = null
  originRect.value = null
  dragPoint.value = null
  playZoneRect.value = null
  discardRect.value = null
  draggingCardId.value = null
  isDragging.value = false
  isOverPlayZone.value = false
}

function resetPendingChoices() {
  selectedTargetPlayerId.value = null
  selectedGuessRank.value = null
}

function preparePendingPlay(card) {
  pendingPlay.value = { card }
  resetPendingChoices()
}

function selectTargetPlayer(playerId) {
  if (!selectableTargetPlayerIds.value.includes(playerId)) {
    return
  }

  selectedTargetPlayerId.value = playerId
}

function selectGuessRank(rank) {
  if (!pendingRequiresGuess.value) {
    return
  }

  selectedGuessRank.value = rank
}

function confirmPendingPlay() {
  if (!canConfirmPendingPlay.value) {
    return
  }

  const playedCard = pendingPlay.value.card

  discardCards.value = [...discardCards.value, playedCard]
  handCards.value = handCards.value.filter((card) => card.id !== playedCard.id)

  emit('play-card', {
    card: playedCard,
    cardId: playedCard.id,
    cardRank: playedCard.rank,
    effectKey: playedCard.effectKey,
    targetPlayerId: selectedTargetPlayerId.value,
    guessedRank: selectedGuessRank.value,
  })

  pendingPlay.value = null
  resetPendingChoices()
}

function cancelPendingPlay() {
  pendingPlay.value = null
  resetPendingChoices()
}

function getDragReleaseRect() {
  if (!originRect.value || !dragPoint.value) {
    return null
  }

  return {
    left: dragPoint.value.x - originRect.value.width / 2,
    top: dragPoint.value.y - originRect.value.height / 2,
    width: originRect.value.width,
    height: originRect.value.height,
  }
}

async function playActiveCard() {
  const card = activeCard.value
  const releaseRect = getDragReleaseRect()
  refreshDiscardRect()

  if (!card || !releaseRect || !discardRect.value) {
    resetInteraction()
    return
  }

  const targetRect = discardRect.value

  try {
    const didPlay = await cardPlayAnimation.value?.play({
      card,
      originRect: releaseRect,
      targetRect,
      position: 'bottom',
      faceUp: true,
    })

    if (didPlay) {
      preparePendingPlay(card)
    }
  } finally {
    resetInteraction()
  }
}

function handleWindowPointerMove(event) {
  if (!hasActivePlay.value) {
    return
  }

  dragPoint.value = {
    x: event.clientX,
    y: event.clientY,
  }

  refreshPlayZoneRect()
  isOverPlayZone.value = pointInsideRect(dragPoint.value, playZoneRect.value)
}

function handleWindowPointerUp(event) {
  if (!hasActivePlay.value) {
    resetInteraction()
    return
  }

  dragPoint.value = {
    x: event.clientX,
    y: event.clientY,
  }

  refreshPlayZoneRect()
  isOverPlayZone.value = pointInsideRect(dragPoint.value, playZoneRect.value)
  isDragging.value = false
  clearPointerListeners()

  if (isOverPlayZone.value) {
    playActiveCard()
    return
  }

  resetInteraction()
}

function handleCardPointerDown(card, event) {
  if (isPlayInteractionLocked.value) {
    return
  }

  const cardElement = event.currentTarget
  if (!cardElement?.getBoundingClientRect) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  activeCard.value = card
  draggingCardId.value = card.id
  originRect.value = cardElement.getBoundingClientRect()
  dragPoint.value = {
    x: event.clientX,
    y: event.clientY,
  }
  refreshDiscardRect()
  refreshPlayZoneRect()
  isDragging.value = true
  isOverPlayZone.value = pointInsideRect(dragPoint.value, playZoneRect.value)

  pointerMoveHandler = handleWindowPointerMove
  pointerUpHandler = handleWindowPointerUp
  window.addEventListener('pointermove', pointerMoveHandler, { passive: true })
  window.addEventListener('pointerup', pointerUpHandler)
  window.addEventListener('pointercancel', pointerUpHandler)

  if (typeof cardElement.setPointerCapture === 'function') {
    try {
      cardElement.setPointerCapture(event.pointerId)
    } catch {
      // Pointer capture is a best-effort improvement only.
    }
  }
}

watch(
  () => props.handCards,
  (cards) => {
    if (!activeCard.value && !pendingPlay.value) {
      handCards.value = [...cards]
    }
  },
  { immediate: true, deep: true },
)

watch(
  () => props.discardCard,
  (card) => {
    if (!activeCard.value && !pendingPlay.value && props.discardCards.length === 0) {
      discardCards.value = card ? [card] : []
    }
  },
  { immediate: true, deep: true },
)

watch(
  () => props.discardCards,
  (cards) => {
    if (!activeCard.value && !pendingPlay.value) {
      discardCards.value = cards.length > 0
        ? [...cards]
        : props.discardCard
          ? [props.discardCard]
          : []
    }
  },
  { immediate: true, deep: true },
)

onBeforeUnmount(() => {
  clearPointerListeners()
  cardPlayAnimation.value?.stop?.()
})

defineExpose({
  playDrawAnimation,
});
</script>

<template>
  <main
    class="relative min-h-[100dvh] w-full overflow-hidden bg-[var(--brand-navy)]"
  >
    <section
      class="game-stage relative hidden h-[100dvh] w-[100dvw] overflow-hidden bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${gameTableBackgroundUrl})` }"
      aria-label="Office Politics 遊戲舞台"
    >
      <div
        v-if="pendingPlay"
        class="play-target-backdrop"
        aria-hidden="true"
      ></div>

      <PlayerSeats
        ref="playerSeats"
        :players="players"
        :player-hand-card-counts="resolvedPlayerHandCardCounts"
        :is-target-selection-active="Boolean(pendingPlay) && pendingRequiresTarget"
        :selectable-player-ids="selectableTargetPlayerIds"
        :selected-target-player-id="selectedTargetPlayerId"
        @target-select="selectTargetPlayer"
      />

      <div class="turn-controls absolute top-5 left-3 lg:top-8 lg:left-6">
        <TurnStatus
          :round-number="roundNumber"
          :current-phase="currentPhase"
          :current-step="currentStep"
        />
      </div>

      <div
        class="game-brand-tools absolute top-2 right-3 flex items-center gap-2 lg:top-4 lg:right-4 lg:gap-6"
      >
        <img
          :src="gameLogoUrl"
          alt="Office Politics"
          class="block h-auto w-24 select-none object-contain drop-shadow-[0_3px_10px_rgba(0,19,50,0.48)] lg:w-40"
          draggable="false"
        />
        <GameSettingsIcon @open="openSettings" />
      </div>

      <div
        class="table-card-piles absolute top-[42%] left-1/2 -translate-x-1/2"
      >
        <TableCardPiles
          ref="tableCardPilesRef"
          :deck-count="deckCount"
          :discard-cards="discardCards"
          :is-draw-disabled="isPlayInteractionLocked || !drawCard"
          :is-drop-target-active="isOverPlayZone && hasActivePlay"
          @draw="playDrawAnimation"
        />
      </div>

      <div class="absolute bottom-[-34px] left-1/2 z-20 -translate-x-1/2">
        <PlayerHand
          ref="playerHand"
          :cards="handCards"
          :dragging-card-id="draggingCardId"
          @card-pointerdown="handleCardPointerDown"
        />
      </div>

      <section
        v-if="pendingPlay"
        class="play-confirm-panel"
        aria-label="出牌確認"
      >
        <div class="play-confirm-panel__summary">
          <span>準備出牌</span>
          <strong>{{ pendingPlay.card.name }}</strong>
          <small>
            {{
              pendingRequiresTarget
                ? selectedTargetPlayer
                  ? `目標：${selectedTargetPlayer.name}`
                  : '請點選玩家頭像'
                : '此牌不需要指定目標'
            }}
          </small>
        </div>

        <CardGuessSelector
          v-if="pendingRequiresGuess"
          :guess-options="guessOptions"
          :selected-rank="selectedGuessRank"
          :excluded-ranks="[1]"
          @select="selectGuessRank"
        />

        <p v-if="pendingRequiresGuess" class="play-confirm-panel__hint">
          {{ selectedGuessOption ? `猜測：${selectedGuessOption.name}` : '實習生不能猜實習生，請選擇 2-8 的牌。' }}
        </p>

        <div class="play-confirm-panel__actions">
          <button type="button" @click="cancelPendingPlay">取消</button>
          <button
            type="button"
            class="play-confirm-panel__confirm"
            :disabled="!canConfirmPendingPlay"
            @click="confirmPendingPlay"
          >
            確認出牌
          </button>
        </div>
      </section>

      <CardDrawAnimation
        ref="cardDrawAnimation"
        :card="activeDrawCard"
      />

      <div
        v-if="hasActivePlay && isDragging"
        class="card-play-drag-preview fixed pointer-events-none"
        :class="{ 'card-play-drag-preview--over': isOverPlayZone }"
        :style="dragPreviewStyle"
        aria-hidden="true"
      >
        <div class="card-play-drag-preview__glow" :style="{ '--accent': activeCard.color }"></div>
        <GameCard
          :name="activeCard.name"
          :background-url="activeCard.backgroundUrl"
          :frame-url="activeCard.frameUrl"
        />
      </div>

      <CardPlayAnimation ref="cardPlayAnimation" />
    </section>

    <GameSettingsModal
      :is-open="isSettingsOpen"
      :music-enabled="musicEnabled"
      :music-volume="musicVolume"
      :sound-enabled="soundEnabled"
      :sound-volume="soundVolume"
      @close="closeSettings"
      @update:music-enabled="setMusicEnabled"
      @update:music-volume="setMusicVolume"
      @update:sound-enabled="setSoundEnabled"
      @update:sound-volume="setSoundVolume"
      @return-lobby="handleReturnLobby"
      @restart-game="handleRestartGame"
    />

    <RotateDeviceNotice />
  </main>
</template>

<style scoped>
.card-play-drag-preview {
  z-index: 49;
  cursor: grabbing;
  filter: drop-shadow(0 18px 24px rgba(0, 0, 0, 0.42));
  transform-origin: 50% 50%;
  will-change: transform;
}

.card-play-drag-preview__glow {
  position: absolute;
  inset: -14%;
  border-radius: 18px;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.34), transparent 36%),
    radial-gradient(circle at 50% 50%, var(--accent), transparent 68%);
  filter: blur(13px);
  opacity: 0;
  transform: scale(0.82);
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}

.card-play-drag-preview--over .card-play-drag-preview__glow {
  opacity: 0.82;
  transform: scale(1);
}

.play-target-backdrop {
  position: absolute;
  inset: 0;
  z-index: 44;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.42);
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
}

.play-confirm-panel {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 78;
  display: grid;
  gap: 12px;
  width: min(340px, calc(100vw - 32px));
  max-height: min(420px, calc(100dvh - 224px));
  overflow: auto;
  border: 1px solid rgba(250, 204, 21, 0.58);
  border-radius: var(--radius-md, 0);
  padding: 16px;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(7, 17, 29, 0.9)),
    rgba(7, 17, 29, 0.82);
  box-shadow:
    0 0 24px rgba(250, 204, 21, 0.16),
    0 22px 48px rgba(0, 0, 0, 0.46);
  color: #f8fafc;
  backdrop-filter: blur(10px);
}

.play-confirm-panel__summary {
  display: grid;
  gap: 4px;
}

.play-confirm-panel__summary span {
  color: #facc15;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.play-confirm-panel__summary strong {
  font-size: 24px;
  line-height: 1.05;
}

.play-confirm-panel__summary small,
.play-confirm-panel__hint {
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.35;
}

.play-confirm-panel__hint {
  margin: 0;
}

.play-confirm-panel__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.play-confirm-panel__actions button {
  min-height: 38px;
  border: 1px solid rgba(148, 163, 184, 0.48);
  border-radius: var(--radius-md, 0);
  padding: 0 12px;
  cursor: pointer;
  background: rgba(15, 23, 42, 0.72);
  color: #f8fafc;
  font-size: 13px;
  font-weight: 900;
}

.play-confirm-panel__confirm {
  border-color: rgba(250, 204, 21, 0.72) !important;
  background: rgba(250, 204, 21, 0.18) !important;
}

.play-confirm-panel__actions button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (orientation: landscape), (min-width: 768px) {
  .game-stage {
    display: block;
  }
}
</style>
