import { discardCard } from "../src/services/discardService.js";

describe("discardCard", () => {
  test("出牌", () => {
    const player = {
      id: 1,
      hand: [{ id: 101, name: "加班" }],
    };
    const discardPile = [];
    const card = discardCard(player, 101, discardPile);
    expect(card).toEqual({ id: 101, name: "加班" });
    expect(player.hand).toHaveLength(0);
    expect(discardPile).toEqual([{ id: 101, name: "加班" }]);
  });

  test("玩家出牌後，會從手牌移除並加入棄牌堆與玩家棄牌紀錄", () => {
    const player1 = {
      hand : [
        { id: 2, name: "Cleaner" },
        { id: 1, name: "Intern" }
      ],
      discardedCards: []
    }
    const discardPile = []

    const card = discardCard(player1, 1, discardPile)

    expect(player1.hand).toEqual([{ id: 2, name: "Cleaner" }])
    expect(card).toEqual({ id: 1, name: "Intern" })
    expect(discardPile).toEqual([{ id: 1, name: "Intern" }])
    expect(player1.discardedCards).toEqual([{ id: 1, name: "Intern" }])
  })

  test("玩家沒有該手牌時，不會加入棄牌堆或玩家棄牌紀錄", () => {
    const player1 = {
      hand : [
        { id: 1, name: "Intern" }
      ],
      discardedCards: []
    }
    const discardPile = []

    const card = discardCard(player1, 100, discardPile)

    expect(player1.hand).toEqual([ { id: 1, name: "Intern" } ])
    expect(card).toBeNull()
    expect(discardPile).toEqual([])
    expect(player1.discardedCards).toEqual([])
  })
});