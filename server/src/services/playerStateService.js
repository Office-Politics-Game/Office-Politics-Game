function findPlayer(state, playerId) {
  return state.players.find((player) => player.playerId === playerId)
}

// 淘汰指定玩家
function killPlayer(state, playerId) {
  const player = findPlayer(state, playerId)

  if (!player) {
    return null
  }

  player.isEliminated = true
  return player
}

// 設定玩家免疫狀態
function protectPlayer(state, playerId) {
  const player = findPlayer(state, playerId)

  if (!player) {
    return null
  }

  player.isProtected = true
  return player
}

// 清除免疫狀態
function clearProtection(state) {
  state.players.forEach((player) => {
    player.isProtected = false
  })

  return state
}

export {
  findPlayer,
  killPlayer,
  protectPlayer,
  clearProtection
}
