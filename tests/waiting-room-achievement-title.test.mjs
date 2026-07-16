import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const playerListSource = readFileSync(
  "src/components/gameRoom/CustomRoomPlayerList.vue",
  "utf8",
);
const customRoomSource = readFileSync("src/views/CustomRoomView.vue", "utf8");
const roomStoreSource = readFileSync("src/stores/roomStore.js", "utf8");

assert.match(
  customRoomSource,
  /title:\s*player\.title\s*\|\|\s*""/,
  "waiting-room slots should preserve the title returned by room state",
);
assert.match(
  playerListSource,
  /v-if="slot\.title && !slot\.isPlaceholder"[\s\S]*\{\{ slot\.title \}\}/,
  "waiting-room player cards should render equipped titles",
);
assert.match(
  roomStoreSource,
  /player:title-updated[\s\S]*handleSocketPlayerTitleUpdated/,
  "waiting-room state should subscribe to live title updates",
);
assert.match(
  roomStoreSource,
  /players\.map[\s\S]*title:\s*String\(payload\.title \|\| ""\)/,
  "live title updates should patch the matching room player",
);
assert.match(
  playerListSource,
  /\.room-ready-stamp\s*\{[\s\S]*position:\s*absolute;[\s\S]*bottom:\s*0;[\s\S]*left:\s*50%;/,
  "ready stamps should share the same vertical anchor regardless of player info height",
);

console.log("waiting-room achievement title ok");
