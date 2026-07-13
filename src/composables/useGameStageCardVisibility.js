import { computed, unref } from "vue";

export function useGameStageCardVisibility({
  activeEffectResult,
  handCards,
  isSelfPlayer,
} = {}) {
  const activeCleanerAnimationResult = computed(() => {
    const result = unref(activeEffectResult);

    if (result?.type !== "cleaner") {
      return null;
    }

    if (result.targetCard || isSelfPlayer?.(result.targetPlayerId) !== true) {
      return result;
    }

    const targetCard = unref(handCards)?.[0] ?? null;

    return targetCard ? { ...result, targetCard } : result;
  });

  const temporarilyHiddenCardIds = computed(() => {
    const result = unref(activeEffectResult);
    const cleanerResult = activeCleanerAnimationResult.value;
    const shouldHideCleanerCard =
      cleanerResult?.revealCard === false &&
      isSelfPlayer?.(cleanerResult.targetPlayerId) === true;
    const shouldHideInternCard =
      result?.type === "intern" &&
      result.outcome === "correct" &&
      isSelfPlayer?.(result.targetPlayerId) === true;
    const shouldHidePmCard =
      result?.type === "pm" &&
      isSelfPlayer?.(result.targetPlayerId) === true;
    const targetCard = shouldHideCleanerCard
      ? cleanerResult.targetCard
      : shouldHideInternCard
        ? result.targetCard
        : shouldHidePmCard
          ? result.discardedCard
          : null;

    return targetCard?.id ? [String(targetCard.id)] : [];
  });

  const temporarilyHiddenSeatHandPlayerIds = computed(() => {
    const result = unref(activeEffectResult);
    const cleanerResult = activeCleanerAnimationResult.value;
    const targetPlayerId =
      cleanerResult?.targetPlayerId ??
      ((result?.type === "intern" && result.outcome === "correct") ||
      result?.type === "pm"
        ? result.targetPlayerId
        : null);

    if (!targetPlayerId || isSelfPlayer?.(targetPlayerId) === true) {
      return [];
    }

    return [String(targetPlayerId)];
  });

  return {
    activeCleanerAnimationResult,
    temporarilyHiddenCardIds,
    temporarilyHiddenSeatHandPlayerIds,
  };
}
