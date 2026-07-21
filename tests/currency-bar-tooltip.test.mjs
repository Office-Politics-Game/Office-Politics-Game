import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("currency bar supports bottom tooltip placement for the gacha page", async () => {
  const currencyBarSource = await readSource("src/components/common/CurrencyBar.vue");
  const gachaViewSource = await readSource("src/views/GachaView.vue");

  assert.match(currencyBarSource, /tooltipPlacement:/);
  assert.match(currencyBarSource, /default: "top"/);
  assert.match(currencyBarSource, /props\.tooltipPlacement === "bottom"[\s\S]*\? "top-full mt-2"[\s\S]*: "bottom-full mb-2"/);
  assert.match(gachaViewSource, /tooltip-placement="bottom"/);
});
