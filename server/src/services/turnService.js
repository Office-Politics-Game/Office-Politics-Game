import { checkRoundEnd } from "./winnerService.js"

function findPlayerIndex(state, playerId){
    return state.players.findIndex((player)=>{
        return player.playerId === Number(playerId)
    })
}

function findNextPlayer(state, currentIndex){
    for(let i = 1; i <= state.players.length; i++){
        const nextIndex = (currentIndex + i) % state.players.length
        const nextPlayer = state.players[nextIndex]

        if (!nextPlayer.isEliminated){
            return nextPlayer
        }
    }

    return null
}

function endTurn(state, playerId){
    if (checkRoundEnd(state)){
        return state
    }

    const currentIndex = findPlayerIndex(state, playerId)

    if (currentIndex === -1){
        return state
    }

    const nextPlayer = findNextPlayer(state , currentIndex)

    if (!nextPlayer){
        return state
    }

    nextPlayer.isProtected = false
    state.currentTurnPlayerId = nextPlayer.playerId

    return state
}

export { endTurn }