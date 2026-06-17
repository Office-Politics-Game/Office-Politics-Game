import { drawCard } from "./deckService.js";
import { discardCard } from "./discardService.js";

// 發初始手牌
function dealCards (deck, players, cardsPerPlayer){
    for(let round=0; round < cardsPerPlayer; round++){
        for(let playerIndex=0; playerIndex < players.length; playerIndex++){
            const card = drawCard(deck);
            players[playerIndex].hand.push(card)
        }
    }
    return {players, deck}
}

// 加入手牌
function addHandCard(player, card) {
    player.hand.push(card);
    return player;
}

// 移除手牌
function removeHandCard(player, cardId){
    const cardIndex = player.hand.findIndex((card) => card.id === cardId)
    if ( cardIndex === -1 ){
        return null
    }
    const removeCard = player.hand.splice(cardIndex, 1)
    return removeCard
}

// 指定玩家棄牌後重新抽牌
function replaceCard(player, cardId, discardPile, deck){
    const discardedCard = discardCard(player, cardId, discardPile)
    if (discardedCard === null) {
        return null
    }
    const newCard = drawCard(deck)
    if (newCard === null) {
        return null
    }
    addHandCard(player, newCard)
    return { discardedCard, newCard, player, deck, discardPile }
}

// 交換手牌
function swapHands(playerA, playerB){
    const temp = playerA.hand
    playerA.hand = playerB.hand
    playerB.hand = temp
    return {playerA, playerB}
}

export {
  dealCards,
  addHandCard,
  removeHandCard,
  replaceCard
};