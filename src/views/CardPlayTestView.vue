<script setup>
import { computed, nextTick, onUnmounted, reactive, ref } from 'vue'
import cardBackUrl from '@/assets/images/card-bg-back.webp'
import ceoBackgroundUrl from '@/assets/images/card-bg-ceo.webp'
import ceoFrameUrl from '@/assets/images/card-frame-ceo.webp'
import advisorBackgroundUrl from '@/assets/images/card-bg-advisor.webp'
import advisorFrameUrl from '@/assets/images/card-frame-advisor.webp'
import managerBackgroundUrl from '@/assets/images/card-bg-manager.webp'
import managerFrameUrl from '@/assets/images/card-frame-manager.webp'
import hrBackgroundUrl from '@/assets/images/card-bg-hr.webp'
import hrFrameUrl from '@/assets/images/card-frame-hr.webp'
import gameTableBackgroundUrl from '@/assets/images/bg-game-table.webp'
import playerOneUrl from '@/assets/images/player-1.png'
import playerTwoUrl from '@/assets/images/player-2.png'
import playerThreeUrl from '@/assets/images/player-3.png'
import playerFourUrl from '@/assets/images/player-4.png'
import CardDrawAnimation from '@/components/game/CardDrawAnimation.vue'
import CardPlayAnimation from '@/components/game/CardPlayAnimation.vue'
import CardShuffleAnimation from '@/components/game/CardShuffleAnimation.vue'
import CardSwapAnimation from '@/components/game/CardSwapAnimation.vue'
import GameCard from '@/components/game/GameCard.vue'
import PlayerSeats from '@/components/game/PlayerSeats.vue'
import TableCardPiles from '@/components/game/TableCardPiles.vue'
import { createMockGameState } from '@/mocks/mockGameState.js'

const INITIAL_DECK_COUNT = 28

const cards = [
  {
    id: 'ceo-pressure',
    name: '執行長壓力',
    type: 'Boss',
    backgroundUrl: ceoBackgroundUrl,
    frameUrl: ceoFrameUrl,
    color: '#facc15',
  },
  {
    id: 'advisor-drop',
    name: '顧問空降',
    type: 'Tactic',
    backgroundUrl: advisorBackgroundUrl,
    frameUrl: advisorFrameUrl,
    color: '#38bdf8',
  },
  {
    id: 'manager-push',
    name: '主管加碼',
    type: 'Power',
    backgroundUrl: managerBackgroundUrl,
    frameUrl: managerFrameUrl,
    color: '#fb7185',
  },
  {
    id: 'hr-talk',
    name: '人資約談',
    type: 'Control',
    backgroundUrl: hrBackgroundUrl,
    frameUrl: hrFrameUrl,
    color: '#a78bfa',
  },
]

const mockCardAssets = {
  ceo: {
    type: 'Boss',
    color: '#facc15',
    backgroundUrl: ceoBackgroundUrl,
    frameUrl: ceoFrameUrl,
  },
  advisor: {
    type: 'Tactic',
    color: '#38bdf8',
    backgroundUrl: advisorBackgroundUrl,
    frameUrl: advisorFrameUrl,
  },
}

const players = [
  {
    id: 'player-top',
    name: '董事會代表',
    avatarUrl: playerTwoUrl,
    roundWins: 3,
    position: 'top',
    isCurrentPlayer: false,
  },
  {
    id: 'player-left',
    name: '資深同事',
    avatarUrl: playerThreeUrl,
    roundWins: 0,
    position: 'left',
    isCurrentPlayer: false,
  },
  {
    id: 'player-right',
    name: '部門主管',
    avatarUrl: playerFourUrl,
    roundWins: 1,
    position: 'right',
    isCurrentPlayer: false,
  },
  {
    id: 'player-bottom',
    name: '實習新手',
    avatarUrl: playerOneUrl,
    roundWins: 2,
    position: 'bottom',
    isCurrentPlayer: true,
  },
]

const opponentActionLabels = {
  top: '上方玩家出牌',
  left: '左方玩家出牌',
  right: '右方玩家出牌',
}

const swapActionLabels = {
  top: '與上方玩家交換',
  left: '與左方玩家交換',
  right: '與右方玩家交換',
}

const initialHandCards = [
  { ...cards[3], id: 'hand-hr-talk' },
  { ...cards[0], id: 'hand-ceo-pressure' },
  { ...cards[1], id: 'hand-advisor-drop' },
  { ...cards[2], id: 'hand-manager-push' },
]

