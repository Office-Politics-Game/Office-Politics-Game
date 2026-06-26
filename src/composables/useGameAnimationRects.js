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

function getScaleForHeight(targetRect, cardHeight) {
  if (!targetRect || !Number.isFinite(cardHeight) || cardHeight <= 0) {
    return null
  }

  return targetRect.height / cardHeight
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

    if (playerId === getCurrentPlayerId()) {
      return playerHand?.value?.getHandRect?.() ?? null
    }

    return playerSeats?.value?.getHandTargetRect?.(playerId) ?? null
  }

  function getDeckRect() {
    return tableCardPiles?.value?.getDeckRect?.() ?? null
  }

  function getDiscardRect() {
    return tableCardPiles?.value?.getDiscardRect?.() ?? null
  }

  function isSelfPlayer(playerId) {
    return Boolean(playerId) && playerId === getCurrentPlayerId()
  }

  return {
    getPlayerHandRect,
    getDeckRect,
    getDiscardRect,
    getViewportCenter,
    getEffectCardHeight,
    getRectCenter,
    getTranslation,
    getViewportCenterTranslation,
    createFixedCardRect,
    rectToFixedStyle,
    getScaleForHeight,
    isSelfPlayer,
  }
}

export {
  createFixedCardRect,
  getEffectCardHeight,
  getRectCenter,
  getScaleForHeight,
  getTranslation,
  getViewportCenter,
  getViewportCenterTranslation,
  rectToFixedStyle,
}
