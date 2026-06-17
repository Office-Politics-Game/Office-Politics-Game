import {shuffleDeck, drawCard} from "../src/services/deckService.js";

describe("shuffleDeck", () => {
  test("洗牌後牌數不變且內容完整", () => {
    const cards = [1, 2, 3, 4, 5];
    const shuffledDeck = shuffleDeck(cards);
    expect(shuffledDeck.length).toBe(5);
    expect(shuffledDeck).toEqual(expect.arrayContaining(cards));
    expect(cards).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("drawCard", () => {
  test("抽牌", () => {
    const deck = [{ id: 1, name: "加班" }];
    const card = drawCard(deck);
    expect(card).toEqual({ id: 1, name: "加班" });
    expect(deck).toHaveLength(0);
  });
});
