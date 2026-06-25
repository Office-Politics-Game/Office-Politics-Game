<script setup>
import { computed, nextTick, onUnmounted, ref } from "vue";
import ceoBackgroundUrl from "@/assets/images/card-bg-ceo.webp";
import ceoFrameUrl from "@/assets/images/card-frame-ceo.webp";
import advisorBackgroundUrl from "@/assets/images/card-bg-advisor.webp";
import advisorFrameUrl from "@/assets/images/card-frame-advisor.webp";
import managerBackgroundUrl from "@/assets/images/card-bg-manager.webp";
import managerFrameUrl from "@/assets/images/card-frame-manager.webp";
import hrBackgroundUrl from "@/assets/images/card-bg-hr.webp";
import hrFrameUrl from "@/assets/images/card-frame-hr.webp";
import internBackgroundUrl from "@/assets/images/card-bg-intern.webp";
import internFrameUrl from "@/assets/images/card-frame-intern.webp";
import cleanerBackgroundUrl from "@/assets/images/card-bg-cleaner.webp";
import cleanerFrameUrl from "@/assets/images/card-frame-cleaner.webp";
import seniorBackgroundUrl from "@/assets/images/card-bg-senior.webp";
import seniorFrameUrl from "@/assets/images/card-frame-senior.webp";
import pmBackgroundUrl from "@/assets/images/card-bg-pm.webp";
import pmFrameUrl from "@/assets/images/card-frame-pm.webp";
import gameTableBackgroundUrl from "@/assets/images/bg-game-table.webp";
import playerOneUrl from "@/assets/images/player-1.png";
import playerTwoUrl from "@/assets/images/player-2.png";
import playerThreeUrl from "@/assets/images/player-3.png";
import playerFourUrl from "@/assets/images/player-4.png";
import CardDrawAnimation from "@/components/game/CardDrawAnimation.vue";
import CardPlayAnimation from "@/components/game/CardPlayAnimation.vue";
import CardShuffleAnimation from "@/components/game/CardShuffleAnimation.vue";
import CleanerAnimation from "@/components/game/CleanerAnimation.vue";
import GameCard from "@/components/game/GameCard.vue";
import InternAnimation from "@/components/game/InternAnimation.vue";
import ManagerAnimation from "@/components/game/ManagerAnimation.vue";
import PlayerSeats from "@/components/game/PlayerSeats.vue";
import PMAnimation from "@/components/game/PMAnimation.vue";
import TableCardPiles from "@/components/game/TableCardPiles.vue";

const INITIAL_DECK_COUNT = 28;

const cards = [
  {
    id: "intern-guess",
    name: "實習生",
    type: "Guess",
    rank: 1,
    effectKey: "guess",
    targetMode: "opponent",
    requiresGuess: true,
    backgroundUrl: internBackgroundUrl,
    frameUrl: internFrameUrl,
    color: "#fb923c",
  },
  {
    id: "cleaner-peek",
    name: "打掃阿姨",
    type: "Peek",
    rank: 2,
    effectKey: "peek",
    targetMode: "opponent",
    requiresGuess: false,
    backgroundUrl: cleanerBackgroundUrl,
    frameUrl: cleanerFrameUrl,
    color: "#22c55e",
  },
  {
    id: "manager-compare",
    name: "部門主管",
    type: "Duel",
    rank: 3,
    effectKey: "compare",
    targetMode: "opponent",
    requiresGuess: false,
    backgroundUrl: managerBackgroundUrl,
    frameUrl: managerFrameUrl,
    color: "#fb7185",
  },
  {
    id: "senior-protect",
    name: "職場老鳥",
    type: "Shield",
    rank: 4,
    effectKey: "protect",
    targetMode: "none",
    requiresGuess: false,
    backgroundUrl: seniorBackgroundUrl,
    frameUrl: seniorFrameUrl,
    color: "#60a5fa",
  },
  {
    id: "pm-redraw",
    name: "專案經理",
    type: "Redraw",
    rank: 5,
    effectKey: "redraw",
    targetMode: "anyPlayer",
    requiresGuess: false,
    backgroundUrl: pmBackgroundUrl,
    frameUrl: pmFrameUrl,
    color: "#f97316",
  },
  {
    id: "hr-swap",
    name: "人資主管",
    type: "Swap",
    rank: 6,
    effectKey: "swap",
    targetMode: "opponent",
    requiresGuess: false,
    backgroundUrl: hrBackgroundUrl,
    frameUrl: hrFrameUrl,
    color: "#a78bfa",
  },
  {
    id: "advisor-force",
    name: "資深顧問",
    type: "Force",
    rank: 7,
    effectKey: "force-discard",
    targetMode: "none",
    requiresGuess: false,
    backgroundUrl: advisorBackgroundUrl,
    frameUrl: advisorFrameUrl,
    color: "#38bdf8",
  },
  {
    id: "ceo-pressure",
    name: "執行長",
    type: "Boss",
    rank: 8,
    effectKey: "self-eliminate",
    targetMode: "none",
    requiresGuess: false,
    backgroundUrl: ceoBackgroundUrl,
    frameUrl: ceoFrameUrl,
    color: "#facc15",
  },
];