const drawDeck = [
  { ...cards[0], id: 'draw-ceo-pressure' },
  { ...cards[2], id: 'draw-manager-push' },
  { ...cards[1], id: 'draw-advisor-drop' },
  { ...cards[3], id: 'draw-hr-talk' },
]

const gameState = reactive(createMockGameState())

function resolveMockCardAssets(card) {
  if (!card) {
    return null
  }

  const background = mockCardAssets[card.backgroundUrlKey] ?? mockCardAssets.ceo
  const frame = mockCardAssets[card.frameUrlKey] ?? background

  return {
    ...card,
    type: background.type,
    color: background.color,
    backgroundUrl: background.backgroundUrl,
    frameUrl: frame.frameUrl,
  }
}

function createSwapDemoCard(card) {
  const resolvedCard = resolveMockCardAssets(card)

  return resolvedCard
    ? {
        ...resolvedCard,
        isSwapDemoCard: true,
      }
    : null
}

function createInitialPlayerHandCards() {
  const swapDemoCard = createSwapDemoCard(gameState.currentPlayer.hand[0])

  return [
    ...(swapDemoCard ? [swapDemoCard] : []),
    ...initialHandCards,
  ]
}

const sourceElements = ref({})
const playerHandCards = ref(createInitialPlayerHandCards())
const tableCardPilesRef = ref(null)
const drawTargetRef = ref(null)
const cardDrawAnimationRef = ref(null)
const cardPlayAnimationRef = ref(null)
const cardShuffleAnimationRef = ref(null)
const cardSwapAnimationRef = ref(null)

const activeSourceId = ref(null)
const activeDrawCard = ref(null)
const isPlaying = ref(false)
const isDrawAnimating = ref(false)
const isShuffleAnimating = ref(false)
const isSwapAnimating = ref(false)
const deckCount = ref(INITIAL_DECK_COUNT)
const draggingCard = ref(null)
const dragOriginRect = ref(null)
const dragPoint = ref(null)
const dragPreviewStyle = ref({ display: 'none' })
const isOverPlayZone = ref(false)
const drawIndex = ref(0)
const discardCards = ref([
  {
    ...cards[1],
    id: 'discard-start',
  },
])

const isInteractionLocked = computed(
  () =>
    isPlaying.value ||
    isDrawAnimating.value ||
    isShuffleAnimating.value ||
    isSwapAnimating.value ||
    Boolean(draggingCard.value),
)

const opponentSources = computed(() =>
  players
    .filter((player) => !player.isCurrentPlayer)
    .map((player) => {
      const opponent = gameState.opponents.find(
        (candidate) => candidate.id === player.id,
      )
      const card = resolveMockCardAssets(opponent?.hand?.[0]) ?? cards[0]

      return {
        playerId: player.id,
        position: player.position,
        label: opponentActionLabels[player.position],
        swapLabel: swapActionLabels[player.position],
        card,
        opponent,
      }
    }),
)

let pointerMoveHandler = null
let pointerUpHandler = null

function setSourceElement(sourceId, element) {
  if (element) {
    sourceElements.value[sourceId] = element
    return
  }

  delete sourceElements.value[sourceId]
}

function getSwapPlayerHandCard() {
  return gameState.currentPlayer.hand[0] ?? null
}

function syncSwapDemoHandCard() {
  const swapDemoCard = createSwapDemoCard(getSwapPlayerHandCard())
  const otherCards = playerHandCards.value.filter((card) => !card.isSwapDemoCard)

  playerHandCards.value = [
    ...(swapDemoCard ? [swapDemoCard] : []),
    ...otherCards,
  ]
}

function getOpponentById(playerId) {
  return gameState.opponents.find((opponent) => opponent.id === playerId)
}

function canSwapWith(source) {
  return Boolean(
    source?.opponent?.hand?.[0] &&
      getSwapPlayerHandCard() &&
      sourceElements.value[source.playerId],
  )
}

function swapMockHands(playerId) {
  const opponent = getOpponentById(playerId)
  const selfCard = getSwapPlayerHandCard()
  const opponentCard = opponent?.hand?.[0]

  if (!opponent || !selfCard || !opponentCard) {
    return false
  }

  gameState.currentPlayer.hand.splice(0, 1, opponentCard)
  opponent.hand.splice(0, 1, selfCard)
  syncSwapDemoHandCard()

  return true
}

