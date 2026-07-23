import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const gameRulesModalSource = await readFile(
  new URL("../src/components/game/ui/GameRulesModal.vue", import.meta.url),
  "utf8",
);

test("卡牌資訊在高度不足時使用可聚焦的表格內捲動區域", () => {
  assert.match(
    gameRulesModalSource,
    /class="rules-card-table-scroll[^\"]*min-h-0[^\"]*overflow-y-auto[^\"]*"\s+role="region"\s+aria-label="卡牌資訊表格"\s+tabindex="0"/,
  );
  assert.match(
    gameRulesModalSource,
    /\.rules-card-table-scroll\s*\{[\s\S]*?overscroll-behavior:\s*contain;/,
  );
});

test("卡牌表格可自然增高並保持欄位表頭可見", () => {
  assert.match(
    gameRulesModalSource,
    /\.rules-card-table\s*\{[\s\S]*?height:\s*auto;[\s\S]*?min-height:\s*100%;/,
  );
  assert.match(
    gameRulesModalSource,
    /\.rules-card-table th\s*\{[\s\S]*?position:\s*sticky;[\s\S]*?top:\s*0;[\s\S]*?z-index:\s*1;/,
  );
});

test("遊戲規則在高度不足時使用可聚焦的內容捲動區域", () => {
  assert.match(
    gameRulesModalSource,
    /class="rules-content rules-overview-scroll[^\"]*overflow-y-auto[^\"]*"\s+role="region"\s+aria-label="遊戲規則內容"\s+tabindex="0"/,
  );
  assert.match(
    gameRulesModalSource,
    /\.rules-overview-scroll\s*\{[\s\S]*?grid-template-rows:\s*repeat\(3, minmax\(max-content, 1fr\)\);/,
  );
});

test("規則切換按鈕與卡牌表格使用 700 字重", () => {
  assert.doesNotMatch(gameRulesModalSource, /font-weight:\s*800;/);
  assert.equal(
    (gameRulesModalSource.match(/font-weight:\s*700;/g) ?? []).length,
    3,
  );
});
