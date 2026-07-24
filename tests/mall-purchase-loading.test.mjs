import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("mall purchase buttons show progress and prevent duplicate purchases", async () => {
  const mallShopSource = await readSource("src/composables/useMallShop.js");
  const productGridSource = await readSource(
    "src/components/mall/MallProductGrid.vue",
  );
  const productCardSource = await readSource("src/components/mall/MallProductCard.vue");

  assert.match(mallShopSource, /const isPurchasing = ref\(false\)/);
  assert.match(
    mallShopSource,
    /item\.actionState !== "buy" \|\| isPurchasing\.value/,
  );
  assert.match(mallShopSource, /isPurchasing\.value = true/);
  assert.match(mallShopSource, /isPurchasing\.value = false/);
  assert.match(productGridSource, /:purchasing="purchasing"/);
  assert.match(productGridSource, /:purchase-disabled="purchasing"/);

  assert.match(productCardSource, /purchasing \? "購買中\.\.\." : item\.actionLabel/);
  assert.match(productCardSource, /item\.actionState !== 'buy' \|\| purchaseDisabled/);
  assert.match(productCardSource, /:aria-busy="purchasing"/);
});
