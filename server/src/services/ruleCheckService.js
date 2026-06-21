const targetRequiredCardIds = [1, 2, 3, 5, 6]
const advisorCardId = 7
const pmCardId = 5
const hrCardId = 6

function createRuleError(message, statusCode = 400){
    const error = new Error(message)
    error.statusCode = statusCode
    return error
}

function findPlayer(state, playerId){
    return state.players.find((player)=>{
        return player.playerId === Number(playerId)
    })
}

function findCard(state, playerId, cardId){
    const player = findPlayer(state, playerId)

    if (!player){
        return null
    }

    return player.hand.find((card)=>{
        return card.id === Number(cardId)
    })
}

function checkTurn(state, playerId){
    if (state.currentTurnPlayerId !== Number(playerId)){
        throw createRuleError("尚未輪到此玩家")
    }
}

function checkPlayer(state, playerId){
    const player = findPlayer(state, playerId)

    if (!player){
        throw createRuleError("此玩家不在該局遊戲中", 403)
    }

    if (player.isEliminated){
        throw createRuleError("此玩家已出局")
    }

    return player
}

function checkCard(state, playerId, cardId){
    const card = findCard(state, playerId, cardId)

    if (!card){
        throw createRuleError("玩家沒有這張手牌")
    }

    return card
}

function checkTarget(state, playerId, cardId, targetPlayerId){
    const card = checkCard(state ,playerId, cardId)
    const needsTarget = targetRequiredCardIds.includes(Number(card.id))

    if (!needsTarget){
        return null
    }

    if (!targetPlayerId){
        throw createRuleError("需要指定目標玩家")
    }

    if (Number(targetPlayerId) === Number(playerId)){
        throw createRuleError("不能選擇自己作為目標")
    }

    const targetPlayer = findPlayer(state, targetPlayerId)

    if (!targetPlayer){
        throw createRuleError("目標玩家不存在，無法指定")
    }

    if (targetPlayer.isEliminated){
        throw createRuleError("目標玩家已出局，無法指定")
    }

    return targetPlayer
}

function checkProtected(state, targetPlayerId){
    if (!targetPlayerId){
        return
    }

    const targetPlayer = findPlayer(state, targetPlayerId)

    if (targetPlayer && targetPlayer.isProtected){
        throw createRuleError("目標玩家受到卡牌效果保護，免疫效果")
    }
}

function checkAdvisorRule(state, playerId, cardId){
    const player = checkPlayer(state, playerId)
    const hasAdvisor = player.hand.some((card)=>{
        return card.id === advisorCardId
    })
    const hasPmOrHr = player.hand.some((card)=>{
        return card.id === pmCardId || card.id === hrCardId
    })

    if (hasAdvisor && hasPmOrHr && Number(cardId) !== advisorCardId){
        throw createRuleError("同時持有資深顧問與人資主管或專案經理時，必須先打出資深顧問")
    }
}

export { 
    checkTurn, 
    checkPlayer, 
    checkCard, 
    checkTarget, 
    checkProtected, 
    checkAdvisorRule 
}