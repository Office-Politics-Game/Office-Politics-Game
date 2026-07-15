import { computed, nextTick, ref } from "vue";

const DRAG_THRESHOLD_PX = 6;

function getCardName(card) {
  return String(card?.name ?? "")
    .trim()
    .toLowerCase();
}

function getCardRank(card) {
  return Number(card?.rank ?? card?.cardRank ?? card?.value);
}

function isAdvisorCard(card) {
  return (
    getCardRank(card) === 7 ||
    ["advisor", "adviser"].includes(getCardName(card))
  );
}

function isPmOrHrCard(card) {
  const cardName = getCardName(card);

  return (
    getCardRank(card) === 5 ||
    getCardRank(card) === 6 ||
    cardName === "pm" ||
    cardName === "hr"
  );
}

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

export function useGameStageCardPlay({
  props,
  emit,
  animationRects,
  cardPlayAnimation,
  isInitialRoundDrawAnimating,
  initialRoundDealtPlayerIdSet,
  resolvedCurrentPlayerId,
  isCurrentPlayerTurn,
  isDrawAnimating,
  activeEffectResult,
} = {}) {
  const activeCard = ref(null);
  const originRect = ref(null);
  const dragPoint = ref(null);
  const playZoneRect = ref(null);
  const discardRect = ref(null);
  const draggingCardId = ref(null);
  const isDragging = ref(false);
  const isOverPlayZone = ref(false);
  const locallyHiddenPlayedCardIds = ref([]);
  const pendingPlay = ref(null);
  const stagedDiscardCard = ref(null);
  const selectedTargetPlayerId = ref(null);
  const selectedGuessRank = ref(null);
  const inspectedCard = ref(null);

  let gestureCard = null;
  let gestureSource = "hand";
  let gestureOriginRect = null;
  let gestureStartPoint = null;

  let pointerMoveHandler = null;
  let pointerUpHandler = null;
  const hiddenPlayedCardTimers = new Map();

  const hasActivePlay = computed(() =>
    Boolean(activeCard.value && originRect.value),
  );

  const pendingTargetMode = computed(
    () => pendingPlay.value?.card.targetMode ?? "none",
  );
  const pendingRequiresTarget = computed(
    () =>
      pendingTargetMode.value === "opponent" ||
      pendingTargetMode.value === "anyPlayer",
  );
  const pendingRequiresGuess = computed(() =>
    Boolean(pendingPlay.value?.card.requiresGuess),
  );
  const isPendingTargetSelectionActive = computed(
    () =>
      pendingRequiresTarget.value &&
      !selectedTargetPlayerId.value,
  );
  const isPendingPlayPanelVisible = computed(
    () =>
      Boolean(pendingPlay.value) &&
      (!pendingRequiresTarget.value ||
        Boolean(selectedTargetPlayerId.value)),
  );
  const selectableTargetPlayerIds = computed(() => {
    if (!pendingRequiresTarget.value) {
      return [];
    }

    return props.players
      .filter((player) => {
        if (pendingTargetMode.value === "opponent") {
          return !player.isCurrentPlayer;
        }

        return true;
      })
      .map((player) => player.id);
  });
  const visibleHandCards = computed(() => {
    if (
      isInitialRoundDrawAnimating.value &&
      resolvedCurrentPlayerId.value &&
      !initialRoundDealtPlayerIdSet.value.has(
        String(resolvedCurrentPlayerId.value),
      )
    ) {
      return [];
    }

    const pendingCardId = pendingPlay.value?.card?.id;
    const hiddenCardIds = new Set(locallyHiddenPlayedCardIds.value);
    const cards = pendingCardId
      ? props.handCards.filter((card) => card.id !== pendingCardId)
      : props.handCards;

    return cards.filter((card) => !hiddenCardIds.has(card.id));
  });
  const advisorRuleDisabledCardIds = computed(() => {
    const hasAdvisor = visibleHandCards.value.some(isAdvisorCard);
    const hasPmOrHr = visibleHandCards.value.some(isPmOrHrCard);

    if (!hasAdvisor || !hasPmOrHr) {
      return [];
    }

    return visibleHandCards.value
      .filter((card) => !isAdvisorCard(card))
      .map((card) => card.id);
  });
  const visibleDiscardCards = computed(() => {
    const pendingCard = pendingPlay.value?.card;
    const temporaryTopCard = stagedDiscardCard.value ?? pendingCard;

    if (
      !temporaryTopCard ||
      (!stagedDiscardCard.value &&
        props.discardCards.some((card) => card.id === temporaryTopCard.id))
    ) {
      return props.discardCards;
    }

    return [...props.discardCards, temporaryTopCard];
  });
  const selectedTargetPlayer = computed(
    () =>
      props.players.find(
        (player) => player.id === selectedTargetPlayerId.value,
      ) ?? null,
  );
  const canConfirmPendingPlay = computed(() => {
    if (!pendingPlay.value) {
      return false;
    }

    if (pendingRequiresTarget.value && !selectedTargetPlayerId.value) {
      return false;
    }

    if (pendingRequiresGuess.value && !selectedGuessRank.value) {
      return false;
    }

    return true;
  });
  const isHandDrawRequired = computed(() => props.canDraw);
  const isPlayInteractionLocked = computed(
    () =>
      props.isLoading ||
      isInitialRoundDrawAnimating.value ||
      !isCurrentPlayerTurn.value ||
      Boolean(activeCard.value) ||
      Boolean(pendingPlay.value) ||
      isDrawAnimating.value ||
      Boolean(activeEffectResult.value),
  );
  const isHandPlayInteractionLocked = computed(
    () => isPlayInteractionLocked.value || isHandDrawRequired.value,
  );
  const isDeckDrawDisabled = computed(
    () => isPlayInteractionLocked.value || !props.canDraw,
  );
  const handDisabledMessage = computed(() =>
    isHandDrawRequired.value ? "請先抽下一張牌" : "",
  );
  const deckBlockedMessage = computed(() =>
    !isCurrentPlayerTurn.value ? "還沒輪到你" : "",
  );
  const dragPreviewStyle = computed(() => {
    if (
      !hasActivePlay.value ||
      !originRect.value ||
      !dragPoint.value ||
      !isDragging.value
    ) {
      return { display: "none" };
    }

    const translateX =
      dragPoint.value.x - (originRect.value.left + originRect.value.width / 2);
    const translateY =
      dragPoint.value.y - (originRect.value.top + originRect.value.height / 2);

    return {
      ...animationRects.rectToFixedStyle(originRect.value),
      transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${isOverPlayZone.value ? 1.06 : 1})`,
    };
  });

  function requestDraw() {
    if (isPlayInteractionLocked.value || !props.canDraw) {
      return;
    }

    emit("draw-request");
  }

  function refreshDiscardRect() {
    discardRect.value = animationRects.getPlayRect("discard");
  }

  function refreshPlayZoneRect() {
    playZoneRect.value = animationRects.getPlayRect("zone");
  }

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

  function resetInteraction() {
    clearPointerListeners();
    activeCard.value = null;
    originRect.value = null;
    dragPoint.value = null;
    playZoneRect.value = null;
    discardRect.value = null;
    draggingCardId.value = null;
    isDragging.value = false;
    isOverPlayZone.value = false;
    gestureCard = null;
    gestureSource = "hand";
    gestureOriginRect = null;
    gestureStartPoint = null;
  }

  function resetPendingChoices() {
    selectedTargetPlayerId.value = null;
    selectedGuessRank.value = null;
  }

  function preparePendingPlay(card) {
    inspectedCard.value = null;
    pendingPlay.value = { card };
    resetPendingChoices();
  }

  function cardRequiresPlayChoices(card) {
    return (
      card?.targetMode === "opponent" ||
      card?.targetMode === "anyPlayer" ||
      Boolean(card?.requiresGuess)
    );
  }

  function clearHiddenPlayedCard(cardId) {
    const timer = hiddenPlayedCardTimers.get(cardId);

    if (timer) {
      window.clearTimeout(timer);
      hiddenPlayedCardTimers.delete(cardId);
    }

    locallyHiddenPlayedCardIds.value = locallyHiddenPlayedCardIds.value.filter(
      (hiddenCardId) => hiddenCardId !== cardId,
    );
  }

  function hideSubmittedCard(cardId) {
    if (!cardId || locallyHiddenPlayedCardIds.value.includes(cardId)) {
      return;
    }

    locallyHiddenPlayedCardIds.value = [
      ...locallyHiddenPlayedCardIds.value,
      cardId,
    ];

    const timer = window.setTimeout(() => {
      clearHiddenPlayedCard(cardId);
    }, 5000);

    hiddenPlayedCardTimers.set(cardId, timer);
  }

  function emitPlayCard(card, targetPlayerId = null, guessedRank = null) {
    hideSubmittedCard(card.id);

    emit("play-card", {
      card,
      cardId: card.id,
      cardRank: card.rank,
      effectKey: card.effectKey,
      targetPlayerId,
      guessedRank,
    });
  }

  function setStagedDiscardCard(card) {
    if (!card) {
      return false;
    }

    stagedDiscardCard.value = card;
    return true;
  }

  async function stageDiscardedCard(card) {
    if (!setStagedDiscardCard(card)) {
      return false;
    }

    await nextTick();
    return true;
  }

  function clearStagedDiscardCard() {
    stagedDiscardCard.value = null;
  }

  function selectTargetPlayer(playerId) {
    if (!selectableTargetPlayerIds.value.includes(playerId)) {
      return;
    }

    selectedTargetPlayerId.value = playerId;
  }

  function selectGuessRank(rank) {
    if (!pendingRequiresGuess.value) {
      return;
    }

    selectedGuessRank.value = rank;
  }

  function confirmPendingPlay() {
    if (!canConfirmPendingPlay.value) {
      return;
    }

    const playedCard = pendingPlay.value.card;

    setStagedDiscardCard(playedCard);
    emitPlayCard(
      playedCard,
      selectedTargetPlayerId.value,
      selectedGuessRank.value,
    );

    pendingPlay.value = null;
    resetPendingChoices();
  }

  function cancelPendingPlay() {
    pendingPlay.value = null;
    resetPendingChoices();
  }

  function getDragReleaseRect() {
    if (!originRect.value || !dragPoint.value) {
      return null;
    }

    return animationRects.createPointCenteredRect(
      dragPoint.value,
      originRect.value,
    );
  }

  async function playActiveCard() {
    const card = activeCard.value;
    const releaseRect = getDragReleaseRect();
    refreshDiscardRect();

    if (!card || !releaseRect || !discardRect.value) {
      resetInteraction();
      return;
    }

    const targetRect = discardRect.value;

    try {
      const didPlay = await cardPlayAnimation.value?.play({
        card,
        originRect: releaseRect,
        targetRect,
        position: "bottom",
        faceUp: true,
      });

      if (didPlay) {
        inspectedCard.value = null;

        if (!cardRequiresPlayChoices(card)) {
          await stageDiscardedCard(card);
        }
        if (cardRequiresPlayChoices(card)) {
          preparePendingPlay(card);
        } else {
          emitPlayCard(card);
        }
      }
    } finally {
      resetInteraction();
    }
  }

  function handleWindowPointerMove(event) {
    if (!gestureCard || !gestureStartPoint) {
      return;
    }

    if (!isDragging.value) {
      const distance = Math.hypot(
        event.clientX - gestureStartPoint.x,
        event.clientY - gestureStartPoint.y,
      );

      if (distance <= DRAG_THRESHOLD_PX || !canDragCard(gestureCard)) {
        return;
      }

      activeCard.value = gestureCard;
      originRect.value = gestureOriginRect;
      draggingCardId.value =
        gestureSource === "hand" ? gestureCard.id : null;
      isDragging.value = true;
    }

    dragPoint.value = {
      x: event.clientX,
      y: event.clientY,
    };

    refreshPlayZoneRect();
    isOverPlayZone.value = pointInsideRect(dragPoint.value, playZoneRect.value);
  }

  function handleWindowPointerUp(event) {
    if (!gestureCard || !gestureStartPoint) {
      return;
    }

    const releasedCard = gestureCard;
    const releasedSource = gestureSource;
    const distance = Math.hypot(
      event.clientX - gestureStartPoint.x,
      event.clientY - gestureStartPoint.y,
    );

    if (!isDragging.value) {
      clearPointerListeners();
      gestureCard = null;
      gestureOriginRect = null;
      gestureStartPoint = null;

      if (distance <= DRAG_THRESHOLD_PX) {
        inspectedCard.value =
          releasedSource === "inspection" ? null : releasedCard;
      }

      return;
    }

    dragPoint.value = {
      x: event.clientX,
      y: event.clientY,
    };

    refreshPlayZoneRect();
    isOverPlayZone.value = pointInsideRect(dragPoint.value, playZoneRect.value);
    isDragging.value = false;
    clearPointerListeners();

    if (isOverPlayZone.value) {
      playActiveCard();
      return;
    }

    resetInteraction();
  }

  function canDragCard(card) {
    return (
      !isHandPlayInteractionLocked.value &&
      !advisorRuleDisabledCardIds.value.includes(card.id)
    );
  }

  function handleCardPointerDown(card, event, source = "hand") {
    if (gestureCard || isDragging.value) return;
    const cardElement = event.currentTarget;
    const cardRect = animationRects.getCardElementRect(cardElement);

    if (!cardRect) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    gestureCard = card;
    gestureSource = source;
    gestureOriginRect = cardRect;
    gestureStartPoint = {
      x: event.clientX,
      y: event.clientY,
    };

    pointerMoveHandler = handleWindowPointerMove;
    pointerUpHandler = handleWindowPointerUp;
    window.addEventListener("pointermove", pointerMoveHandler, {
      passive: true,
    });
    window.addEventListener("pointerup", pointerUpHandler);
    window.addEventListener("pointercancel", pointerUpHandler);

    if (typeof cardElement.setPointerCapture === "function") {
      try {
        cardElement.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is a best-effort improvement only.
      }
    }
  }

  async function playRemoteCardPlayAnimation(action) {
    const playerId = action?.playerId;
    const card = action?.discardedCard;

    if (!playerId || !card || animationRects.isSelfPlayer(playerId)) {
      return false;
    }

    const player = props.players.find(
      (candidate) => String(candidate.id) === String(playerId),
    );
    const originRect = animationRects.getPlayerHandRect(playerId);
    const targetRect = animationRects.getDiscardRect();

    if (!originRect || !targetRect) {
      return false;
    }

    return Boolean(
      await cardPlayAnimation.value?.play({
        card,
        originRect,
        targetRect,
        position: player?.position ?? "top",
        faceUp: false,
      }),
    );
  }

  function cleanupCardPlay() {
    clearPointerListeners();
    inspectedCard.value = null;
    clearStagedDiscardCard();
    hiddenPlayedCardTimers.forEach((timer) => window.clearTimeout(timer));
    hiddenPlayedCardTimers.clear();
  }

  function pruneHiddenPlayedCards(cardIds) {
    const handCardIdSet = new Set(cardIds);

    if (
      inspectedCard.value &&
      !handCardIdSet.has(inspectedCard.value.id)
    ) {
      inspectedCard.value = null;
    }

    locallyHiddenPlayedCardIds.value
      .filter((cardId) => !handCardIdSet.has(cardId))
      .forEach(clearHiddenPlayedCard);
  }

  return {
    activeCard,
    draggingCardId,
    isDragging,
    isOverPlayZone,
    pendingPlay,
    selectedTargetPlayerId,
    selectedGuessRank,
    inspectedCard,
    hasActivePlay,
    pendingRequiresTarget,
    pendingRequiresGuess,
    isPendingTargetSelectionActive,
    isPendingPlayPanelVisible,
    selectableTargetPlayerIds,
    visibleHandCards,
    advisorRuleDisabledCardIds,
    visibleDiscardCards,
    selectedTargetPlayer,
    canConfirmPendingPlay,
    isHandDrawRequired,
    isPlayInteractionLocked,
    isDeckDrawDisabled,
    handDisabledMessage,
    deckBlockedMessage,
    dragPreviewStyle,
    requestDraw,
    selectTargetPlayer,
    selectGuessRank,
    confirmPendingPlay,
    cancelPendingPlay,
    handleCardPointerDown,
    playRemoteCardPlayAnimation,
    stageDiscardedCard,
    clearStagedDiscardCard,
    cleanupCardPlay,
    pruneHiddenPlayedCards,
  };
}
