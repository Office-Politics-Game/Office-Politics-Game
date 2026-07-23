import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("抽獎券可在商品明細輸入數量並送出", async () => {
  const modalSource = await readSource(
    "src/components/mall/MallProductDetailModal.vue",
  );
  const mallShopSource = await readSource("src/composables/useMallShop.js");

  assert.match(modalSource, /id="ticket-quantity"/);
  assert.match(modalSource, /v-model\.number="ticketQuantity"/);
  assert.match(modalSource, /TICKET_UNIT_PRICE = 100/);
  assert.match(
    modalSource,
    /emit\("purchase", isTicketItem\.value \? numericTicketQuantity\.value : 1\)/,
  );

  assert.match(
    mallShopSource,
    /if \(isGachaTicketItem\(item\) && quantity === null\) \{\s*openItemDetail\(item\)/,
  );
  assert.match(
    mallShopSource,
    /quantity: isGachaTicketItem\(item\) \? quantity : 1/,
  );
});

test("後端固定以每張 100 股票計算抽獎券價格", async () => {
  const shopServiceSource = await readSource(
    "server/src/services/shopService.js",
  );

  assert.match(shopServiceSource, /GACHA_TICKET_UNIT_PRICE = 100/);
  assert.match(
    shopServiceSource,
    /const totalPrice = unitPrice \* numericQuantity/,
  );
  assert.match(
    shopServiceSource,
    /tickets = tickets \+ \$2/,
  );
});
