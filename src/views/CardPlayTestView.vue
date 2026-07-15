<script setup>
import { computed, nextTick, onUnmounted, ref } from 'vue'
import gameTableBackgroundUrl from '@/assets/images/bg-game-table.webp'
import { cardAssetsByKey } from '@/constants/cardAssets'
import {
  createGuestNickname,
  guestAvatars,
} from '@/constants/guestOptions'
import { fallbackAvatars } from '@/constants/playerAssets'
import CardDealAnimation from '@/components/game/animations/CardDealAnimation.vue'
import CardDrawAnimation from '@/components/game/animations/CardDrawAnimation.vue'
import CardPlayAnimation from '@/components/game/animations/CardPlayAnimation.vue'
import CardShuffleAnimation from '@/components/game/animations/CardShuffleAnimation.vue'
import CardSwapAnimation from '@/components/game/animations/CardSwapAnimation.vue'
import CleanerAnimation from '@/components/game/animations/CleanerAnimation.vue'
import FlyInTextModal from '@/components/game/animations/FlyInTextModal.vue'
import GameCard from '@/components/game/ui/GameCard.vue'
import InternAnimation from '@/components/game/animations/InternAnimation.vue'
import ManagerAnimation from '@/components/game/animations/ManagerAnimation.vue'
import PMAnimation from '@/components/game/animations/PMAnimation.vue'
import PlayerSeats from '@/components/game/ui/PlayerSeats.vue'
import ProtectionAura from '@/components/game/animations/ProtectionAura.vue'
import TableCardPiles from '@/components/game/ui/TableCardPiles.vue'
import { createMockGameState } from '@/mocks/mockGameState.js'

const SELF_PLAYER_ID = 'player-bottom'
const INITIAL_DECK_COUNT = 28

const rawPlayers = [
  {
    id: 'player-top',
    name: '上方玩家',
    avatarUrl: fallbackAvatars[0],
    roundWins: 1,
    position: 'top',
    isCurrentPlayer: false,
  },
  {
    id: 'player-left',
    name: '左方玩家',
    avatarUrl: fallbackAvatars[1],
    roundWins: 0,
    position: 'left',
    isCurrentPlayer: false,
  },
  {
    id: 'player-right',
    name: '右方玩家',
    avatarUrl: fallbackAvatars[2],
    roundWins: 2,
    position: 'right',
    isCurrentPlayer: false,
  },
  {
    id: SELF_PLAYER_ID,
    name: '自己',
    avatarUrl: fallbackAvatars[3],
    roundWins: 3,
    position: 'bottom',
    isCurrentPlayer: true,
  },
]

const players = rawPlayers.map((player, index) => ({
  ...player,
  name: createGuestNickname() ?? guestAvatars[index]?.name ?? player.name,
  avatarUrl: player.avatarUrl ?? guestAvatars[index]?.image,
}))

const playerHandCardCounts = {
  'player-top': 2,
  'player-left': 2,
  'player-right': 2,
  [SELF_PLAYER_ID]: 4,
}

const tableCardPilesRef = ref(null)
const playerSeatsRef = ref(null)
const dealAnimationRef = ref(null)
const drawAnimationRef = ref(null)
const playAnimationRef = ref(null)
const shuffleAnimationRef = ref(null)
const handAnchorRefs = ref({})
const playerHandAnchorRefs = ref({})
const opponentCardRefs = ref({})

const deckCount = ref(INITIAL_DECK_COUNT)
const isBusy = ref(false)
const isSelfProtected = ref(true)
const protectionSuccessKey = ref(0)
const activeDrawCard = ref(null)
const cleanerResult = ref(null)
const internResult = ref(null)
const managerResult = ref(null)
const pmResult = ref(null)
const swapResult = ref(null)
const isFlyInTextOpen = ref(false)
const isRoundWinnerNoticeOpen = ref(false)
const demoRoundWinner = ref(null)
const lastAction = ref('Ready')
const effectResolvers = new Map()
const discardCards = ref([
  createCard('advisor', 'discard-advisor'),
])

const handCards = ref([
  createCard('intern', 'hand-intern'),
  createCard('cleaner', 'hand-cleaner'),
  createCard('manager', 'hand-manager'),
  createCard('pm', 'hand-pm'),
])

