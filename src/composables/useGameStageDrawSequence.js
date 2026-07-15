import { computed, nextTick, ref } from "vue";

export function useGameStageDrawSequence({
  props,
  emit,
  playerHand,
  tableCardPilesRef,
  cardDrawAnimation,
  cardShuffleAnimation,
  animationRects,
  resolvedCurrentPlayerId,
  isExplicitCurrentPlayerTurn,
  isDrawAnimating = ref(false),
  activeDrawCard = ref(null),
  isInitialRoundDrawAnimating = ref(false),
  initialRoundDealtPlayerIds = ref([]),
  lastInitialRoundDealSignature = ref(null),
  playRoundStartNotice,
  playTurnNotice,
  waitForTutorialSettlement = () => Promise.resolve(false),
  resolveNoticeIdleIfIdle,
} = {}) {
  const initialRoundDealtPlayerIdSet = computed(
    () => new Set(initialRoundDealtPlayerIds.value),
  );

  const resolvedPlayerHandCardCounts = computed(() => {
    if (!isInitialRoundDrawAnimating.value) {
      return props.playerHandCardCounts;
    }

    return Object.fromEntries(
      props.players.map((player) => [
        player.id,
        initialRoundDealtPlayerIdSet.value.has(player.id)
          ? Number(props.playerHandCardCounts[player.id] ?? 0)
          : 0,
      ]),
    );
  });

  function isSelfDraw(playerId) {
    return !playerId || animationRects.isSelfPlayer(playerId);
  }

  function getInitialRoundDealSignature() {
    if (
      props.players.length === 0 ||
      props.discardCards.length > 0 ||
      props.handCards.length !== 1
    ) {
      return null;
    }

    const handCounts = props.players.map((player) =>
      Number(props.playerHandCardCounts[player.id] ?? 0),
    );

    if (handCounts.some((count) => count !== 1)) {
      return null;
    }

    return props.players
      .map(
        (player) =>
          `${player.id}:${player.roundWins}:${props.playerHandCardCounts[player.id]}`,
      )
      .join("|");
  }

  function getInitialRoundDealCard(playerId) {
    return animationRects.isSelfPlayer(playerId) ? props.handCards[0] : null;
  }

  async function playDrawAnimation(card, playerId = null) {
    if (isDrawAnimating.value) {
      return false;
    }

    const activeDrawPlayerId =
      playerId ?? props.drawPlayerId ?? resolvedCurrentPlayerId.value;
    const shouldDrawSelf = isSelfDraw(activeDrawPlayerId);

    if (shouldDrawSelf && !card) {
      return false;
    }

    isDrawAnimating.value = true;
    activeDrawCard.value = card ? { ...card } : null;

    if (shouldDrawSelf) {
      playerHand.value?.prepareDrawTarget();
    }

    await nextTick();

    const startRect = animationRects.getDrawRect("source");
    const targetRect = shouldDrawSelf
      ? animationRects.getDrawRect("target")
      : animationRects.getDrawRect("target", activeDrawPlayerId);

    if (!startRect || !targetRect) {
      playerHand.value?.finishDraw();
      activeDrawCard.value = null;
      isDrawAnimating.value = false;
      return false;
    }

    try {
      if (shouldDrawSelf) {
        await cardDrawAnimation.value?.selfDraw({
          startRect,
          targetRect,
        });
      } else {
        await cardDrawAnimation.value?.othersDraw({
          startRect,
          targetRect,
        });
      }
      await nextTick();
      return true;
    } finally {
      playerHand.value?.finishDraw();
      activeDrawCard.value = null;
      isDrawAnimating.value = false;
    }
  }

  async function playInitialRoundDrawSequence(signature) {
    if (!signature || isInitialRoundDrawAnimating.value) {
      return;
    }

    isInitialRoundDrawAnimating.value = true;
    initialRoundDealtPlayerIds.value = [];
    await nextTick();

    try {
      const deckPose = tableCardPilesRef.value?.getDeckAnimationPose?.();

      if (deckPose) {
        await cardShuffleAnimation.value?.play({
          deckPose,
          deckCount: Number(props.deckCount) || 0,
        });
      }

      for (const player of props.players) {
        const didDraw = await playDrawAnimation(
          getInitialRoundDealCard(player.id),
          player.id,
        );

        initialRoundDealtPlayerIds.value = [
          ...new Set([...initialRoundDealtPlayerIds.value, player.id]),
        ];

        if (!didDraw) {
          await nextTick();
        }
      }
    } finally {
      initialRoundDealtPlayerIds.value = props.players.map(
        (player) => player.id,
      );
      isInitialRoundDrawAnimating.value = false;

      await waitForTutorialSettlement();
      await playRoundStartNotice(signature);

      if (isExplicitCurrentPlayerTurn.value) {
        playTurnNotice({ force: true });
      }

      emit("round-sequence-complete");
      resolveNoticeIdleIfIdle();
    }
  }

  return {
    isDrawAnimating,
    activeDrawCard,
    isInitialRoundDrawAnimating,
    initialRoundDealtPlayerIds,
    lastInitialRoundDealSignature,
    initialRoundDealtPlayerIdSet,
    resolvedPlayerHandCardCounts,
    getInitialRoundDealSignature,
    playInitialRoundDrawSequence,
    playDrawAnimation,
  };
}
