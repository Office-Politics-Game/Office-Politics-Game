import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("mall purchase buttons show progress and prevent duplicate purchases", async () => {
  const mallViewSource = await readSource("src/views/MallView.vue");
  const productCardSource = await readSource("src/components/mall/MallProductCard.vue");

  assert.match(mallViewSource, /const purchasingItemId = ref\(null\)/);
  assert.match(mallViewSource, /:purchasing="isPurchasing && purchasingItemId === item\.id"/);
  assert.match(mallViewSource, /:purchase-disabled="isPurchasing"/);
  assert.match(mallViewSource, /if \(isPurchasing\.value\) \{\s*return;\s*\}/);
  assert.match(mallViewSource, /purchasingItemId\.value = item\.id/);
  assert.match(mallViewSource, /purchasingItemId\.value = null/);

  assert.match(productCardSource, /purchasing \? "購買中\.\.\." : item\.actionLabel/);
  assert.match(productCardSource, /item\.actionState !== 'buy' \|\| purchaseDisabled/);
  assert.match(productCardSource, /:aria-busy="purchasing"/);
});
