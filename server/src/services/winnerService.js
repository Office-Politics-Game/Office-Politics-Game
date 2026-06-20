const matchWinCount = 3

function getAlivePlayers(state){
    return state.players.filter((player)=>{
        return !player.isEliminated
    })
}

function getCardPoint(card){
    if (!card){
        return 0
    }

    return card.id
}

function checkRoundEnd(state){
    const alivePlayers = getAlivePlayers(state)

    return alivePlayers.length <= 1 || state.deck.length === 0
}

function checkWinner(state){
    if (!checkRoundEnd(state)){
        return null
    }

    const alivePlayers = getAlivePlayers(state)
    const roundWinner = [...alivePlayers].sort((playerA, playerB)=>{
        return getCardPoint(playerB.hand[0]) - getCardPoint(playerA.hand[0])
    })[0]

    if (!roundWinner){
        return null
    }

    roundWinner.roundWins = (roundWinner.roundWins || 0) +1

    if (roundWinner.roundWins >= matchWinCount){
        state.winnerPlayerId = roundWinner.playerId
        state.phase = "finished"
    } else {
        state.phase = "roundEnded"
    }

    return roundWinner
}

export {
  checkRoundEnd,
  checkWinner
}