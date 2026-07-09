import { verifyToken } from "./authService.js"

function formatProfile(player) {
  return {
    id: player.id,
    username: player.username,
    avatarId: player.avatarId,
    level: player.level,
    exp: player.exp,
    coins: player.coins,
    gems: player.gems,
    tickets: player.tickets,
    winCount: player.winCount,
    loseCount: player.loseCount,
    totalGames: player.totalGames,
    createdAt: player.createdAt,
  }
}

async function getCurrentProfile(token) {
  const player = await verifyToken(token)

  return formatProfile(player)
}

export { formatProfile, getCurrentProfile }
