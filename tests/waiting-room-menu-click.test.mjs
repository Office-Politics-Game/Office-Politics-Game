import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("inline join room confirm remains mouse clickable", async () => {
  const source = await readSource("src/components/gameRoom/WaitingRoomMenu.vue");

  assert.doesNotMatch(source, /<button\s+class="waiting-room-button/);
  assert.match(source, /<div\s+class="waiting-room-button/);
  assert.match(source, /'is-join-expanded'/);
  assert.match(source, /\.waiting-room-item\.is-join-expanded:active/);
  assert.match(
    source,
    /\.waiting-room-item\.is-join-expanded:active\s*\{[\s\S]*--hover-y:\s*-12px/,
  );
  assert.match(source, /@click\.stop="handleJoinRoom"/);
  assert.match(source, /@keydown\.enter\.stop\.prevent="handleJoinRoom"/);
});
