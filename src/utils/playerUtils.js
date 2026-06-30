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

export { resolveAvatarUrl }
