import { getScaleForHeight } from '@/composables/useGameAnimationRects'

const DEFAULT_TIMING = {
  travel: 0.46,
  compareTravel: 0.48,
  flip: 0.34,
  flash: 0.16,
  emphasis: 0.22,
}

const REDUCED_TIMING = {
  travel: 0.12,
  compareTravel: 0.12,
  flip: 0.12,
  flash: 0.08,
  emphasis: 0.08,
}

function getEase(reduced, ease) {
  return reduced ? 'none' : ease
}

export function getCardMotionTiming(reduced, overrides = {}) {
  return {
    ...(reduced ? REDUCED_TIMING : DEFAULT_TIMING),
    ...overrides,
  }
}

export function getShowcaseScale(cardHeight) {
  return Math.min(1.2, Math.max(1, window.innerHeight * 0.52 / cardHeight))
}

export function getMoveVars(translation, {
  scale,
  duration,
  reduced = false,
  ease = 'expo.out',
  extra = {},
} = {}) {
  return {
    x: translation.x,
    y: translation.y,
    ...(scale == null ? {} : { scale }),
    duration,
    ease: getEase(reduced, ease),
    ...extra,
  }
}

export function getMoveToCenterVars(translation, cardHeight, {
  duration,
  reduced = false,
} = {}) {
  return getMoveVars(translation, {
    scale: getShowcaseScale(cardHeight),
    duration,
    reduced,
    ease: 'expo.out',
  })
}

export function getReturnToOriginVars(scale, {
  duration,
  reduced = false,
} = {}) {
  return {
    x: 0,
    y: 0,
    scale,
    duration,
    ease: getEase(reduced, 'power3.in'),
  }
}

export function getDiscardVars(translation, discardRect, cardHeight, {
  duration,
  reduced = false,
} = {}) {
  return getMoveVars(translation, {
    scale: getScaleForHeight(discardRect, cardHeight),
    duration,
    reduced,
    ease: 'power3.in',
    extra: {
      rotation: 2,
      rotationX: 58,
    },
  })
}

export function getFlipVars(rotationY, duration) {
  return {
    rotationY,
    duration,
    ease: 'power2.inOut',
  }
}

export function getEmphasisVars(scale, {
  duration,
  reduced = false,
  ease = 'back.out(1.7)',
} = {}) {
  return {
    scale,
    duration,
    ...(!reduced && ease ? { ease } : {}),
  }
}
