function getRectCenter(rect) {
  if (!rect) {
    return null
  }

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

function getViewportCenter() {
  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  }
}

function getEffectCardHeight() {
  return Math.min(
    Math.max(window.innerHeight * 0.46, 220),
    360,
  )
}

function getTranslation(originRect, targetRect) {
  const originCenter = getRectCenter(originRect)
  const targetCenter = getRectCenter(targetRect)

  if (!originCenter || !targetCenter) {
    return null
  }

  return {
    x: targetCenter.x - originCenter.x,
    y: targetCenter.y - originCenter.y,
  }
}

function getElementRect(element) {
  return element?.getBoundingClientRect?.() ?? null
}

function getViewportCenterTranslation(originRect) {
  const originCenter = getRectCenter(originRect)

  if (!originCenter) {
    return null
  }

  const viewportCenter = getViewportCenter()

  return {
    x: viewportCenter.x - originCenter.x,
    y: viewportCenter.y - originCenter.y,
  }
}

function getRectCenteredOffset(originRect, targetRect) {
  if (!originRect || !targetRect) {
    return null
  }

  return {
    x: originRect.left + (originRect.width - targetRect.width) / 2,
    y: originRect.top + (originRect.height - targetRect.height) / 2,
  }
}

function createFixedCardRect(originRect, cardHeight) {
  const originCenter = getRectCenter(originRect)

  if (!originCenter || !Number.isFinite(cardHeight) || cardHeight <= 0) {
    return null
  }

  const width = cardHeight * 0.75

  return {
    left: originCenter.x - width / 2,
    top: originCenter.y - cardHeight / 2,
    width,
    height: cardHeight,
  }
}

function createPointCenteredRect(point, sizeRect) {
  if (!point || !sizeRect) {
    return null
  }

  return {
    left: point.x - sizeRect.width / 2,
    top: point.y - sizeRect.height / 2,
    width: sizeRect.width,
    height: sizeRect.height,
  }
}

function createEffectCardRect(originRect) {
  return createFixedCardRect(originRect, getEffectCardHeight())
}

function createFlyingCardRect(originRect) {
  if (!originRect) {
    return null
  }

  const height = Math.min(
    Math.max(originRect.height * 2.4, 220),
    Math.min(window.innerHeight * 0.62, 420),
  )

  return createFixedCardRect(originRect, height)
}

function rectToFixedStyle(rect) {
  if (!rect) {
    return { display: 'none' }
  }

  return {
    display: 'block',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  }
}

function deckPoseToFixedStyle(deckPose) {
  const rect = deckPose?.rect

  if (!rect) {
    return { display: 'none' }
  }

  const width = deckPose.width || rect.width
  const height = deckPose.height || rect.height

  return {
    display: 'block',
    left: `${rect.left + rect.width / 2 - width / 2}px`,
    top: `${rect.bottom - height}px`,
    width: `${width}px`,
    height: `${height}px`,
    transform: `perspective(${deckPose.transformPerspective || 900}px) rotateX(${deckPose.rotationX || 0}deg) rotateY(${deckPose.rotationY || 0}deg) rotateZ(${deckPose.rotationZ || 0}deg)`,
    transformOrigin: '50% 100%',
  }
}

function getScaleForHeight(targetRect, cardHeight) {
  if (!targetRect || !Number.isFinite(cardHeight) || cardHeight <= 0) {
    return null
  }

  return targetRect.height / cardHeight
}

function getCardFlightGeometry(originRect, targetRect) {
  const offset = getRectCenteredOffset(originRect, targetRect)

  if (!offset || !originRect || !targetRect) {
    return null
  }

  return {
    startX: offset.x,
    startY: offset.y,
    startScale: Math.min(
      originRect.width / targetRect.width,
      originRect.height / targetRect.height,
    ),
    endX: targetRect.left,
    endY: targetRect.top,
  }
}

export function useGameAnimationRects({
  playerHand,
  playerSeats,
  tableCardPiles,
  currentPlayerId,
} = {}) {
  function getCurrentPlayerId() {
    return typeof currentPlayerId === 'function'
      ? currentPlayerId()
      : currentPlayerId?.value ?? currentPlayerId ?? null
  }

  function getPlayerHandRect(playerId) {
    if (!playerId) {
      return null
    }

    if (String(playerId) === String(getCurrentPlayerId())) {
      return playerHand?.value?.getHandRect?.() ?? null
    }

    return playerSeats?.value?.getHandTargetRect?.(playerId) ?? null
  }

  function getDrawRect(kind, playerId = null) {
    if (kind === 'source') {
      return tableCardPiles?.value?.getDeckRect?.() ?? null
    }

    if (kind !== 'target') {
      return null
    }

    if (!playerId || isSelfPlayer(playerId)) {
      return playerHand?.value?.getDrawTargetRect?.() ?? null
    }

    return playerSeats?.value?.getHandTargetRect?.(playerId) ?? null
  }

  function getPlayRect(kind) {
    if (kind === 'discard') {
      return tableCardPiles?.value?.getDiscardRect?.() ?? null
    }

    if (kind === 'zone') {
      return tableCardPiles?.value?.getPlayZoneRect?.() ?? null
    }

    return null
  }

  function getDeckRect() {
    return getDrawRect('source')
  }

  function getDiscardRect() {
    return getPlayRect('discard')
  }

  function getPlayZoneRect() {
    return getPlayRect('zone')
  }

  function getDrawTargetRect(playerId) {
    return getDrawRect('target', playerId)
  }

  function getCardElementRect(element) {
    return getElementRect(element)
  }

  function isSelfPlayer(playerId) {
    return Boolean(playerId) && String(playerId) === String(getCurrentPlayerId())
  }

  return {
    getCardElementRect,
    getDrawRect,
    getPlayRect,
    getDrawTargetRect,
    getPlayerHandRect,
    getDeckRect,
    getDiscardRect,
    getPlayZoneRect,
    getViewportCenter,
    getEffectCardHeight,
    getRectCenter,
    getTranslation,
    getViewportCenterTranslation,
    getRectCenteredOffset,
    createFixedCardRect,
    createEffectCardRect,
    createFlyingCardRect,
    createPointCenteredRect,
    rectToFixedStyle,
    deckPoseToFixedStyle,
    getScaleForHeight,
    getCardFlightGeometry,
    isSelfPlayer,
  }
}

export {
  createEffectCardRect,
  createFixedCardRect,
  createFlyingCardRect,
  createPointCenteredRect,
  deckPoseToFixedStyle,
  getEffectCardHeight,
  getElementRect,
  getCardFlightGeometry,
  getRectCenter,
  getRectCenteredOffset,
  getScaleForHeight,
  getTranslation,
  getViewportCenter,
  getViewportCenterTranslation,
  rectToFixedStyle,
}