const guessOptions = [
  { rank: 2, name: "打掃阿姨" },
  { rank: 3, name: "部門主管" },
  { rank: 4, name: "職場老鳥" },
  { rank: 5, name: "專案經理" },
  { rank: 6, name: "人資主管" },
  { rank: 7, name: "資深顧問" },
  { rank: 8, name: "執行長" },
];

const effectCards = {
  intern: {
    name: "實習生",
    value: 1,
    backgroundUrl: internBackgroundUrl,
    frameUrl: internFrameUrl,
  },
  cleaner: {
    name: "打掃阿姨",
    value: 2,
    backgroundUrl: cleanerBackgroundUrl,
    frameUrl: cleanerFrameUrl,
  },
  manager: {
    name: "部門主管",
    value: 3,
    backgroundUrl: managerBackgroundUrl,
    frameUrl: managerFrameUrl,
  },
  pm: {
    name: "專案經理",
    value: 5,
    backgroundUrl: pmBackgroundUrl,
    frameUrl: pmFrameUrl,
  },
  hr: {
    name: "人資主管",
    value: 6,
    backgroundUrl: hrBackgroundUrl,
    frameUrl: hrFrameUrl,
  },
  ceo: {
    name: "執行長",
    value: 8,
    backgroundUrl: ceoBackgroundUrl,
    frameUrl: ceoFrameUrl,
  },
};

const effectDemos = [
  {
    key: "intern-correct",
    label: "實習生：猜中",
    result: {
      type: "intern",
      outcome: "correct",
      title: "猜測成功",
      guessedCardName: "專案經理",
      targetPlayerId: "player-top",
      targetCard: effectCards.pm,
    },
  },
  {
    key: "intern-incorrect",
    label: "實習生：猜錯",
    result: {
      type: "intern",
      outcome: "incorrect",
      title: "猜測失敗",
      guessedCardName: "部門主管",
      targetPlayerId: "player-top",
      targetCard: effectCards.pm,
    },
  },
  {
    key: "intern-targeted-correct",
    label: "別人猜我：猜對",
    result: {
      type: "intern",
      outcome: "correct",
      title: "手牌被猜中",
      guessedCardName: "人資主管",
      targetPlayerId: "player-bottom",
      targetCard: effectCards.hr,
    },
  },
  {
    key: "intern-targeted-incorrect",
    label: "別人猜我：猜錯",
    result: {
      type: "intern",
      outcome: "incorrect",
      title: "對方猜錯",
      guessedCardName: "打掃阿姨",
      targetPlayerId: "player-bottom",
      targetCard: effectCards.hr,
    },
  },
  {
    key: "manager",
    label: "部門主管：比大小",
    result: {
      type: "manager",
      outcome: "win",
      title: "秘密比大小",
      sourcePlayerId: "player-bottom",
      targetPlayerId: "player-right",
      sourceCard: effectCards.hr,
      targetCard: effectCards.cleaner,
    },
  },
  {
    key: "manager-opponents",
    label: "對手互相比大小",
    result: {
      type: "manager",
      outcome: "win",
      title: "對手秘密比大小",
      revealCards: false,
      sourcePlayerId: "player-left",
      targetPlayerId: "player-right",
      sourceCard: effectCards.hr,
      targetCard: effectCards.cleaner,
    },
  },
  {
    key: "cleaner",
    label: "打掃阿姨：查看",
    result: {
      type: "cleaner",
      outcome: "revealed",
      title: "查看對方手牌",
      targetPlayerId: "player-left",
      targetCard: effectCards.ceo,
    },
  },
  {
    key: "cleaner-opponent-opponent",
    label: "別人看別人手牌",
    result: {
      type: "cleaner",
      outcome: "revealed",
      title: "對手秘密查看",
      revealCard: false,
      viewerPlayerId: "player-left",
      targetPlayerId: "player-right",
      targetCard: effectCards.ceo,
    },
  },
  {
    key: "cleaner-opponent-self",
    label: "別人看我的手牌",
    result: {
      type: "cleaner",
      outcome: "revealed",
      title: "我的手牌被查看",
      revealCard: false,
      viewerPlayerId: "player-left",
      targetPlayerId: "player-bottom",
      targetCard: effectCards.hr,
    },
  },
  {
    key: "pm",
    label: "專案經理：重抽",
    result: {
      type: "pm",
      outcome: "redrawn",
      title: "指定玩家棄牌重抽",
      targetPlayerId: "player-left",
      discardedCard: effectCards.intern,
      newCard: effectCards.manager,
    },
  },
];

