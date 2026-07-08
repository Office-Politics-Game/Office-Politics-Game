import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const baseUrls = process.env.MALL_FRONTEND_URL
  ? [process.env.MALL_FRONTEND_URL]
  : ["http://127.0.0.1:5173", "http://localhost:5173"];
const playerId = process.env.TEST_PLAYER_ID;
const purchaseItemId = process.env.TEST_SHOP_ITEM_ID;
const shouldRunPurchase = process.env.RUN_SHOP_PURCHASE_TEST === "1";

async function assertFrontendShopApiContract() {
  const [shopApiSource, viteConfigSource] = await Promise.all([
    readFile(new URL("../src/services/shopApi.js", import.meta.url), "utf8"),
    readFile(new URL("../vite.config.js", import.meta.url), "utf8"),
  ]);

  assert.match(
    shopApiSource,
    /SHOP_API_PATH\s*=\s*["']\/shop["']/,
    "shopApi must use /shop because apiClient already prefixes /api",
  );
  assert.match(
    shopApiSource,
    /\/items/,
    "shopApi must expose the shop items endpoint",
  );
  assert.match(
    viteConfigSource,
    /["']\/api["']/,
    "Vite dev server must proxy /api for frontend integration testing",
  );
}

async function resolveBaseUrl() {
  const failures = [];

  for (const candidateBaseUrl of baseUrls) {
    const url = new URL("/", candidateBaseUrl);

    try {
      const response = await fetch(url, { method: "GET" });

      if (response.body) {
        await response.body.cancel();
      }

      return candidateBaseUrl;
    } catch (error) {
      failures.push(`${url.href} -> ${error.message}`);
    }
  }

  throw new Error(
    `無法連線到前端 dev server。已嘗試：${failures.join(" | ")}。請確認 Vite 是否真的跑在 5173，或用 MALL_FRONTEND_URL 指定正確網址。`,
  );
}

async function fetchJson(baseUrl, path, options = {}) {
  const url = new URL(path, baseUrl);
  let response;

  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error(
      `無法連線到 ${url.href}。請確認前端 dev server 與後端 server 都已啟動。原始錯誤：${error.message}`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const bodyText = await response.text();
  const body = contentType.includes("application/json")
    ? JSON.parse(bodyText)
    : bodyText;

  assert.ok(
    response.ok,
    `${url.href} should return 2xx, got ${response.status}: ${bodyText}`,
  );

  return body;
}

function assertShopItemShape(item) {
  assert.equal(typeof item.id, "number", "shop item id must be a number");
  assert.equal(typeof item.name, "string", "shop item name must be a string");
  assert.equal(typeof item.type, "string", "shop item type must be a string");
  assert.equal(typeof item.price, "number", "shop item price must be a number");
  assert.equal(
    typeof item.currency,
    "string",
    "shop item currency must be a string",
  );
  assert.ok(
    Object.hasOwn(item, "imageUrl"),
    "shop item must include imageUrl for MallView",
  );
}

await assertFrontendShopApiContract();

const baseUrl = await resolveBaseUrl();
const shopData = await fetchJson(baseUrl, "/api/shop/items?activeOnly=true");

assert.ok(
  Array.isArray(shopData.items),
  "GET /api/shop/items must return items array",
);
assert.ok(shopData.items.length > 0, "shop items array should not be empty");
assertShopItemShape(shopData.items[0]);

if (playerId) {
  const ownedData = await fetchJson(
    baseUrl,
    `/api/shop/players/${playerId}/items`,
  );

  assert.ok(
    Array.isArray(ownedData.items),
    "GET /api/shop/players/:playerId/items must return items array",
  );
}

if (shouldRunPurchase) {
  assert.ok(
    playerId && purchaseItemId,
    "RUN_SHOP_PURCHASE_TEST=1 requires TEST_PLAYER_ID and TEST_SHOP_ITEM_ID",
  );

  const purchaseData = await fetchJson(baseUrl, "/api/shop/purchase", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      playerId: Number(playerId),
      shopItemId: Number(purchaseItemId),
      quantity: 1,
    }),
  });

  assert.equal(
    purchaseData.playerItem?.shopItemId,
    Number(purchaseItemId),
    "purchase response must include the purchased playerItem",
  );
  assert.ok(
    purchaseData.currency,
    "purchase response must include updated currency",
  );
}

console.log(`mall API integration test passed via ${baseUrl}`);
