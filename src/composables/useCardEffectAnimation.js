import { markRaw, ref, shallowRef } from 'vue'
import { gsap } from 'gsap'

function normalizeTargets(targets) {
  return (typeof targets === 'function' ? targets() : targets ?? []).filter(Boolean)
}

function isReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useCardEffectAnimation({
  emitComplete,
  reset,
  onStop,
} = {}) {
  const activeResult = ref(null)
  const activeId = ref(null)
  const timeline = shallowRef(null)

  function stop(killTargets = []) {
    timeline.value?.kill()
    timeline.value = null
    onStop?.()

    const targets = normalizeTargets(killTargets)
    if (targets.length > 0) {
      gsap.killTweensOf(targets)
    }
  }

  function begin(result, killTargets = []) {
    stop(killTargets)
    activeResult.value = result
    activeId.value = result?.id ?? null
  }

  function setTimeline(nextTimeline) {
    timeline.value = nextTimeline ? markRaw(nextTimeline) : null
    return nextTimeline
  }

  function isStale(result) {
    return activeId.value !== result?.id
  }

  function finish(result, killTargets = []) {
    stop(killTargets)
    activeResult.value = null
    activeId.value = null
    reset?.()
    emitComplete?.(result)
  }

  return {
    activeResult,
    activeId,
    timeline,
    begin,
    setTimeline,
    isStale,
    stop,
    finish,
    isReducedMotion,
  }
}

export { isReducedMotion }
