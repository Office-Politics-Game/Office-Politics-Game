import { endTurn } from "./turnService.js"
import { checkRoundEnd, checkWinner } from "./winnerService.js"
import { startNextRound } from "./roundService.js"

function finishTurn(state, playerId){
    if (checkRoundEnd(state)){
        checkWinner(state)

        if (state.phase === "roundEnded"){
            startNextRound(state)
        }

        return state
    }

    endTurn(state, playerId)
    return state
}

export { finishTurn }