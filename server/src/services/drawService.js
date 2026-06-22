//牌庫拿牌
function takeDeckCard(state) {
    if (!Array.isArray(state.deck) || state.deck.length === 0) {
        return null
    }
    const randomIndex = Math.floor(Math.random() * state.deck.length)
    const card = state.deck.splice(randomIndex, 1)[0]
    return card
}

//把牌放進玩家手牌
function addHandCard(player, card) {
    if (!player || !card) {
        return false
    }
    if (!Array.isArray(player.hand)) {
        player.hand = []
    }
    player.hand.push(card)
    return true
}

//整個抽牌流程
function drawCard({ state, playerId }) {
    const players = Array.isArray(state.players) ? state.players : []
    const player = players.find((currentPlayer) => {
        return currentPlayer.playerId === Number(playerId)
    })
    if (!player) {
        return {
            success: false,
            message: "找不到玩家",
        }
    }
    if (state.currentTurnPlayerId !== Number(playerId)) {
        return {
            success: false,
            message: "還沒輪到這位玩家",
        }
    }
    const card = takeDeckCard(state)
    if (!card) {
        return {
            success: false,
            message: "牌庫沒有牌了",
        }
    }
    addHandCard(player, card)
    return {
        success: true,
        card,
        state,
    }
}

export { takeDeckCard, addHandCard, drawCard }