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
  /room-player-info[^\"]*gap-\[6px\][^\"]*lg:gap-\[14px\]/,
  "player names and titles should use the shared responsive spacing",
);
assert.match(
  playerListSource,
  /room-ready-stamp mt-\[6px\] lg:mt-\[14px\]/,
  "ready stamps should use the same spacing as names and titles",
);

console.log("waiting-room achievement title ok");
