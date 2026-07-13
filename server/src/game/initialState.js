import { createDeck } from "./gameDeck.js"
import { shuffleDeck } from "../services/deckService.js"

function createInitialState (players){
    const deck = shuffleDeck(createDeck())

    const sortedPlayers = [...players].sort((a, b)=>{
        return a.seat_order - b.seat_order
    })

    const gamePlayers = sortedPlayers.map((player)=>{
        const card = deck.shift() 

        return {
            playerId: player.player_id,
            username: player.username,
            seatOrder: player.seat_order,
            isComputer: Boolean(player.is_computer),
            hand: [card],
            isProtected: false,
            isEliminated: false,
            discardedCards: [],
            roundWins: 0
        }
    })

    const randomIndex = Math.floor(Math.random() * gamePlayers.length)
    const currentTurnPlayerId = gamePlayers[randomIndex].playerId

    return {
        phase: "playing",
        deck,
        discardPile: [],
        currentTurnPlayerId,
        roundWinnerPlayerId: null,
        winnerPlayerId: null,
        players: gamePlayers,
    }
}

export { createInitialState }
