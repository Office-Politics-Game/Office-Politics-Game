import { ref } from "vue";
import { MANAGER_EFFECT_ACK_BUFFER_MS } from "@/composables/useGameStageNotices";

export function useGameStageEffectAnimation({
  activeEffectResult = ref(null),
  holdNoticeAckAfterClose,
  resolveNoticeIdleIfIdle,
} = {}) {
  let effectAnimationResolve = null;
  let effectAnimationTimeout = null;
  let effectAnimationSequence = 0;

  function settleEffectAnimation(result, completed = false) {
    if (
      result &&
      activeEffectResult.value?.id &&
      activeEffectResult.value.id !== result.id
    ) {
      return;
    }

    if (effectAnimationTimeout) {
      window.clearTimeout(effectAnimationTimeout);
      effectAnimationTimeout = null;
    }

    const resolve = effectAnimationResolve;
    effectAnimationResolve = null;
    activeEffectResult.value = null;
    if (completed && result?.type === "manager") {
      holdNoticeAckAfterClose?.(MANAGER_EFFECT_ACK_BUFFER_MS);
    }
    resolve?.(completed);
    resolveNoticeIdleIfIdle?.();
  }

  function stopEffectAnimation() {
    settleEffectAnimation(null, false);
  }

  function playEffectAnimation(result) {
    if (!result?.type) {
      return Promise.resolve(false);
    }

    stopEffectAnimation();

    const nextResult = {
      ...result,
      id: result.id ?? `effect-${Date.now()}-${++effectAnimationSequence}`,
    };

    return new Promise((resolve) => {
      effectAnimationResolve = resolve;
      activeEffectResult.value = nextResult;

      effectAnimationTimeout = window.setTimeout(
        () => {
          settleEffectAnimation(nextResult, nextResult.type === "protection");
        },
        nextResult.type === "protection" ? 1000 : 8000,
      );
    });
  }

  function handleEffectAnimationComplete(result) {
    settleEffectAnimation(result, true);
  }

  return {
    activeEffectResult,
    playEffectAnimation,
    stopEffectAnimation,
    settleEffectAnimation,
    handleEffectAnimationComplete,
  };
}
