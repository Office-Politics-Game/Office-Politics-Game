import pool from "../db/index.js"
import { createDeck } from "../game/gameDeck.js"
import { drawCardAction, playCardAction } from "./gameActionService.js"

const TARGET_REQUIRED_CARD_IDS = [1, 2, 3, 5, 6]
const ADVISOR_CARD_ID = 7
const PM_CARD_ID = 5
const HR_CARD_ID = 6
const CEO_CARD_ID = 8
const INTERN_CARD_NAME = "Intern"
const INTERN_GUESS_MIN_CARD_ID = 2
const INTERN_GUESS_MAX_CARD_ID = 8

const INTERN_GUESS_CARDS = Array.from(
    createDeck().reduce((cardsById, card) => {
        const cardId = Number(card.id)

        if (cardId < INTERN_GUESS_MIN_CARD_ID || cardId > INTERN_GUESS_MAX_CARD_ID) {
            return cardsById
        }

        const existingCard = cardsById.get(cardId)

        if (existingCard) {
            existingCard.count += 1
        } else {
            cardsById.set(cardId, {
                id: cardId,
                name: card.name,
                count: 1,
            })
        }

        return cardsById
    }, new Map()).values()
)

function createServiceError(message, statusCode = 400) {
    const error = new Error(message)
    error.statusCode = statusCode
    return error
}

async function getLatestGameSession(roomCode) {
    const sessionResult = await pool.query(
        `SELECT gs.*
         FROM game_sessions gs
         JOIN game_rooms gr ON gr.id = gs.room_id
         WHERE gr.room_code = $1
         ORDER BY gs.created_at DESC
         LIMIT 1`,
        [roomCode]
    )

    if (sessionResult.rows.length === 0) {
        throw createServiceError("Game session not found", 404)
    }

    return sessionResult.rows[0]
}

function getCurrentTurnPlayer(state) {
    const players = Array.isArray(state?.players) ? state.players : []

    return players.find((player) => {
        return Number(player.playerId) === Number(state.currentTurnPlayerId)
    }) ?? null
}

function getAliveTargets(state, sourcePlayerId, cardId) {
    const players = Array.isArray(state?.players) ? state.players : []

    return players.filter((player) => {
        if (player.isEliminated) {
            return false
        }

        if (Number(cardId) !== PM_CARD_ID && Number(player.playerId) === Number(sourcePlayerId)) {
            return false
        }

        return true
    })
}

function cardNeedsTarget(card) {
    return TARGET_REQUIRED_CARD_IDS.includes(Number(card?.id))
}

function obeysAdvisorRule(hand, card) {
    const hasAdvisor = hand.some((candidate) => Number(candidate.id) === ADVISOR_CARD_ID)
    const hasPmOrHr = hand.some((candidate) => {
        return [PM_CARD_ID, HR_CARD_ID].includes(Number(candidate.id))
    })

    if (!hasAdvisor || !hasPmOrHr) {
        return true
    }

    return Number(card.id) === ADVISOR_CARD_ID
}

function sortPlayableCards(cards) {
    return [...cards].sort((cardA, cardB) => {
        const rankA = Number(cardA.id)
        const rankB = Number(cardB.id)
        const adjustedRankA = rankA === CEO_CARD_ID ? Number.MAX_SAFE_INTEGER : rankA
        const adjustedRankB = rankB === CEO_CARD_ID ? Number.MAX_SAFE_INTEGER : rankB

        return adjustedRankA - adjustedRankB
    })
}

function chooseCardToPlay(state, player) {
    const hand = Array.isArray(player?.hand) ? player.hand : []
    const playableCards = sortPlayableCards(hand).filter((card) => {
        if (!obeysAdvisorRule(hand, card)) {
            return false
        }

        if (!cardNeedsTarget(card)) {
            return true
        }

        return getAliveTargets(state, player.playerId, card.id).length > 0
    })

    return playableCards[0] ?? null
}

function chooseTargetPlayerId(
    state,
    player,
    card,
    { random = Math.random } = {}
) {
    if (!cardNeedsTarget(card)) {
        return undefined
    }

    const targets = getAliveTargets(state, player.playerId, card.id)
    const randomIndex = Math.floor(random() * targets.length)
    const target = targets[randomIndex]

    return target?.playerId
}

function chooseInternGuessCardName(
    player,
    { random = Math.random } = {}
) {
    const hand = Array.isArray(player?.hand) ? player.hand : []
    const heldCardIds = new Set(hand.map((card) => Number(card.id)))
    const eligibleCards = INTERN_GUESS_CARDS.filter((card) => {
        return card.count > 1 || !heldCardIds.has(card.id)
    })
    const randomIndex = Math.floor(random() * eligibleCards.length)

    return eligibleCards[randomIndex]?.name
}

function buildPlayPayload(state, player, card, options = {}) {
    const payload = {
        roomCode: state.roomCode,
        playerId: Number(player.playerId),
        cardId: card.id,
        targetPlayerId: chooseTargetPlayerId(state, player, card, options),
        guessedCardName: undefined,
    }

    if (card.name === INTERN_CARD_NAME) {
        payload.guessedCardName = chooseInternGuessCardName(player, options)
    }

    return payload
}

async function runComputerTurn({ roomCode }) {
    let gameSession = await getLatestGameSession(roomCode)
    let state = gameSession.state_json
    let player = getCurrentTurnPlayer(state)

    if (!player?.isComputer || state.phase !== "playing") {
        return {
            didRun: false,
            reason: "not-computer-turn",
            state,
        }
    }

    const result = {
        didRun: true,
        playerId: Number(player.playerId),
        drawResult: null,
        playResult: null,
    }

    const hand = Array.isArray(player.hand) ? player.hand : []
    const deck = Array.isArray(state.deck) ? state.deck : []

    if (hand.length < 2 && deck.length > 0) {
        result.drawResult = await drawCardAction({
            roomCode,
            playerId: Number(player.playerId),
        })
        gameSession = await getLatestGameSession(roomCode)
        state = gameSession.state_json
        player = getCurrentTurnPlayer(state)
    }

    const card = chooseCardToPlay(state, player)

    if (!card) {
        return {
            ...result,
            state,
            reason: "no-playable-card",
        }
    }

    result.playResult = await playCardAction({
        ...buildPlayPayload({ ...state, roomCode }, player, card),
    })

    return {
        ...result,
        state: result.playResult.state,
    }
}

export {
    runComputerTurn,
    chooseCardToPlay,
    chooseTargetPlayerId,
    buildPlayPayload,
    getCurrentTurnPlayer,
}
