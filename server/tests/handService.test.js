import {dealCards, addHandCard, removeHandCard, replaceCard, swapHands} from "./handService.js";

describe("dealCards", () => {
  test("發初始手牌", () => {
    const deck = [
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 }
    ];
    const players = [
      {
        id: 1,
        hand: []
      },
      {
        id: 2,
        hand: []
      }
    ];
    dealCards(deck, players, 2);
    expect(players[0].hand.length).toBe(2);
    expect(players[1].hand.length).toBe(2);
    expect(deck.length).toBe(0);
  });
});

describe("addHandCard", () => {
  test("加入手牌", () => {
    const player = {
      id: 1,
      hand: []
    };
    const card = {
      id: 101,
      name: "加班"
    };
    addHandCard(player, card);
    expect(player.hand.length).toBe(1);
    expect(player.hand[0]).toEqual(card);
  });
});

describe("removeHandCard", () => {
  test("移除手牌", () => {
    const player = {
      id: 1,
      hand: [
        { id: 101, name: "加班" },
        { id: 102, name: "摸魚" }
      ]
    };
    const removedCard = removeHandCard(player, 102);
    expect(removedCard).toEqual({
      id: 102,
      name: "摸魚"
    });
    expect(player.hand).toHaveLength(1);
    expect(player.hand[0]).toEqual({
      id: 101,
      name: "加班"
    });
  });
});

describe("swapHands", () => {
  test("交換手牌", () => {
    const playerA = {
      id: 1,
      hand: [
        { id: 101, name: "加班" }
      ]
    };
    const playerB = {
      id: 2,
      hand: [
        { id: 102, name: "摸魚" }
      ]
    };
    swapHands(playerA, playerB);
    expect(playerA.hand).toEqual([
      { id: 102, name: "摸魚" }
    ]);
    expect(playerB.hand).toEqual([
      { id: 101, name: "加班" }
    ]);
  });
});

describe("replaceCard", () => {
  test("指定玩家棄牌後重新抽牌", () => {
    const player = {
      id: 1,
      hand: [{ id: 101, name: "加班" }],
    };
    const discardPile = [];
    const deck = [{ id: 201, name: "摸魚" }];
    const result = replaceCard(player, 101, discardPile, deck);
    expect(result.discardedCard).toEqual({ id: 101, name: "加班" });
    expect(result.newCard).toEqual({ id: 201, name: "摸魚" });
    expect(player.hand).toEqual([{ id: 201, name: "摸魚" }]);
    expect(discardPile).toEqual([{ id: 101, name: "加班" }]);
    expect(deck).toHaveLength(0);
  });
});