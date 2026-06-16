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
    player.hand.splice(cardIndex, 1)
    return player
}

export {
  dealCards,
  addHandCard,
  removeHandCard
};