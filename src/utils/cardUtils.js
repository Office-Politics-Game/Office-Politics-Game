import {
  cardAssetKeyByEffect,
  cardAssetKeyByName,
  cardAssetKeyByRank,
  cardAssetsByKey,
} from '@/constants/cardAssets'

function inferAssetKeyFromText(value) {
  if (!value) {
    return null
  }

  const text = String(value).toLowerCase()

  return Object.entries(cardAssetKeyByName).find(([name]) => text.includes(name))?.[1] ?? null
}

function normalizeCard(rawCard = {}, fallbackIndex = 0) {
  const rawRank = Number(rawCard.rank ?? rawCard.cardRank ?? rawCard.id)
  const inferredAssetKeyFromName = inferAssetKeyFromText(rawCard.name)
  const fallbackRank = fallbackIndex + 1
  const rank = Number.isFinite(rawRank)
    ? rawRank
    : Number(Object.entries(cardAssetKeyByRank).find(
        ([, key]) => key === inferredAssetKeyFromName,
      )?.[0] ?? fallbackRank)
  const assetKey =
    rawCard.backgroundUrlKey ??
    rawCard.frameUrlKey ??
    rawCard.assetKey ??
    rawCard.cardKey ??
    inferredAssetKeyFromName ??
    cardAssetKeyByEffect[rawCard.effectKey] ??
    cardAssetKeyByRank[rank] ??
    inferAssetKeyFromText(rawCard.id) ??
    'intern'
  const assets = cardAssetsByKey[assetKey] ?? cardAssetsByKey.intern

  return {
    ...rawCard,
    id: String(rawCard.id ?? `${assetKey}-${fallbackIndex}`),
    name: rawCard.name ?? assets.name,
    type: rawCard.type ?? assets.type,
    rank: Number.isFinite(rank) ? rank : 1,
    effectKey: rawCard.effectKey ?? assets.effectKey,
    targetMode: rawCard.targetMode ?? assets.targetMode,
    requiresGuess: Boolean(rawCard.requiresGuess ?? assets.requiresGuess),
    backgroundUrl: rawCard.backgroundUrl ?? assets.backgroundUrl,
    frameUrl: rawCard.frameUrl ?? assets.frameUrl,
    color: rawCard.color ?? assets.color,
  }
}

export { normalizeCard }