// 為動畫疊加層建立一個更大的固定矩形，以便卡片可以從其原始位置放大
// 而不會顯得模糊或像素化。
function rectToFixedStyle(rect) {
  return {
    display: 'block',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  }
}

// 檢查目前指標位置是否在目標矩形內，我們用它來判斷拖曳的卡牌是否在遊戲區域上方。
// 如果在出牌區則讓矩形發亮，放開則會觸發發牌動畫
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

// 拖曳結束或中斷時，把綁在 window 上的 pointer 事件監聽移除，
// 避免後續還繼續收到移動或放開事件。
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

// 在拖曳過程中，讓那張預覽卡跟著滑鼠跑，並同時判斷有沒有拖進出牌區。
function updateDragPreview(point) {
  if (!dragOriginRect.value) {
    return
  }

  dragPoint.value = point
  const rect = dragOriginRect.value
  const translateX = point.x - (rect.left + rect.width / 2)
  const translateY = point.y - (rect.top + rect.height / 2)
  const playZoneRect = tableCardPilesRef.value?.getPlayZoneRect?.()

  isOverPlayZone.value = pointInsideRect(point, playZoneRect)
  dragPreviewStyle.value = {
    ...rectToFixedStyle(rect),
    transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${isOverPlayZone.value ? 1.06 : 1})`,
  }
}

// 把拖曳互動整個清空，回到初始狀態。拖曳結束、取消，或中斷時的收尾清理。
function resetDragState() {
  clearPointerListeners()
  draggingCard.value = null
  dragOriginRect.value = null
  dragPoint.value = null
  dragPreviewStyle.value = { display: 'none' }
  isOverPlayZone.value = false
}

// 算出卡片放開當下的位置矩形。系統需要知道：卡片最後是從畫面上的哪個位置開始接續播放出牌動畫。它是在把「放開的位置」轉成一個可供動畫使用的矩形資料。
function getDragReleaseRect() {
  if (!dragOriginRect.value || !dragPoint.value) {
    return null
  }

  return {
    left: dragPoint.value.x - dragOriginRect.value.width / 2,
    top: dragPoint.value.y - dragOriginRect.value.height / 2,
    width: dragOriginRect.value.width,
    height: dragOriginRect.value.height,
  }
}

// 決定卡片出場時的初始傾斜角度。它根據卡片來自哪個方向，回傳不同的旋轉值。這個 function 是在幫不同位置出來的卡，設定比較合理的起始旋轉角度，讓動畫看起來不那麼呆板。
// 決定下一次抽牌要抽到哪一張卡。這個 function 是用來依序抽出下一張卡，並產生一個新的唯一 id，讓抽牌動畫和畫面更新正常運作。
function getNextDrawCard() {
  const template = drawDeck[drawIndex.value % drawDeck.length]
  drawIndex.value += 1

  return {
    ...template,
    id: `${template.id}-${drawIndex.value}`,
  }
}

// 這個 function 會從牌庫抓一張牌，播放它飛進手牌的動畫，等卡片落地後再真的把它加入我方手牌。
async function playDrawAnimation() {
  if (
    isInteractionLocked.value ||
    deckCount.value <= 0
  ) {
    return
  }

  const startRect = tableCardPilesRef.value?.getDeckRect?.()
  const targetRect = drawTargetRef.value?.getBoundingClientRect?.()

  if (!startRect || !targetRect) {
    return
  }

  isDrawAnimating.value = true
  activeDrawCard.value = getNextDrawCard()
  let didLand = false
  deckCount.value = Math.max(deckCount.value - 1, 0)
  await nextTick()

  try {
    await cardDrawAnimationRef.value?.play({
      startRect,
      targetRect,
      onLanded: () => {
        didLand = true
        playerHandCards.value = [...playerHandCards.value, activeDrawCard.value]
      },
    })
  } finally {
    if (!didLand) {
      deckCount.value = Math.min(deckCount.value + 1, INITIAL_DECK_COUNT)
    }

    activeDrawCard.value = null
    isDrawAnimating.value = false
  }
}

async function playShuffleAnimation() {
  if (isInteractionLocked.value) {
    return
  }

  const deckPose = tableCardPilesRef.value?.getDeckAnimationPose?.()
  if (!deckPose) {
    return
  }

  isShuffleAnimating.value = true

  try {
    await cardShuffleAnimationRef.value?.play({
      deckPose,
      deckCount: deckCount.value,
    })
  } finally {
    isShuffleAnimating.value = false
  }
}

async function playSwapAnimation(source) {
  if (isInteractionLocked.value || !canSwapWith(source)) {
    return
  }

  await nextTick()

  const selfCard = createSwapDemoCard(getSwapPlayerHandCard())
  const opponentCard = resolveMockCardAssets(source.opponent.hand[0])
  const selfElement = sourceElements.value[selfCard?.id]
  const opponentElement = sourceElements.value[source.playerId]

  if (!selfCard || !opponentCard || !selfElement || !opponentElement) {
    return
  }

  isSwapAnimating.value = true
  activeSourceId.value = source.playerId
  let didSwap = false

  try {
    await cardSwapAnimationRef.value?.play({
      selfCard,
      opponentCard,
      selfRect: selfElement.getBoundingClientRect(),
      opponentRect: opponentElement.getBoundingClientRect(),
      onSwap: () => {
        if (didSwap) {
          return
        }

        didSwap = swapMockHands(source.playerId)
      },
    })
  } finally {
    activeSourceId.value = null
    isSwapAnimating.value = false
  }
}

function handleHandPointerDown(card, event) {
  if (isInteractionLocked.value) {
    return
  }

  const cardElement = event.currentTarget
  if (!cardElement?.getBoundingClientRect) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  draggingCard.value = card
  activeSourceId.value = card.id
  dragOriginRect.value = cardElement.getBoundingClientRect()
  updateDragPreview({
    x: event.clientX,
    y: event.clientY,
  })

  pointerMoveHandler = (moveEvent) => {
    updateDragPreview({
      x: moveEvent.clientX,
      y: moveEvent.clientY,
    })
  }

  pointerUpHandler = (upEvent) => {
    updateDragPreview({
      x: upEvent.clientX,
      y: upEvent.clientY,
    })

    const shouldPlay = isOverPlayZone.value
    const releaseRect = getDragReleaseRect()
    resetDragState()

    if (shouldPlay && releaseRect) {
      playCard({
        sourceId: card.id,
        position: 'bottom',
        label: `Play ${card.name}`,
        card,
        faceUp: true,
        removeFromHand: true,
        originRect: releaseRect,
      })
      return
    }

    activeSourceId.value = null
  }

  window.addEventListener('pointermove', pointerMoveHandler, { passive: true })
  window.addEventListener('pointerup', pointerUpHandler)
  window.addEventListener('pointercancel', pointerUpHandler)

  if (typeof cardElement.setPointerCapture === 'function') {
    try {
      cardElement.setPointerCapture(event.pointerId)
    } catch {
      // Pointer capture is a best-effort improvement for drag continuity.
    }
  }
}

async function playCard(source) {
  if (isPlaying.value || isDrawAnimating.value || isShuffleAnimating.value || isSwapAnimating.value) {
    return
  }

  await nextTick()

  const originEl = sourceElements.value[source.sourceId]
  const targetRect = tableCardPilesRef.value?.getDiscardRect?.()

  if ((!originEl && !source.originRect) || !targetRect) {
    return
  }

  const originRect = source.originRect ?? originEl.getBoundingClientRect()
  isPlaying.value = true
  activeSourceId.value = source.sourceId

  try {
    const didPlay = await cardPlayAnimationRef.value?.play({
      card: source.card,
      originRect,
      targetRect,
      position: source.position,
      faceUp: source.faceUp,
    })

    if (didPlay) {
      discardCards.value = [
        ...discardCards.value.slice(-2),
        {
          ...source.card,
          id: `${source.card.id}-discard-${Date.now()}`,
        },
      ]

      if (source.removeFromHand) {
        playerHandCards.value = playerHandCards.value.filter((card) => card.id !== source.card.id)

        if (source.card.isSwapDemoCard) {
          gameState.currentPlayer.hand.splice(0, 1)
        }
      }
    }
  } finally {
    activeSourceId.value = null
    isPlaying.value = false
  }
}

function playOpponentCard(source) {
  playCard({
    sourceId: source.playerId,
    position: source.position,
    label: source.label,
    card: source.card,
    faceUp: false,
    removeFromHand: false,
  })
}

function playHandCard(card) {
  playCard({
    sourceId: card.id,
    position: 'bottom',
    label: `我方出牌：${card.name}`,
    card,
    faceUp: true,
    removeFromHand: true,
  })
}

onUnmounted(() => {
  cardPlayAnimationRef.value?.stop?.()
  cardSwapAnimationRef.value?.stop?.()
  clearPointerListeners()
})
</script>

<template>
  <main class="cardplay-test" :style="{ backgroundImage: `url(${gameTableBackgroundUrl})` }">
    <div class="cardplay-test__shade"></div>

    <section class="cardplay-test__hud">
      <div>
        <p>cardplay_test</p>
        <h1>手牌出牌與抽牌測試</h1>
      </div>
      <div class="cardplay-test__hud-actions">
        <button
          v-for="source in opponentSources"
          :key="`hud-${source.playerId}`"
          type="button"
          :disabled="isInteractionLocked"
          @click="playOpponentCard(source)"
        >
          {{ source.label }}
        </button>
        <button
          v-for="source in opponentSources"
          :key="`swap-${source.playerId}`"
          type="button"
          class="cardplay-test__hud-button--swap"
          :disabled="isInteractionLocked || !canSwapWith(source)"
          @click="playSwapAnimation(source)"
        >
          {{ isSwapAnimating && activeSourceId === source.playerId ? '交換中' : source.swapLabel }}
        </button>
        <button
          type="button"
          :disabled="isInteractionLocked"
          @click="playShuffleAnimation"
        >
          {{ isShuffleAnimating ? 'Shuffling' : 'Shuffle' }}
        </button>
        <button
          type="button"
          :disabled="isInteractionLocked"
          @click="playDrawAnimation"
        >
          {{ isDrawAnimating ? '抽牌中' : '抽牌' }}
        </button>
      </div>
    </section>

    <PlayerSeats :players="players" />

    <button
      v-for="source in opponentSources"
      :key="source.playerId"
      :ref="(element) => setSourceElement(source.playerId, element)"
      type="button"
      class="cardplay-test__source-card"
      :class="[
        `cardplay-test__source-card--${source.position}`,
        { 'cardplay-test__source-card--playing': activeSourceId === source.playerId },
      ]"
      :disabled="isInteractionLocked"
      :style="{ '--accent': source.card.color }"
      :aria-label="source.label"
      @click="playOpponentCard(source)"
    >
      <span class="cardplay-test__source-card-label">{{ source.card.type }}</span>
      <img :src="cardBackUrl" alt="" draggable="false" />
    </button>

    <section class="cardplay-test__table-piles">
      <TableCardPiles
        ref="tableCardPilesRef"
        :deck-count="deckCount"
        :discard-cards="discardCards"
        :is-draw-disabled="isInteractionLocked"
        :is-deck-hidden="isShuffleAnimating"
        :is-drop-target-active="isPlaying || isSwapAnimating || isOverPlayZone"
        @draw="playDrawAnimation"
      />
    </section>

    <section class="cardplay-test__player-hand" aria-label="我方手牌">
      <button
        v-for="(card, index) in playerHandCards"
        :key="card.id"
        :ref="(element) => setSourceElement(card.id, element)"
        type="button"
        class="cardplay-test__hand-card"
        :class="{
          'cardplay-test__hand-card--playing': activeSourceId === card.id,
          'cardplay-test__hand-card--dragging': draggingCard?.id === card.id,
        }"
        :disabled="isPlaying || isDrawAnimating || isShuffleAnimating || isSwapAnimating"
        :style="{
          '--accent': card.color,
          '--fan-index': index - (playerHandCards.length - 1) / 2,
          '--fan-lift': Math.abs(index - (playerHandCards.length - 1) / 2),
        }"
        :aria-label="`我方出牌：${card.name}`"
        @pointerdown="handleHandPointerDown(card, $event)"
      >
        <GameCard
          :name="card.name"
          :background-url="card.backgroundUrl"
          :frame-url="card.frameUrl"
        />
      </button>

      <div ref="drawTargetRef" class="cardplay-test__draw-target" aria-hidden="true"></div>
    </section>

    <div
      v-if="draggingCard"
      class="cardplay-test__drag-preview"
      :class="{ 'cardplay-test__drag-preview--over': isOverPlayZone }"
      :style="dragPreviewStyle"
      aria-hidden="true"
    >
      <div class="cardplay-test__drag-preview-glow" :style="{ '--accent': draggingCard.color }"></div>
      <GameCard
        :name="draggingCard.name"
        :background-url="draggingCard.backgroundUrl"
        :frame-url="draggingCard.frameUrl"
      />
    </div>

    <CardDrawAnimation
      ref="cardDrawAnimationRef"
      :card="activeDrawCard"
    />

    <CardShuffleAnimation ref="cardShuffleAnimationRef" />
    <CardPlayAnimation ref="cardPlayAnimationRef" />
    <CardSwapAnimation ref="cardSwapAnimationRef" />
  </main>
</template>

<style scoped>
.cardplay-test {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background-color: #07111d;
  background-position: center;
  background-size: cover;
  color: #f8fafc;
  isolation: isolate;
}

.cardplay-test__shade {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(circle at 50% 42%, rgba(56, 189, 248, 0.14), transparent 28%),
    radial-gradient(circle at 50% 62%, rgba(250, 204, 21, 0.1), transparent 34%),
    linear-gradient(180deg, rgba(7, 17, 29, 0.72), rgba(7, 17, 29, 0.2) 48%, rgba(7, 17, 29, 0.74));
}

.cardplay-test__hud {
  position: absolute;
  top: clamp(16px, 3vh, 28px);
  right: clamp(16px, 3vw, 36px);
  left: clamp(16px, 3vw, 36px);
  z-index: 30;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  pointer-events: none;
}

.cardplay-test__hud p,
.cardplay-test__hud h1 {
  margin: 0;
  text-shadow: 0 3px 12px rgba(0, 0, 0, 0.56);
}

.cardplay-test__hud p {
  color: #facc15;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.cardplay-test__hud h1 {
  margin-top: 5px;
  font-size: clamp(24px, 3vw, 40px);
  line-height: 1;
}

.cardplay-test__hud-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  max-width: min(56vw, 620px);
  pointer-events: auto;
}

.cardplay-test__hud button {
  min-height: 38px;
  border: 1px solid rgba(250, 204, 21, 0.64);
  border-radius: 8px;
  padding: 0 12px;
  cursor: pointer;
  background: rgba(7, 17, 29, 0.78);
  color: #f8fafc;
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.32);
}

.cardplay-test__hud button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.cardplay-test__hud-button--swap {
  min-width: 144px;
  min-height: 48px;
  border-color: rgba(255, 255, 255, 0.72);
  border-radius: 0;
  padding: 12px 22px;
  background: var(--surface-glass);
  color: var(--brand-navy);
  font-size: var(--text-sm);
  letter-spacing: 0.04em;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.38),
    var(--shadow);
  backdrop-filter: blur(16px);
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.cardplay-test__hud-button--swap:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: var(--brand-hover);
  background: var(--brand-hover);
  color: #fff;
}

.cardplay-test__hud-button--swap:active:not(:disabled) {
  transform: translateY(1px);
  border-color: var(--brand-active);
  background: var(--brand-active);
  color: #fff;
}

.cardplay-test__hud-button--swap:focus-visible {
  outline: none;
  box-shadow: 0 0 0 5px var(--brand-focus);
}

.cardplay-test__hud-button--swap:disabled {
  border-color: transparent;
  background: rgba(160, 166, 179, 0.62);
  color: #fff;
  box-shadow: none;
}

.cardplay-test__source-card {
  position: absolute;
  z-index: 24;
  width: clamp(56px, 5.5vw, 78px);
  aspect-ratio: 3 / 4;
  border: 0;
  padding: 0;
  cursor: pointer;
  background: transparent;
  filter: drop-shadow(0 10px 12px rgba(0, 0, 0, 0.48));
  transform-origin: 50% 50%;
  transition:
    filter 0.16s ease,
    transform 0.16s ease,
    opacity 0.16s ease;
}

.cardplay-test__source-card:disabled {
  cursor: wait;
  opacity: 0.58;
}

.cardplay-test__source-card:hover:not(:disabled),
.cardplay-test__source-card--playing {
  filter:
    drop-shadow(0 0 13px var(--accent))
    drop-shadow(0 12px 14px rgba(0, 0, 0, 0.5));
}

.cardplay-test__source-card--top {
  top: clamp(126px, 19vh, 168px);
  left: 50%;
  transform: translateX(-50%) rotateX(26deg) rotateZ(-8deg);
}

.cardplay-test__source-card--top:hover:not(:disabled),
.cardplay-test__source-card--top.cardplay-test__source-card--playing {
  transform: translate(-50%, -10px) rotateX(20deg) rotateZ(-8deg);
}

.cardplay-test__source-card--left {
  top: 50%;
  left: clamp(118px, 14vw, 206px);
  transform: translateY(-50%) rotateX(20deg) rotateZ(8deg);
}

.cardplay-test__source-card--left:hover:not(:disabled),
.cardplay-test__source-card--left.cardplay-test__source-card--playing {
  transform: translate(10px, -50%) rotateX(16deg) rotateZ(8deg);
}

.cardplay-test__source-card--right {
  top: 50%;
  right: clamp(118px, 14vw, 206px);
  transform: translateY(-50%) rotateX(20deg) rotateZ(-8deg);
}

.cardplay-test__source-card--right:hover:not(:disabled),
.cardplay-test__source-card--right.cardplay-test__source-card--playing {
  transform: translate(-10px, -50%) rotateX(16deg) rotateZ(-8deg);
}

.cardplay-test__source-card img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
}

.cardplay-test__source-card-label {
  position: absolute;
  left: 50%;
  bottom: -20px;
  z-index: 1;
  width: max-content;
  max-width: 120px;
  transform: translateX(-50%);
  color: #e2e8f0;
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.72);
  pointer-events: none;
}

.cardplay-test__table-piles {
  position: absolute;
  top: 42%;
  left: 50%;
  z-index: 12;
  transform: translateX(-50%);
}

.cardplay-test__player-hand {
  position: absolute;
  right: clamp(20px, 7vw, 120px);
  bottom: clamp(-34px, -3vh, -18px);
  left: clamp(20px, 7vw, 120px);
  z-index: 24;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: clamp(128px, 23vh, 220px);
  padding-bottom: 12px;
  pointer-events: none;
  perspective: 1100px;
}

.cardplay-test__hand-card {
  position: relative;
  width: clamp(76px, 8vw, 126px);
  aspect-ratio: 3 / 4;
  margin-left: clamp(-26px, -2.3vw, -12px);
  border: 0;
  padding: 0;
  cursor: pointer;
  background: transparent;
  filter: drop-shadow(0 12px 16px rgba(0, 0, 0, 0.44));
  transform:
    translateY(calc(var(--fan-lift) * 5px))
    rotateZ(calc(var(--fan-index) * 5deg));
  transform-origin: 50% 100%;
  transition:
    filter 0.16s ease,
    transform 0.16s ease,
    opacity 0.16s ease;
  pointer-events: auto;
}

.cardplay-test__hand-card:first-child {
  margin-left: 0;
}

.cardplay-test__hand-card:hover:not(:disabled),
.cardplay-test__hand-card--playing {
  filter:
    drop-shadow(0 0 15px var(--accent))
    drop-shadow(0 16px 18px rgba(0, 0, 0, 0.5));
  transform: translateY(-18px) rotateZ(calc(var(--fan-index) * 3deg));
}

.cardplay-test__hand-card--dragging {
  opacity: 0.18;
}

.cardplay-test__hand-card:disabled {
  cursor: wait;
  opacity: 0.58;
}

.cardplay-test__draw-target {
  width: clamp(76px, 8vw, 126px);
  aspect-ratio: 3 / 4;
  margin-left: clamp(-26px, -2.3vw, -12px);
  opacity: 0;
  pointer-events: none;
}

.cardplay-test__drag-preview {
  position: fixed;
  z-index: 49;
  cursor: grabbing;
  filter: drop-shadow(0 18px 24px rgba(0, 0, 0, 0.42));
  pointer-events: none;
  transform-origin: 50% 50%;
  will-change: transform;
}

.cardplay-test__drag-preview-glow {
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

.cardplay-test__drag-preview--over .cardplay-test__drag-preview-glow {
  opacity: 0.82;
  transform: scale(1);
}

@media (max-width: 860px) {
  .cardplay-test__hud {
    align-items: stretch;
  }

  .cardplay-test__hud h1 {
    font-size: 26px;
  }

  .cardplay-test__hud-actions {
    max-width: 48vw;
  }

  .cardplay-test__hud-button--swap {
    width: 100%;
  }

  .cardplay-test__source-card--left {
    left: 88px;
  }

  .cardplay-test__source-card--right {
    right: 88px;
  }

  .cardplay-test__player-hand {
    right: 12px;
    left: 12px;
  }

  .cardplay-test__table-piles {
    top: 44%;
  }
}
</style>
