import {
  fallbackAvatars,
  playerAvatarById,
  playerAvatars,
} from '@/constants/playerAssets'

function resolveAvatarUrl(value, index) {
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