const opponentCards = [
  {
    playerId: 'player-top',
    position: 'top',
    label: '上方出牌',
    card: createCard('ceo', 'opponent-top-ceo'),
  },
  {
    playerId: 'player-left',
    position: 'left',
    label: '左方出牌',
    card: createCard('hr', 'opponent-left-hr'),
  },
  {
    playerId: 'player-right',
    position: 'right',
    label: '右方出牌',
    card: createCard('manager', 'opponent-right-manager'),
  },
]

const controls = computed(() => [
  {
    label: isSelfProtected.value ? 'Protect On' : 'Protect Off',
    action: toggleSelfProtection,
  },
  { label: 'Defense Success', action: playProtectionSuccess },
  { label: 'HR Swap', action: playSwapAnimation },
  { label: 'Fly-in Text', action: playFlyInTextModal },
  { label: 'Round Winner', action: playRoundWinnerNotice },
  { label: '發牌', action: playDealAnimation },
  { label: '洗牌', action: playShuffleAnimation },
  { label: '自己抽牌', action: () => playDrawAnimation(SELF_PLAYER_ID) },
  { label: '對手抽牌', action: () => playDrawAnimation('player-top') },
  { label: '自己出牌', action: () => playCardFromHand(0) },
  { label: '對手出牌', action: () => playOpponentCard(opponentCards[0]) },
  { label: '清潔工', action: playCleanerAnimation },
  { label: '實習生猜對', action: () => playInternAnimation('correct') },
  { label: '實習生猜錯', action: () => playInternAnimation('incorrect') },
  { label: '主管勝利', action: () => playManagerAnimation('win') },
  { label: '主管失敗', action: () => playManagerAnimation('lose') },
  { label: '主管平手', action: () => playManagerAnimation('draw') },
  { label: 'PM換牌', action: playPMAnimation },
])

function createCard(assetKey, id) {
  const asset = cardAssetsByKey[assetKey]

  return {
    ...asset,
    id,
    assetKey,
  }
}

function setHandAnchorRef(cardId, element) {
  if (element) {
    handAnchorRefs.value[cardId] = element
    return
  }

  delete handAnchorRefs.value[cardId]
}

function setPlayerHandAnchorRef(playerId, element) {
  if (element) {
    playerHandAnchorRefs.value[playerId] = element
    return
  }

  delete playerHandAnchorRefs.value[playerId]
}

function setOpponentCardRef(playerId, element) {
  if (element) {
    opponentCardRefs.value[playerId] = element
    return
  }

  delete opponentCardRefs.value[playerId]
}

function getElementRect(element) {
  return element?.getBoundingClientRect?.() ?? null
}

function getDeckRect() {
  return tableCardPilesRef.value?.getDeckRect?.() ?? null
}

function getDiscardRect() {
  return tableCardPilesRef.value?.getDiscardRect?.() ?? null
}

function getPlayerHandRect(playerId) {
  return (
    getElementRect(playerHandAnchorRefs.value[playerId]) ??
    playerSeatsRef.value?.getHandTargetRect?.(playerId) ??
    null
  )
}

function isSelfPlayer(playerId) {
  return String(playerId) === SELF_PLAYER_ID
}

function getPlayerName(playerId) {
  return (
    players.find((player) => String(player.id) === String(playerId))?.name ??
    '玩家'
  )
}

function setBusyState(label) {
  isBusy.value = true
  lastAction.value = label
}

function releaseBusyState() {
  isBusy.value = false
}

function toggleSelfProtection() {
  isSelfProtected.value = !isSelfProtected.value
}

function playProtectionSuccess() {
  isSelfProtected.value = true
  protectionSuccessKey.value += 1
}

function uniqueId(prefix) {
  return `${prefix}-${Date.now()}`
}

function addDiscardCard(card) {
  discardCards.value = [
    ...discardCards.value.slice(-2),
    {
      ...card,
      id: uniqueId(`${card.assetKey ?? card.id}-discard`),
    },
  ]
}

async function runAction(label, action) {
  if (isBusy.value) {
    return
  }

  clearAllEffectResults()
  setBusyState(label)

  try {
    await withActionTimeout(action(), 5000)
  } finally {
    clearAllEffectResults()
    releaseBusyState()
  }
}

function withActionTimeout(actionPromise, duration) {
  return Promise.race([
    Promise.resolve(actionPromise),
    new Promise((resolve) => {
      window.setTimeout(resolve, duration)
    }),
  ])
}

