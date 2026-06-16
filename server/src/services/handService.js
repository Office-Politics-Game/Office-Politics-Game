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

export {
  dealCards
};