const players = [
  {
    id: "player-top",
    name: "董事會代表",
    avatarUrl: playerTwoUrl,
    roundWins: 3,
    position: "top",
    isCurrentPlayer: false,
  },
  {
    id: "player-left",
    name: "資深同事",
    avatarUrl: playerThreeUrl,
    roundWins: 0,
    position: "left",
    isCurrentPlayer: false,
  },
  {
    id: "player-right",
    name: "部門主管",
    avatarUrl: playerFourUrl,
    roundWins: 1,
    position: "right",
    isCurrentPlayer: false,
  },
  {
    id: "player-bottom",
    name: "實習新手",
    avatarUrl: playerOneUrl,
    roundWins: 2,
    position: "bottom",
    isCurrentPlayer: true,
  },
];

const opponentSources = [
  {
    playerId: "player-top",
    position: "top",
    label: "上方玩家出牌",
    card: cards[7],
  },
  {
    playerId: "player-left",
    position: "left",
    label: "左方玩家出牌",
    card: cards[6],
  },
  {
    playerId: "player-right",
    position: "right",
    label: "右方玩家出牌",
    card: cards[2],
  },
];

const initialHandCards = [
  { ...cards[0], id: "hand-intern-guess" },
  { ...cards[1], id: "hand-cleaner-peek" },
  { ...cards[3], id: "hand-senior-protect" },
  { ...cards[4], id: "hand-pm-redraw" },
  { ...cards[5], id: "hand-hr-swap" },
];

const drawDeck = [
  { ...cards[7], id: "draw-ceo-pressure" },
  { ...cards[2], id: "draw-manager-compare" },
  { ...cards[6], id: "draw-advisor-force" },
  { ...cards[5], id: "draw-hr-swap" },
];

const sourceElements = ref({});
const playerHandCards = ref([...initialHandCards]);
const tableCardPilesRef = ref(null);
const drawTargetRef = ref(null);
const cardDrawAnimationRef = ref(null);
const cardPlayAnimationRef = ref(null);
const cardShuffleAnimationRef = ref(null);
const playerSeatsRef = ref(null);
const activeEffectResult = ref(null);

const activeSourceId = ref(null);
const activeDrawCard = ref(null);
const isPlaying = ref(false);
const isDrawAnimating = ref(false);
const isShuffleAnimating = ref(false);
const deckCount = ref(INITIAL_DECK_COUNT);
const draggingCard = ref(null);
const dragOriginRect = ref(null);
const dragPoint = ref(null);
const dragPreviewStyle = ref({ display: "none" });
const isOverPlayZone = ref(false);
const drawIndex = ref(0);
const pendingPlay = ref(null);
const selectedTargetPlayerId = ref(null);
const selectedGuessRank = ref(null);
const discardCards = ref([
  {
    ...cards[6],
    id: "discard-start",
  },
]);

const isInteractionLocked = computed(
  () =>
    isPlaying.value ||
    isDrawAnimating.value ||
    isShuffleAnimating.value ||
    Boolean(draggingCard.value) ||
    Boolean(pendingPlay.value),
);