async function playDealAnimation() {
  const startRect = getDeckRect()
  const deals = players
    .map((player, index) => ({
      playerId: player.id,
      targetRect: getPlayerHandRect(player.id),
      rotation: [-8, 7, -7, 4][index],
    }))
    .filter((deal) => deal.targetRect)

  if (!startRect || deals.length === 0) {
    return
  }

  await dealAnimationRef.value?.play({
    startRect,
    deals,
  })
}

async function playShuffleAnimation() {
  const deckPose = tableCardPilesRef.value?.getDeckAnimationPose?.()
  if (!deckPose) {
    return
  }

  await shuffleAnimationRef.value?.play({
    deckPose,
    deckCount: deckCount.value,
  })
}

async function playDrawAnimation(playerId) {
  const startRect = getDeckRect()
  const targetRect = getPlayerHandRect(playerId)
  if (!startRect || !targetRect) {
    return
  }

  const nextCard = createCard('senior', uniqueId('draw-senior'))
  activeDrawCard.value = nextCard
  deckCount.value = Math.max(deckCount.value - 1, 0)
  await nextTick()

  const drawOptions = {
    startRect,
    targetRect,
    onLanded: () => {
      if (isSelfPlayer(playerId)) {
        handCards.value = [...handCards.value, nextCard]
      }
    },
  }

  if (isSelfPlayer(playerId)) {
    await drawAnimationRef.value?.selfDraw(drawOptions)
  } else {
    await drawAnimationRef.value?.othersDraw(drawOptions)
  }

  activeDrawCard.value = null
}

async function playCardFromHand(index) {
  const card = handCards.value[index]
  const originRect = getElementRect(handAnchorRefs.value[card?.id])
  const targetRect = getDiscardRect()
  if (!card || !originRect || !targetRect) {
    return
  }

  const didPlay = await playAnimationRef.value?.play({
    card,
    originRect,
    targetRect,
    position: 'bottom',
    faceUp: true,
  })

  if (didPlay) {
    handCards.value = handCards.value.filter((item) => item.id !== card.id)
    addDiscardCard(card)
  }
}

async function playOpponentCard(source) {
  const originRect = getElementRect(opponentCardRefs.value[source.playerId])
  const targetRect = getDiscardRect()
  if (!originRect || !targetRect) {
    return
  }

  const didPlay = await playAnimationRef.value?.play({
    card: source.card,
    originRect,
    targetRect,
    position: source.position,
    faceUp: false,
  })

  if (didPlay) {
    addDiscardCard(source.card)
  }
}

function playCleanerAnimation() {
  const id = uniqueId('cleaner')
  const complete = waitForEffectComplete('cleaner', id)
  cleanerResult.value = {
    id,
    targetPlayerId: 'player-top',
    viewerPlayerId: SELF_PLAYER_ID,
    targetCard: createCard('ceo', uniqueId('cleaner-ceo')),
    revealCard: true,
  }

  return complete
}

function playInternAnimation(outcome) {
  const id = uniqueId(`intern-${outcome}`)
  const complete = waitForEffectComplete('intern', id)
  internResult.value = {
    id,
    targetPlayerId: 'player-top',
    targetCard: createCard('manager', uniqueId('intern-manager')),
    outcome,
  }

  return complete
}

function playManagerAnimation(outcome) {
  const id = uniqueId(`manager-${outcome}`)
  const complete = waitForEffectComplete('manager', id)
  managerResult.value = {
    id,
    sourcePlayerId: SELF_PLAYER_ID,
    targetPlayerId: 'player-top',
    sourceCard: createCard('manager', uniqueId('manager-source')),
    targetCard: createCard('cleaner', uniqueId('manager-target')),
    outcome,
    revealCards: true,
  }

  return complete
}

function playPMAnimation() {
  const id = uniqueId('pm')
  const complete = waitForEffectComplete('pm', id)
  pmResult.value = {
    id,
    targetPlayerId: SELF_PLAYER_ID,
    discardedCard: createCard('pm', uniqueId('pm-discarded')),
    newCard: createCard('hr', uniqueId('pm-new')),
  }

  return complete
}

