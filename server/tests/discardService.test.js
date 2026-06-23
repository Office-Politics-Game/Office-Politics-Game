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
});