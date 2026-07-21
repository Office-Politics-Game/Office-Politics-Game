import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("custom room add computer uses backend room state instead of local fake players", async () => {
  const customRoomSource = await readSource("src/views/CustomRoomView.vue");
  const roomStoreSource = await readSource("src/stores/roomStore.js");
  const roomApiSource = await readSource("src/services/roomApi.js");
  const playerListSource = await readSource("src/components/gameRoom/CustomRoomPlayerList.vue");

  assert.match(roomStoreSource, /async addComputerPlayer\(roomCode, payload\)/);
  assert.match(roomStoreSource, /emitWithAck\(["']room:add-computer["']/);
  assert.match(roomStoreSource, /addComputerPlayerRequest\(roomCode, payload\)/);
  assert.match(roomApiSource, /function addComputerPlayer\(roomCode, payload\)/);
  assert.match(roomApiSource, /computer-players/);
  assert.match(customRoomSource, /await roomStore\.addComputerPlayer\(roomCode\.value/);
  assert.match(customRoomSource, /username:\s*computerName/);
  assert.match(customRoomSource, /pendingComputerSlots\.value\[index\]/);
  assert.match(customRoomSource, /isLoading\.value/);
  assert.doesNotMatch(customRoomSource, /localPlayerSlots/);
  assert.doesNotMatch(customRoomSource, /hasLocalComputerPlayers/);
  assert.doesNotMatch(customRoomSource, /getRankingList/);
  assert.match(
    playerListSource,
    /:disabled="controlsDisabled \|\| !slot\.canAddComputer"/,
  );
});

test("backend room flow exposes computer metadata and socket handler", async () => {
  const schemaSource = await readSource("server/src/db/schema.sql");
  const roomServiceSource = await readSource("server/src/services/roomService.js");
  const roomControllerSource = await readSource("server/src/controllers/roomController.js");
  const roomHandlersSource = await readSource("server/src/socket/roomHandlers.js");
  const routesSource = await readSource("server/src/routes/roomRoutes.js");

  assert.match(schemaSource, /is_computer BOOLEAN NOT NULL DEFAULT false/);
  assert.match(roomServiceSource, /async function addComputerPlayer/);
  assert.match(roomServiceSource, /findOrCreateComputerPlayer/);
  assert.match(roomServiceSource, /normalizeComputerUsername/);
  assert.match(roomServiceSource, /async function addComputerPlayer\(\{ roomCode, hostPlayerId, username \}\)/);
  assert.match(roomServiceSource, /isComputer/);
  assert.match(roomControllerSource, /const \{ hostPlayerId, username \} = req\.body/);
  assert.match(roomControllerSource, /addComputerPlayer\(\{ roomCode, hostPlayerId, username \}\)/);
  assert.match(roomHandlersSource, /const \{ roomCode, hostPlayerId, username \} = payload/);
  assert.match(roomHandlersSource, /room:add-computer/);
  assert.match(routesSource, /computer-players/);
});
