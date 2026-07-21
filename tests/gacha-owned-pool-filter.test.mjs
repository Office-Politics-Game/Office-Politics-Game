import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("owned gacha cards are filtered by the current pool", async () => {
  const [viewSource, apiSource, controllerSource, serviceSource] = await Promise.all([
    readSource("src/views/GachaView.vue"),
    readSource("src/services/gachaApi.js"),
    readSource("server/src/controllers/gachaController.js"),
    readSource("server/src/services/gachaService.js"),
  ]);

  assert.match(viewSource, /const GACHA_POOL_CODE_BY_PAGE = \{[\s\S]*1: "role_cards"[\s\S]*2: "tarot_cards"/);
  assert.match(viewSource, /const currentGachaPoolId = computed/);
  assert.match(viewSource, /drawGacha\(\{[\s\S]*poolId: currentGachaPoolId\.value/);
  assert.match(viewSource, /getOwnedGachaCards\(\{[\s\S]*poolId: currentGachaPoolId\.value/);
  assert.match(viewSource, /const GACHA_CARD_NAME_BY_RANK = \{/);
  assert.match(viewSource, /!\//);
  assert.match(apiSource, /function getOwnedGachaCards\(\{ playerId, poolId = "role_cards" \}\)/);
  assert.match(controllerSource, /poolId: req\.query\.poolId \?\? "role_cards"/);
  assert.match(serviceSource, /FROM gacha_draw_logs gdl/);
  assert.match(serviceSource, /JOIN gacha_pool_cards gpc ON gpc\.pool_id = gp\.id/);
  assert.match(serviceSource, /AND gp\.code = \$2/);
});

test("tarot card pool uses separate card records in seed files", async () => {
  const sources = await Promise.all(
    [
      "server/src/db/seedCards.js",
      "server/src/db/gachaSetup.sql",
      "server/src/db/schema.sql",
    ].map(readSource),
  );

  sources.forEach((source) => {
    assert.match(source, /tarot_cards/);
    assert.match(source, /card_101/);
  });
});
