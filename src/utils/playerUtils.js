import {
  fallbackAvatars,
  playerAvatarById,
  playerAvatars,
} from '@/constants/playerAssets'

function isDirectAvatarUrl(value) {
  if (typeof value !== 'string') {
    return false
  }

  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return false
  }

  return (
    normalizedValue.startsWith('http://') ||
    normalizedValue.startsWith('https://') ||
    normalizedValue.startsWith('/') ||
    normalizedValue.startsWith('data:image/') ||
    normalizedValue.includes('/storage/v1/object/')
  )
}

function resolveAvatarUrl(value, index) {
  if (isDirectAvatarUrl(value)) {
    return value
  }

  return (
    playerAvatarById[value] ??
    playerAvatarById[String(value)] ??
    fallbackAvatars[index] ??
    playerAvatars[0]
  )
}

function normalizePlayerAvatar(player, index = 0) {
  if (!player || typeof player !== "object") {
    return player
  }

  return {
    ...player,
    avatarUrl:
      player.avatarUrl ||
      resolveAvatarUrl(player.avatarId ?? player.avatar_id, index),
  }
}

export { normalizePlayerAvatar, resolveAvatarUrl }
