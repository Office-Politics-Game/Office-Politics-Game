import { endTurn } from "./turnService.js"
import { checkRoundEnd, checkWinner } from "./winnerService.js"
import { startNextRound } from "./roundService.js"

function createShowdownResult(state, winner){
    const alivePlayers = state.players.filter((player)=>{
        return !player.isEliminated
    })

    if (state.deck.length !== 0 || alivePlayers.length <= 1 || !winner){
        return null
    }

    return {
        reason: "deck-empty",
        winnerPlayerId: winner.playerId,
        players: alivePlayers.map((player)=>{
            return {
                playerId: player.playerId,
                card: player.hand[0] ? { ...player.hand[0] } : null,
            }
        }),
    }
}

function finishTurn(state, playerId){
    if (checkRoundEnd(state)){
        const winner = checkWinner(state)
        const showdownResult = createShowdownResult(state, winner)

        if (state.phase === "roundEnded"){
            startNextRound(state)
        }

        return { state, showdownResult }
    }

    endTurn(state, playerId)
    return { state, showdownResult: null }
}

export { finishTurn }