const requiresTarget = computed(
  () =>
    pendingPlay.value?.card.targetMode === "opponent" ||
    pendingPlay.value?.card.targetMode === "anyPlayer",
);

const selectableTargetPlayerIds = computed(() => {
  if (!requiresTarget.value) {
    return [];
  }

  return players
    .filter((player) => {
      if (pendingPlay.value.card.targetMode === "opponent") {
        return !player.isCurrentPlayer;
      }

      return true;
    })
    .map((player) => player.id);
});

const selectedTargetPlayer = computed(
  () =>
    players.find((player) => player.id === selectedTargetPlayerId.value) ??
    null,
);

const selectedGuessOption = computed(
  () =>
    guessOptions.find((option) => option.rank === selectedGuessRank.value) ??
    null,
);

const canConfirmPendingPlay = computed(() => {
  if (!pendingPlay.value) {
    return false;
  }

  if (requiresTarget.value && !selectedTargetPlayerId.value) {
    return false;
  }

  if (pendingPlay.value.card.requiresGuess && !selectedGuessRank.value) {
    return false;
  }

  return true;
});

let pointerMoveHandler = null;
let pointerUpHandler = null;

function playEffectDemo(demo) {
  if (activeEffectResult.value) {
    return;
  }

  activeEffectResult.value = {
    ...demo.result,
    id: `${demo.key}-${Date.now()}`,
  };
}

function handleEffectComplete() {
  activeEffectResult.value = null;
}

function getEffectPlayerHandRect(playerId) {
  if (playerId === "player-bottom") {
    const handCard = playerHandCards.value[0];
    return (
      sourceElements.value[handCard?.id]?.getBoundingClientRect?.() ??
      drawTargetRef.value?.getBoundingClientRect?.() ??
      null
    );
  }

  return playerSeatsRef.value?.getHandTargetRect?.(playerId) ?? null;
}

function setSourceElement(sourceId, element) {
  if (element) {
    sourceElements.value[sourceId] = element;
    return;
  }

  delete sourceElements.value[sourceId];
}

// 為動畫疊加層建立一個更大的固定矩形，以便卡片可以從其原始位置放大
// 而不會顯得模糊或像素化。
function rectToFixedStyle(rect) {
  return {
    display: "block",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  };
}

// 檢查目前指標位置是否在目標矩形內，我們用它來判斷拖曳的卡牌是否在遊戲區域上方。
// 如果在出牌區則讓矩形發亮，放開則會觸發發牌動畫
function pointInsideRect(point, rect) {
  if (!point || !rect) {
    return false;
  }

  return (
    point.x >= rect.left &&
    point.x <= rect.left + rect.width &&
    point.y >= rect.top &&
    point.y <= rect.top + rect.height
  );
}

// 拖曳結束或中斷時，把綁在 window 上的 pointer 事件監聽移除，
// 避免後續還繼續收到移動或放開事件。
function clearPointerListeners() {
  if (pointerMoveHandler) {
    window.removeEventListener("pointermove", pointerMoveHandler);
    pointerMoveHandler = null;
  }

  if (pointerUpHandler) {
    window.removeEventListener("pointerup", pointerUpHandler);
    window.removeEventListener("pointercancel", pointerUpHandler);
    pointerUpHandler = null;
  }
}