function playSwapAnimation() {
  const id = uniqueId('swap')
  const complete = waitForEffectComplete('swap', id)
  swapResult.value = {
    id,
    sourcePlayerId: SELF_PLAYER_ID,
    targetPlayerId: 'player-top',
    sourceCard: createCard('cleaner', uniqueId('swap-source')),
    targetCard: createCard('ceo', uniqueId('swap-target')),
  }

  return complete
}

function playFlyInTextModal() {
  isFlyInTextOpen.value = false

  return nextTick().then(() => {
    isFlyInTextOpen.value = true
  })
}

function playRoundWinnerNotice() {
  isRoundWinnerNoticeOpen.value = false
  demoRoundWinner.value = players[0]

  return nextTick().then(() => {
    isRoundWinnerNoticeOpen.value = true
  })
}

function waitForEffectComplete(type, id) {
  return new Promise((resolve) => {
    const key = `${type}:${id}`
    const timeout = window.setTimeout(() => {
      clearEffectResult(type, { id })
    }, 4000)

    effectResolvers.set(key, { resolve, timeout })
  })
}

function clearEffectResult(type, result) {
  if (type === 'cleaner') cleanerResult.value = null
  if (type === 'intern') internResult.value = null
  if (type === 'manager') managerResult.value = null
  if (type === 'pm') pmResult.value = null
  if (type === 'swap') swapResult.value = null
  const key = `${type}:${result?.id}`
  const resolver = effectResolvers.get(key)
  if (resolver) {
    window.clearTimeout(resolver.timeout)
    resolver.resolve()
  }
  effectResolvers.delete(key)
}

function clearAllEffectResults() {
  const activeResults = [
    ['cleaner', cleanerResult.value],
    ['intern', internResult.value],
    ['manager', managerResult.value],
    ['pm', pmResult.value],
    ['swap', swapResult.value],
  ]

  activeResults.forEach(([type, result]) => {
    if (result) {
      clearEffectResult(type, result)
    }
  })
}

onUnmounted(() => {
  dealAnimationRef.value?.cancel?.()
  drawAnimationRef.value?.stop?.()
  playAnimationRef.value?.stop?.()
})
</script>

