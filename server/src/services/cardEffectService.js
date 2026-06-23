import {findPlayer, protectPlayer, killPlayer} from "./playerStateService.js"
import {replaceCard, swapHands} from "./handService.js"

function findTargetPlayer(state, targetPlayerId) {
    const targetPlayer = findPlayer(state, targetPlayerId)
    if (!canTargetPlayer(targetPlayer)) {
        return null
    }
    return targetPlayer
}

function canTargetPlayer(player) {
    return player && !player.isEliminated && !player.isProtected
}

// 根據卡牌種類執行對應效果
function runCardEffect({
    state,
    card,
    playerId,
    targetPlayerId,
    guessedCardName,
}) {
    if (!card) {
        return null
    }
    switch (card.name) {
        case "Intern":
        return useIntern(state, targetPlayerId, guessedCardName)

        case "Cleaner":
        return useCleaner(state, targetPlayerId)

        case "Manager":
        return useManager(state, playerId, targetPlayerId)

        case "Senior":
        return useVeteran(state, playerId)

        case "PM":
        return usePm(state, targetPlayerId)

        case "HR":
        return useHr(state, playerId, targetPlayerId)

        default:
        return null
    }
}

// 實習生：猜測目標玩家手牌，猜中則淘汰
function useIntern(state, targetPlayerId, guessedCardName) {
    if (!checkGuess(guessedCardName)) {
        return null
    }
    const targetPlayer = findTargetPlayer(state, targetPlayerId)
    if (!targetPlayer) {
        return null
    }
    const targetCard = targetPlayer.hand[0]
    if (targetCard && targetCard.name === guessedCardName) {
        return killPlayer(state, targetPlayerId)
    }
    return targetPlayer
}

// 打掃阿姨：秘密觀看一名玩家手牌
function useCleaner(state, targetPlayerId) {
    const targetPlayer = findTargetPlayer(state, targetPlayerId)
    if (!targetPlayer) {
        return null
    }
    return targetPlayer.hand
}

// 部門主管：秘密比大小，點數小者淘汰
function useManager(state, playerId, targetPlayerId) {
    const player = findPlayer(state, playerId)
    const targetPlayer = findTargetPlayer(state, targetPlayerId)
    if (!player || !targetPlayer) {
        return null
    }
    const playerCard = player.hand[0]
    const targetCard = targetPlayer.hand[0]
    if (!playerCard || !targetCard) {
        return null
    }
    if (playerCard.id > targetCard.id) {
        return killPlayer(state, targetPlayerId)
    }
    if (playerCard.id < targetCard.id) {
         return killPlayer(state, playerId)
    }
    return null
}

// 職場老鳥：直到下個回合前免疫所有卡牌效果
function useVeteran(state, playerId) {
    return protectPlayer(state, playerId)
}

// 專案經理：指定一名玩家棄牌重抽
function usePm(state, targetPlayerId) {
    const targetPlayer = findTargetPlayer(state, targetPlayerId)
    if (!targetPlayer) {
        return null
    }
    const targetCard = targetPlayer.hand[0]
    if (!targetCard) {
        return null
    }
    const result = replaceCard(
        targetPlayer,
        targetCard.id,
        state.discardPile,
        state.deck
    )
    if (result) {
        useCeo(state, targetPlayerId, result.discardedCard)
    }
    return result
}

// 人資主管：與一名玩家秘密交換手牌
function useHr(state, playerId, targetPlayerId) {
    const player = findPlayer(state, playerId)
    const targetPlayer = findTargetPlayer(state, targetPlayerId)
    if (!player || !targetPlayer) {
        return null
    }
    return swapHands(player, targetPlayer)
}

// 執行長：被迫棄牌時直接淘汰
function useCeo(state, playerId, discardedCard) {
    if (discardedCard && discardedCard.name === "CEO") {
        return killPlayer(state, playerId)
    }
    return null
}

// 驗證實習生猜測是否合法，不能猜實習生
function checkGuess(guessedCardName) {
    return Boolean(guessedCardName) && guessedCardName !== "Intern"
}

export {
    runCardEffect,
    useIntern,
    useCleaner,
    useManager,
    useVeteran,
    usePm,
    useHr,
    useCeo,
    checkGuess
}
