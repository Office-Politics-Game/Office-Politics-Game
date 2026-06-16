// 洗牌
function shuffleDeck(cards) {
  const shuffleDeck = [...cards]
  
  for (let curIndex = shuffleDeck.length-1; curIndex > 0; curIndex--){
    const ranIndex = Math.floor(
        Math.random() * ( curIndex + 1 )
    );
    [shuffleDeck[curIndex], shuffleDeck[ranIndex]] = [shuffleDeck[ranIndex], shuffleDeck[curIndex]]
  }
  return shuffleDeck
}

// 抽牌
function drawCard(deck) {
  if (deck.length === 0) {
    return null;
  }
  return deck.shift();
}

export {
  shuffleDeck,
  drawCard
};