<template>
  <main
    class="animation-test"
    :style="{ backgroundImage: `url(${gameTableBackgroundUrl})` }"
  >
    <div class="animation-test__shade"></div>

    <section class="animation-test__panel" aria-label="動畫測試控制">
      <div class="animation-test__title">
        <p>Animation Lab</p>
        <h1>卡牌動畫測試</h1>
        <span>{{ isBusy ? `播放中：${lastAction}` : 'Ready' }}</span>
      </div>

      <div class="animation-test__controls">
        <button
          v-for="control in controls"
          :key="control.label"
          type="button"
          :disabled="isBusy"
          @click="runAction(control.label, control.action)"
        >
          {{ control.label }}
        </button>
      </div>
    </section>

    <PlayerSeats
      ref="playerSeatsRef"
      :players="players"
      :player-hand-card-counts="playerHandCardCounts"
    />

    <div
      v-for="player in players"
      :key="`hand-anchor-${player.id}`"
      :ref="(element) => setPlayerHandAnchorRef(player.id, element)"
      class="animation-test__hand-anchor"
      :class="`animation-test__hand-anchor--${player.position}`"
      aria-hidden="true"
    ></div>

    <button
      v-for="source in opponentCards"
      :key="source.playerId"
      :ref="(element) => setOpponentCardRef(source.playerId, element)"
      type="button"
      class="animation-test__opponent-card"
      :class="`animation-test__opponent-card--${source.position}`"
      :disabled="isBusy"
      :aria-label="source.label"
      @click="runAction(source.label, () => playOpponentCard(source))"
    >
      <span>{{ source.card.name }}</span>
    </button>

    <section class="animation-test__table">
      <TableCardPiles
        ref="tableCardPilesRef"
        :deck-count="deckCount"
        :discard-cards="discardCards"
        :is-draw-disabled="isBusy"
        @draw="runAction('自己抽牌', () => playDrawAnimation(SELF_PLAYER_ID))"
      />
    </section>

    <section
      class="animation-test__hand"
      :class="{ 'animation-test__hand--protected': isSelfProtected }"
      aria-label="自己的手牌"
    >
      <Transition name="protection-aura-fade">
        <ProtectionAura
          v-if="isSelfProtected"
          :success-key="protectionSuccessKey"
        />
      </Transition>

      <button
        v-for="(card, index) in handCards"
        :key="card.id"
        :ref="(element) => setHandAnchorRef(card.id, element)"
        type="button"
        class="animation-test__hand-card"
        :disabled="isBusy"
        :style="{
          '--fan-index': index - (handCards.length - 1) / 2,
          '--fan-lift': Math.abs(index - (handCards.length - 1) / 2),
        }"
        :aria-label="`打出 ${card.name}`"
        @click="runAction(`自己出牌：${card.name}`, () => playCardFromHand(index))"
      >
        <GameCard
          :name="card.name"
          :background-url="card.backgroundUrl"
          :frame-url="card.frameUrl"
        />
      </button>
    </section>

    <CardDealAnimation ref="dealAnimationRef" />
    <CardDrawAnimation ref="drawAnimationRef" :card="activeDrawCard" />
    <CardShuffleAnimation ref="shuffleAnimationRef" />
    <CardPlayAnimation ref="playAnimationRef" />

    <CleanerAnimation
      v-if="cleanerResult"
      :result="cleanerResult"
      :source-player-name="getPlayerName(cleanerResult.viewerPlayerId)"
      :target-player-name="getPlayerName(cleanerResult.targetPlayerId)"
      :get-player-hand-rect="getPlayerHandRect"
      :is-self-player="isSelfPlayer"
      @complete="(result) => clearEffectResult('cleaner', result)"
    />
    <InternAnimation
      v-if="internResult"
      :result="internResult"
      :get-player-hand-rect="getPlayerHandRect"
      :get-discard-rect="getDiscardRect"
      @complete="(result) => clearEffectResult('intern', result)"
    />
    <ManagerAnimation
      v-if="managerResult"
      :result="managerResult"
      :get-player-hand-rect="getPlayerHandRect"
      :get-discard-rect="getDiscardRect"
      :is-self-player="isSelfPlayer"
      @complete="(result) => clearEffectResult('manager', result)"
    />
    <PMAnimation
      v-if="pmResult"
      :result="pmResult"
      :get-player-hand-rect="getPlayerHandRect"
      :get-discard-rect="getDiscardRect"
      :get-deck-rect="getDeckRect"
      :is-self-player="isSelfPlayer"
      @complete="(result) => clearEffectResult('pm', result)"
    />
    <CardSwapAnimation
      v-if="swapResult"
      :result="swapResult"
      :get-player-hand-rect="getPlayerHandRect"
      @complete="(result) => clearEffectResult('swap', result)"
    />

    <FlyInTextModal
      :is-open="isFlyInTextOpen"
      text="Crisis Alert"
      @close="isFlyInTextOpen = false"
    />

    <FlyInTextModal
      :is-open="isRoundWinnerNoticeOpen"
      text="回合勝利"
      :player-name="demoRoundWinner?.name ?? ''"
      :avatar-url="demoRoundWinner?.avatarUrl ?? ''"
      :duration="2400"
      @close="isRoundWinnerNoticeOpen = false"
    />
  </main>
</template>

<style scoped>
.animation-test {
  position: relative;
  min-height: 100dvh;
  overflow: hidden;
  background-color: #07111d;
  background-position: center;
  background-size: cover;
  color: #f8fafc;
  isolation: isolate;
}

.animation-test__shade {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(circle at 50% 44%, rgba(56, 189, 248, 0.16), transparent 28%),
    linear-gradient(180deg, rgba(7, 17, 29, 0.78), rgba(7, 17, 29, 0.22) 48%, rgba(7, 17, 29, 0.82));
}

.animation-test__panel {
  position: fixed;
  top: 16px;
  right: 16px;
  left: 16px;
  z-index: 40;
  display: grid;
  grid-template-columns: minmax(180px, 260px) 1fr;
  gap: 16px;
  align-items: start;
  pointer-events: none;
}

.animation-test__title {
  display: grid;
  gap: 5px;
  text-shadow: 0 3px 12px rgba(0, 0, 0, 0.58);
}

.animation-test__title p,
.animation-test__title h1,
.animation-test__title span {
  margin: 0;
}

.animation-test__title p {
  color: #facc15;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.animation-test__title h1 {
  font-size: clamp(24px, 3vw, 40px);
  line-height: 1;
}

.animation-test__title span {
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 800;
}

.animation-test__controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  pointer-events: auto;
}

