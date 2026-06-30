import playerOneUrl from '@/assets/images/player-1.png'
import playerTwoUrl from '@/assets/images/player-2.png'
import playerThreeUrl from '@/assets/images/player-3.png'
import playerFourUrl from '@/assets/images/player-4.png'

const playerAvatars = [
  playerOneUrl,
  playerTwoUrl,
  playerThreeUrl,
  playerFourUrl,
]

const fallbackAvatars = [
  playerTwoUrl,
  playerThreeUrl,
  playerFourUrl,
  playerOneUrl,
]

const playerAvatarById = {
  1: playerOneUrl,
  2: playerTwoUrl,
  3: playerThreeUrl,
  4: playerFourUrl,
  'player-1': playerOneUrl,
  'player-2': playerTwoUrl,
  'player-3': playerThreeUrl,
  'player-4': playerFourUrl,
}

export { fallbackAvatars, playerAvatarById, playerAvatars }
