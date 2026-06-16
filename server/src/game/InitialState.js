import { createDeck } from './Deck.js'

function createInitialGameState (players) {
    const deck = createDeck()
    // shuffleDeck() 洗牌

    const sortedPlayers = [...players].sort((a, b) => {
        return a.seat_order - b.seat_order
    })

    const gamePlayers = sortedPlayers.map((player)=>{
        const card = deck.shift() 

        return {
            playerId : player.player_id,
            username : player.username,
            seatOrder : player.seat_order,
            hand : [card],
            isProtected : false,
            isEliminated : false,
            discardedCards : []
        }
    })

    const randomIndex = Math.floor( Math.random() * gamePlayers.length )
    const currentTurnPlayerId = gamePlayers[randomIndex].playerId

    return {
        phase: "playing",
        deck,
        discardPile: [],
        currentTurnPlayerId,
        winnerPlayerId: null,
        players: gamePlayers,
    }
}

export { createInitialGameState }