.animation-test__controls button,
.animation-test__opponent-card,
.animation-test__hand-card {
  cursor: pointer;
}

.animation-test__controls button {
  min-height: 36px;
  border: 1px solid rgba(250, 204, 21, 0.58);
  border-radius: 8px;
  padding: 0 11px;
  background: rgba(7, 17, 29, 0.78);
  color: #f8fafc;
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.34);
}

.animation-test__controls button:disabled,
.animation-test__opponent-card:disabled,
.animation-test__hand-card:disabled {
  cursor: wait;
  opacity: 0.55;
}

.animation-test__table {
  position: absolute;
  top: 42%;
  left: 50%;
  z-index: 12;
  transform: translateX(-50%);
}

.animation-test__hand-anchor {
  position: absolute;
  z-index: 1;
  width: clamp(76px, 8vw, 126px);
  aspect-ratio: 3 / 4;
  pointer-events: none;
}

.animation-test__hand-anchor--top {
  top: clamp(188px, 30vh, 250px);
  left: 50%;
  transform: translateX(-50%);
}

.animation-test__hand-anchor--left {
  top: 50%;
  left: clamp(200px, 22vw, 320px);
  transform: translateY(-50%);
}

.animation-test__hand-anchor--right {
  top: 50%;
  right: clamp(200px, 22vw, 320px);
  transform: translateY(-50%);
}

.animation-test__hand-anchor--bottom {
  bottom: clamp(40px, 8vh, 84px);
  left: 50%;
  transform: translateX(-50%);
}

.animation-test__opponent-card {
  position: absolute;
  z-index: 24;
  display: grid;
  place-items: center;
  width: clamp(56px, 5.5vw, 78px);
  aspect-ratio: 3 / 4;
  border: 1px solid rgba(250, 204, 21, 0.5);
  border-radius: 8px;
  padding: 6px;
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.92)),
    rgba(15, 23, 42, 0.8);
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
  text-align: center;
  filter: drop-shadow(0 10px 12px rgba(0, 0, 0, 0.46));
  transition:
    filter 0.16s ease,
    transform 0.16s ease;
}

.animation-test__opponent-card:hover:not(:disabled) {
  filter:
    drop-shadow(0 0 14px rgba(250, 204, 21, 0.74))
    drop-shadow(0 12px 14px rgba(0, 0, 0, 0.5));
}

.animation-test__opponent-card--top {
  top: clamp(138px, 22vh, 190px);
  left: 50%;
  transform: translateX(-50%) rotateZ(-7deg);
}

.animation-test__opponent-card--left {
  top: 50%;
  left: clamp(118px, 14vw, 206px);
  transform: translateY(-50%) rotateZ(7deg);
}

.animation-test__opponent-card--right {
  top: 50%;
  right: clamp(118px, 14vw, 206px);
  transform: translateY(-50%) rotateZ(-7deg);
}

.animation-test__hand {
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

.animation-test__hand-card {
  position: relative;
  z-index: 1;
  width: clamp(76px, 8vw, 126px);
  aspect-ratio: 3 / 4;
  margin-left: clamp(-26px, -2.3vw, -12px);
  border: 0;
  padding: 0;
  background: transparent;
  filter: drop-shadow(0 12px 16px rgba(0, 0, 0, 0.44));
  transform:
    translateY(calc(var(--fan-lift) * 4px))
    rotateZ(calc(var(--fan-index) * 5deg));
  transform-origin: 50% 100%;
  transition:
    filter 0.16s ease,
    transform 0.16s ease,
    opacity 0.16s ease;
  pointer-events: auto;
}

.animation-test__hand-card:first-child {
  margin-left: 0;
}

.animation-test__hand-card:hover:not(:disabled) {
  filter:
    drop-shadow(0 0 15px rgba(250, 204, 21, 0.72))
    drop-shadow(0 16px 18px rgba(0, 0, 0, 0.5));
  transform: translateY(-18px) rotateZ(calc(var(--fan-index) * 3deg));
}

@media (max-width: 920px) {
  .animation-test__panel {
    grid-template-columns: 1fr;
  }

  .animation-test__controls {
    justify-content: flex-start;
    max-width: 100%;
  }

  .animation-test__opponent-card--left {
    left: 88px;
  }

  .animation-test__opponent-card--right {
    right: 88px;
  }
}
</style>
