import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("gacha printer cursor is only active during the draw interaction", async () => {
  const gachaUiSource = await readSource("src/components/gacha/GachaUi.vue");
  const gachaViewSource = await readSource("src/views/GachaView.vue");

  assert.match(gachaUiSource, /isPrinterInteractive:/);
  assert.match(gachaUiSource, /:disabled="!isPrinterInteractive"/);
  assert.match(gachaUiSource, /cursor-grab active:cursor-grabbing[\s\S]*isPrinterInteractive/);
  assert.match(gachaUiSource, /\.printer-button:disabled \{[\s\S]*pointer-events: none;/);
  assert.match(gachaViewSource, /:is-printer-interactive="isAnimationMode"/);
});

test("gacha pool arrows stay clickable above the info hotspot", async () => {
  const source = await readSource("src/views/GachaView.vue");

  assert.match(source, /\.gacha-pool-arrow \{[\s\S]*z-index: 4;/);
  assert.match(source, /\.gacha-pool-info-hotspot \{[\s\S]*z-index: 5;/);
  assert.match(source, /\.gacha-pool-info-hotspot \{[\s\S]*left: 65%;/);
  assert.match(source, /width: clamp\(52px, 10%, 68px\);/);
  assert.match(source, /transform: translate\(-35%, -50%\);/);
  assert.match(source, /@media \(min-width: 1024px\) \{[\s\S]*\.gacha-pool-info-hotspot \{[\s\S]*left: 69%;/);
});

test("gacha pool banner keeps its original responsive image sizing", async () => {
  const source = await readSource("src/views/GachaView.vue");

  assert.match(
    source,
    /\.gacha-pool-banner \{[\s\S]*width: 100%;[\s\S]*max-height: min\(17svh, 150px\);/,
  );
  assert.match(source, /\.gacha-pool-carousel \{[\s\S]*top: 48px;[\s\S]*width: min\(82vw, 760px\);/);
  assert.match(source, /--gacha-pool-arrow-offset: clamp\(16px, 3vw, 34px\);/);
  assert.match(source, /\.gacha-pool-arrow--left \{[\s\S]*left: var\(--gacha-pool-arrow-offset\);/);
  assert.match(source, /\.gacha-pool-arrow--right \{[\s\S]*right: var\(--gacha-pool-arrow-offset\);/);
  assert.match(
    source,
    /@media \(min-width: 1024px\) \{[\s\S]*top: clamp\(76px, 11svh, 124px\);[\s\S]*\}/,
  );
  assert.doesNotMatch(source, /aspect-ratio: 1860 \/ 535;/);
});

test("gacha pool info modal uses the lego frame asset", async () => {
  const source = await readSource("src/views/GachaView.vue");

  assert.match(source, /legoGachaInfoFrameUrl from ["']@\/assets\/images\/lego-gacha-info-frame\.webp["']/);
  assert.match(source, /tarotGachaInfoFrameUrl from ["']@\/assets\/images\/tarot-gacha-info-frame\.webp["']/);
  assert.match(source, /const currentGachaInfoFrameUrl = computed/);
  assert.match(source, /class="gacha-pool-info-card"/);
  assert.match(source, /class="gacha-pool-info-card__title"/);
  assert.match(source, /\.gacha-pool-info-card \{[\s\S]*width: min\(70vw, 292px\);/);
  assert.match(source, /\.gacha-pool-rate-list__item \{[\s\S]*font-size: 9px;/);
  assert.match(source, /backgroundImage: `url\(\$\{currentGachaInfoFrameUrl\}\)`/);
});

test("gacha pool second page uses the tarot banner", async () => {
  const source = await readSource("src/views/GachaView.vue");

  assert.match(source, /tarotGachaPoolBannerUrl from ["']@\/assets\/images\/gacha-pool-tarot-style\.webp["']/);
  assert.match(source, /:src="gachaPoolPage === 1 \? gachaPoolBannerUrl : tarotGachaPoolBannerUrl"/);
  assert.match(source, /'塔羅牌占星風格卡池'/);
});

test("gacha draw buttons use the default glass style", async () => {
  const source = await readSource("src/views/GachaView.vue");

  assert.match(source, /class="gacha-button border btn-glass min-h-10 min-w-28 px-5 py-2 text-xs font-black"[\s\S]*單抽/);
  assert.match(source, /class="gacha-button border btn-glass min-h-10 min-w-28 px-5 py-2 text-xs font-black"[\s\S]*十抽/);
  assert.doesNotMatch(source, /gacha-draw-button/);
});

test("gacha page close button uses the shared btn-glass format", async () => {
  const source = await readSource("src/views/GachaView.vue");

  assert.match(source, /class="btn-glass fixed right-5 top-5 z-50 grid size-9 place-items-center p-0 lg:p-0"/);
  assert.doesNotMatch(source, /\.close-button \{/);
});

test("gacha pool info modal lists card draw rates from current weights", async () => {
  const source = await readSource("src/views/GachaView.vue");

  [
    ["實習生", "40%"],
    ["打掃阿姨", "25%"],
    ["部門主管", "15%"],
    ["職場老鳥", "10%"],
    ["專案經理", "5%"],
    ["人資主管", "3%"],
    ["資深顧問", "1.5%"],
    ["執行長", "0.5%"],
  ].forEach(([name, rate]) => {
    assert.match(source, new RegExp(`name: "${name}", rate: "${rate}"`));
  });

  assert.match(source, /v-for="item in GACHA_POOL_RATES"/);
});
