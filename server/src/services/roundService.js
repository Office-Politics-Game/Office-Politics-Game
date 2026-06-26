import { createDeck } from "../game/gameDeck.js"
import { shuffleDeck } from "./deckService.js"

function startNextRound(state){
    if (state.phase !== "roundEnded"){
        return state
    }

    const deck = shuffleDeck(createDeck())
    const players = [...state.players].sort((playerA, playerB)=>{
        return playerA.seatOrder - playerB.seatOrder
    })

    players.forEach((player)=>{
        const card = deck.shift()

        player.hand = [card]
        player.isProtected = false
        player.isEliminated = false
        player.discardedCards = []
    })

    const randomIndex = Math.floor(Math.random() * players.length)
    const currentTurnPlayerId = players[randomIndex].playerId

    state.phase = "playing"
    state.deck = deck
    state.discardPile = []
    state.currentTurnPlayerId = currentTurnPlayerId
    state.roundWinnerPlayerId = null
    state.players = players

    return state
}

export { startNextRound }