// 在拖曳過程中，讓那張預覽卡跟著滑鼠跑，並同時判斷有沒有拖進出牌區。
function updateDragPreview(point) {
  if (!dragOriginRect.value) {
    return;
  }

  dragPoint.value = point;
  const rect = dragOriginRect.value;
  const translateX = point.x - (rect.left + rect.width / 2);
  const translateY = point.y - (rect.top + rect.height / 2);
  const playZoneRect = tableCardPilesRef.value?.getPlayZoneRect?.();

  isOverPlayZone.value = pointInsideRect(point, playZoneRect);
  dragPreviewStyle.value = {
    ...rectToFixedStyle(rect),
    transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${isOverPlayZone.value ? 1.06 : 1})`,
  };
}

// 把拖曳互動整個清空，回到初始狀態。拖曳結束、取消，或中斷時的收尾清理。
function resetDragState() {
  clearPointerListeners();
  draggingCard.value = null;
  dragOriginRect.value = null;
  dragPoint.value = null;
  dragPreviewStyle.value = { display: "none" };
  isOverPlayZone.value = false;
}

function resetPendingChoices() {
  selectedTargetPlayerId.value = null;
  selectedGuessRank.value = null;
}

// 算出卡片放開當下的位置矩形。系統需要知道：卡片最後是從畫面上的哪個位置開始接續播放出牌動畫。它是在把「放開的位置」轉成一個可供動畫使用的矩形資料。
function getDragReleaseRect() {
  if (!dragOriginRect.value || !dragPoint.value) {
    return null;
  }

  return {
    left: dragPoint.value.x - dragOriginRect.value.width / 2,
    top: dragPoint.value.y - dragOriginRect.value.height / 2,
    width: dragOriginRect.value.width,
    height: dragOriginRect.value.height,
  };
}

function preparePendingPlay(source) {
  pendingPlay.value = {
    sourceId: source.sourceId,
    position: source.position,
    card: source.card,
    removeFromHand: source.removeFromHand,
  };
  resetPendingChoices();
}

function selectTargetPlayer(playerId) {
  if (!pendingPlay.value) {
    return;
  }

  const isSelectable = selectableTargetPlayerIds.value.includes(playerId);
  if (!isSelectable) {
    return;
  }

  selectedTargetPlayerId.value = playerId;
}

function selectGuess(rank) {
  if (!pendingPlay.value?.card.requiresGuess) {
    return;
  }

  selectedGuessRank.value = rank;
}

function confirmPendingPlay() {
  if (!canConfirmPendingPlay.value) {
    return;
  }

  const confirmedPlay = pendingPlay.value;
  discardCards.value = [
    ...discardCards.value.slice(-2),
    {
      ...confirmedPlay.card,
      id: `${confirmedPlay.card.id}-discard-${Date.now()}`,
      targetPlayerId: selectedTargetPlayerId.value,
      guessedRank: selectedGuessRank.value,
    },
  ];

  if (confirmedPlay.removeFromHand) {
    playerHandCards.value = playerHandCards.value.filter(
      (card) => card.id !== confirmedPlay.card.id,
    );
  }

  pendingPlay.value = null;
  activeSourceId.value = null;
  resetPendingChoices();
}

function cancelPendingPlay() {
  pendingPlay.value = null;
  activeSourceId.value = null;
  resetPendingChoices();
}

// 決定卡片出場時的初始傾斜角度。它根據卡片來自哪個方向，回傳不同的旋轉值。這個 function 是在幫不同位置出來的卡，設定比較合理的起始旋轉角度，讓動畫看起來不那麼呆板。
// 決定下一次抽牌要抽到哪一張卡。這個 function 是用來依序抽出下一張卡，並產生一個新的唯一 id，讓抽牌動畫和畫面更新正常運作。
function getNextDrawCard() {
  const template = drawDeck[drawIndex.value % drawDeck.length];
  drawIndex.value += 1;

  return {
    ...template,
    id: `${template.id}-${drawIndex.value}`,
  };
}

// 這個 function 會從牌庫抓一張牌，播放它飛進手牌的動畫，等卡片落地後再真的把它加入我方手牌。
async function playDrawAnimation() {
  if (isInteractionLocked.value || deckCount.value <= 0) {
    return;
  }

  const startRect = tableCardPilesRef.value?.getDeckRect?.();
  const targetRect = drawTargetRef.value?.getBoundingClientRect?.();

  if (!startRect || !targetRect) {
    return;
  }

  isDrawAnimating.value = true;
  activeDrawCard.value = getNextDrawCard();
  let didLand = false;
  deckCount.value = Math.max(deckCount.value - 1, 0);
  await nextTick();

  try {
    await cardDrawAnimationRef.value?.play({
      startRect,
      targetRect,
      onLanded: () => {
        didLand = true;
        playerHandCards.value = [
          ...playerHandCards.value,
          activeDrawCard.value,
        ];
      },
    });
  } finally {
    if (!didLand) {
      deckCount.value = Math.min(deckCount.value + 1, INITIAL_DECK_COUNT);
    }

    activeDrawCard.value = null;
    isDrawAnimating.value = false;
  }
}

async function playShuffleAnimation() {
  if (isInteractionLocked.value) {
    return;
  }

  const deckPose = tableCardPilesRef.value?.getDeckAnimationPose?.();
  if (!deckPose) {
    return;
  }

  isShuffleAnimating.value = true;

  try {
    await cardShuffleAnimationRef.value?.play({
      deckPose,
      deckCount: deckCount.value,
    });
  } finally {
    isShuffleAnimating.value = false;
  }
}

function handleHandPointerDown(card, event) {
  if (isInteractionLocked.value) {
    return;
  }

  const cardElement = event.currentTarget;
  if (!cardElement?.getBoundingClientRect) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  draggingCard.value = card;
  activeSourceId.value = card.id;
  dragOriginRect.value = cardElement.getBoundingClientRect();
  updateDragPreview({
    x: event.clientX,
    y: event.clientY,
  });

  pointerMoveHandler = (moveEvent) => {
    updateDragPreview({
      x: moveEvent.clientX,
      y: moveEvent.clientY,
    });
  };

  pointerUpHandler = (upEvent) => {
    updateDragPreview({
      x: upEvent.clientX,
      y: upEvent.clientY,
    });

    const shouldPlay = isOverPlayZone.value;
    const releaseRect = getDragReleaseRect();
    resetDragState();

    if (shouldPlay && releaseRect) {
      playCard({
        sourceId: card.id,
        position: "bottom",
        label: `Play ${card.name}`,
        card,
        faceUp: true,
        removeFromHand: true,
        originRect: releaseRect,
      });
      return;
    }

    activeSourceId.value = null;
  };

  window.addEventListener("pointermove", pointerMoveHandler, { passive: true });
  window.addEventListener("pointerup", pointerUpHandler);
  window.addEventListener("pointercancel", pointerUpHandler);

  if (typeof cardElement.setPointerCapture === "function") {
    try {
      cardElement.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is a best-effort improvement for drag continuity.
    }
  }
}

async function playCard(source) {
  if (
    isPlaying.value ||
    isDrawAnimating.value ||
    isShuffleAnimating.value ||
    pendingPlay.value
  ) {
    return;
  }

  await nextTick();

  const originEl = sourceElements.value[source.sourceId];
  const targetRect = tableCardPilesRef.value?.getDiscardRect?.();

  if ((!originEl && !source.originRect) || !targetRect) {
    return;
  }

  const originRect = source.originRect ?? originEl.getBoundingClientRect();
  isPlaying.value = true;
  activeSourceId.value = source.sourceId;

  try {
    const didPlay = await cardPlayAnimationRef.value?.play({
      card: source.card,
      originRect,
      targetRect,
      position: source.position,
      faceUp: source.faceUp,
    });

    if (didPlay && source.removeFromHand) {
      preparePendingPlay(source);
      return;
    }

    if (didPlay) {
      discardCards.value = [
        ...discardCards.value.slice(-2),
        {
          ...source.card,
          id: `${source.card.id}-discard-${Date.now()}`,
        },
      ];

      if (source.removeFromHand) {
        playerHandCards.value = playerHandCards.value.filter(
          (card) => card.id !== source.card.id,
        );
      }
    }
  } finally {
    activeSourceId.value = null;
    isPlaying.value = false;
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
  });
}

function playHandCard(card) {
  playCard({
    sourceId: card.id,
    position: "bottom",
    label: `我方出牌：${card.name}`,
    card,
    faceUp: true,
    removeFromHand: true,
  });
}

onUnmounted(() => {
  cardPlayAnimationRef.value?.stop?.();
  clearPointerListeners();
});
</script>

<template>
  <main
    class="cardplay-test"
    :style="{ backgroundImage: `url(${gameTableBackgroundUrl})` }"
  >
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
          :ref="(element) => setSourceElement(source.playerId, element)"
          type="button"
          :disabled="
            isPlaying ||
            isDrawAnimating ||
            isShuffleAnimating ||
            Boolean(draggingCard) ||
            Boolean(activeEffectResult)
          "
          @click="playOpponentCard(source)"
        >
          {{ source.label }}
        </button>
        <button
          type="button"
          :disabled="
            isPlaying ||
            isDrawAnimating ||
            isShuffleAnimating ||
            Boolean(draggingCard) ||
            Boolean(activeEffectResult)
          "
          @click="playShuffleAnimation"
        >
          {{ isShuffleAnimating ? "Shuffling" : "Shuffle" }}
        </button>
        <button
          type="button"
          :disabled="
            isPlaying ||
            isDrawAnimating ||
            isShuffleAnimating ||
            Boolean(draggingCard) ||
            Boolean(activeEffectResult)
          "
          @click="playDrawAnimation"
        >
          {{ isDrawAnimating ? "抽牌中" : "抽牌" }}
        </button>
        <button
          v-for="demo in effectDemos"
          :key="demo.key"
          type="button"
          :disabled="
            isPlaying ||
            isDrawAnimating ||
            isShuffleAnimating ||
            Boolean(draggingCard) ||
            Boolean(activeEffectResult)
          "
          @click="playEffectDemo(demo)"
        >
          {{ demo.label }}
        </button>
      </div>
    </section>

    <PlayerSeats ref="playerSeatsRef" :players="players" />

    <section class="cardplay-test__table-piles">
      <TableCardPiles
        ref="tableCardPilesRef"
        :deck-count="deckCount"
        :discard-cards="discardCards"
        :is-draw-disabled="
          isPlaying ||
          isDrawAnimating ||
          isShuffleAnimating ||
          Boolean(draggingCard) ||
          Boolean(activeEffectResult)
        "
        :is-deck-hidden="isShuffleAnimating"
        :is-drop-target-active="isPlaying || isOverPlayZone"
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
        :disabled="
          isPlaying ||
          isDrawAnimating ||
          isShuffleAnimating ||
          Boolean(activeEffectResult)
        "
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

      <div
        ref="drawTargetRef"
        class="cardplay-test__draw-target"
        aria-hidden="true"
      ></div>
    </section>

    <div
      v-if="draggingCard"
      class="cardplay-test__drag-preview"
      :class="{ 'cardplay-test__drag-preview--over': isOverPlayZone }"
      :style="dragPreviewStyle"
      aria-hidden="true"
    >
      <div
        class="cardplay-test__drag-preview-glow"
        :style="{ '--accent': draggingCard.color }"
      ></div>
      <GameCard
        :name="draggingCard.name"
        :background-url="draggingCard.backgroundUrl"
        :frame-url="draggingCard.frameUrl"
      />
    </div>

    <section
      v-if="pendingPlay"
      class="cardplay-test__pending-panel"
      aria-label="出牌確認"
    >
      <div class="cardplay-test__pending-summary">
        <span class="cardplay-test__pending-kicker">準備出牌</span>
        <strong>{{ pendingPlay.card.name }}</strong>
        <small>
          {{
            requiresTarget
              ? selectedTargetPlayer
                ? `目標：${selectedTargetPlayer.name}`
                : "請點選玩家頭像"
              : "此牌不需要指定目標"
          }}
        </small>
      </div>

      <div
        v-if="pendingPlay.card.requiresGuess"
        class="cardplay-test__guess-options"
        aria-label="選擇猜測牌名"
      >
        <button
          v-for="option in guessOptions"
          :key="option.rank"
          type="button"
          class="cardplay-test__guess-option"
          :class="{
            'cardplay-test__guess-option--selected':
              selectedGuessRank === option.rank,
          }"
          :aria-pressed="selectedGuessRank === option.rank"
          @click="selectGuess(option.rank)"
        >
          {{ option.rank }} · {{ option.name }}
        </button>
      </div>

      <p
        v-if="pendingPlay.card.requiresGuess"
        class="cardplay-test__pending-hint"
      >
        {{
          selectedGuessOption
            ? `猜測：${selectedGuessOption.name}`
            : "實習生不能猜實習生，請選擇 2-8 的牌。"
        }}
      </p>

      <div class="cardplay-test__pending-actions">
        <button type="button" @click="cancelPendingPlay">取消</button>
        <button
          type="button"
          class="cardplay-test__pending-confirm"
          :disabled="!canConfirmPendingPlay"
          @click="confirmPendingPlay"
        >
          確認出牌
        </button>
      </div>
    </section>

    <CardDrawAnimation ref="cardDrawAnimationRef" :card="activeDrawCard" />

    <CardShuffleAnimation ref="cardShuffleAnimationRef" />
    <CardPlayAnimation ref="cardPlayAnimationRef" />
    <InternAnimation
      :result="
        activeEffectResult?.type === 'intern' ? activeEffectResult : null
      "
      :get-player-hand-rect="getEffectPlayerHandRect"
      :get-discard-rect="tableCardPilesRef?.getDiscardRect"
      @complete="handleEffectComplete"
    />
    <CleanerAnimation
      :result="
        activeEffectResult?.type === 'cleaner' ? activeEffectResult : null
      "
      :get-player-hand-rect="getEffectPlayerHandRect"
      :is-self-player="(playerId) => playerId === 'player-bottom'"
      @complete="handleEffectComplete"
    />
    <ManagerAnimation
      :result="
        activeEffectResult?.type === 'manager' ? activeEffectResult : null
      "
      :get-player-hand-rect="getEffectPlayerHandRect"
      :get-discard-rect="tableCardPilesRef?.getDiscardRect"
      @complete="handleEffectComplete"
    />
    <PMAnimation
      :result="activeEffectResult?.type === 'pm' ? activeEffectResult : null"
      :get-player-hand-rect="getEffectPlayerHandRect"
      :get-discard-rect="tableCardPilesRef?.getDiscardRect"
      :get-deck-rect="tableCardPilesRef?.getDeckRect"
      :is-self-player="(playerId) => playerId === 'player-bottom'"
      @complete="handleEffectComplete"
    />
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
    radial-gradient(
      circle at 50% 42%,
      rgba(56, 189, 248, 0.14),
      transparent 28%
    ),
    radial-gradient(
      circle at 50% 62%,
      rgba(250, 204, 21, 0.1),
      transparent 34%
    ),
    linear-gradient(
      180deg,
      rgba(7, 17, 29, 0.72),
      rgba(7, 17, 29, 0.2) 48%,
      rgba(7, 17, 29, 0.74)
    );
}

.cardplay-test__target-backdrop {
  position: absolute;
  inset: 0;
  z-index: 42;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.42);
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
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
  transform: translateY(calc(var(--fan-lift) * 5px))
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
  filter: drop-shadow(0 0 15px var(--accent))
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
    radial-gradient(
      circle at 50% 50%,
      rgba(255, 255, 255, 0.34),
      transparent 36%
    ),
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

.cardplay-test__pending-panel {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 60;
  display: grid;
  gap: 12px;
  width: min(340px, calc(100vw - 36px));
  max-height: min(420px, calc(100dvh - 224px));
  overflow: auto;
  border: 1px solid rgba(250, 204, 21, 0.58);
  border-radius: var(--radius-md, 0);
  padding: 16px;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(7, 17, 29, 0.88)),
    rgba(7, 17, 29, 0.82);
  box-shadow:
    0 0 24px rgba(250, 204, 21, 0.16),
    0 22px 48px rgba(0, 0, 0, 0.46);
  backdrop-filter: blur(10px);
}

.cardplay-test__pending-summary {
  display: grid;
  gap: 4px;
}

.cardplay-test__pending-kicker {
  color: #facc15;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.cardplay-test__pending-summary strong {
  font-size: 24px;
  line-height: 1.05;
}

.cardplay-test__pending-summary small,
.cardplay-test__pending-hint {
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.35;
}

.cardplay-test__pending-hint {
  margin: 0;
}

.cardplay-test__guess-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.cardplay-test__guess-option,
.cardplay-test__pending-actions button {
  min-height: 38px;
  border: 1px solid rgba(148, 163, 184, 0.48);
  border-radius: var(--radius-md, 0);
  padding: 0 10px;
  cursor: pointer;
  background: rgba(15, 23, 42, 0.72);
  color: #f8fafc;
  font-size: 13px;
  font-weight: 900;
}

.cardplay-test__guess-option:hover,
.cardplay-test__guess-option--selected {
  border-color: rgba(250, 204, 21, 0.82);
  background: rgba(250, 204, 21, 0.16);
}

.cardplay-test__pending-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cardplay-test__pending-confirm {
  border-color: rgba(250, 204, 21, 0.72) !important;
  background: rgba(250, 204, 21, 0.18) !important;
}

.cardplay-test__pending-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
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

  .cardplay-test__player-hand {
    right: 12px;
    left: 12px;
  }

  .cardplay-test__table-piles {
    top: 44%;
  }
}
</style>
