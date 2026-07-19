import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("waiting-room operations lock synchronously while game start is pending", async () => {
  const source = await readSource("src/views/CustomRoomView.vue");
  const startHandler = source.slice(
    source.indexOf("async function handleStartRoom"),
    source.indexOf("async function openInviteFriendModal"),
  );

  assert.match(source, /const isStartingRoom = ref\(false\)/);
  assert.match(source, /const isWaitingRoomInteractive = computed/);
  assert.match(startHandler, /if \(!isWaitingRoomInteractive\.value\)/);
  assert.ok(
    startHandler.indexOf("isStartingRoom.value = true") <
      startHandler.indexOf("await roomStore.startRoom"),
    "start lock must be set before awaiting the backend",
  );
  assert.match(startHandler, /catch[\s\S]*isStartingRoom\.value = false/);
  assert.match(source, /:controls-disabled="!isWaitingRoomInteractive"/);
  assert.match(source, /:disabled="!isWaitingRoomInteractive"[\s\S]*返回大廳/);
});

test("every waiting-room mutation handler has an interaction guard", async () => {
  const source = await readSource("src/views/CustomRoomView.vue");

  for (const handler of [
    "handleAddComputer",
    "handleRemovePlayer",
    "openInviteFriendModal",
    "sendRoomInvitation",
  ]) {
    const start = source.indexOf(`function ${handler}`);
    const nextFunction = source.indexOf("\nfunction ", start + 1);
    const nextAsyncFunction = source.indexOf("\nasync function ", start + 1);
    const boundaries = [nextFunction, nextAsyncFunction].filter((index) => index > start);
    const end = boundaries.length ? Math.min(...boundaries) : source.length;
    assert.match(
      source.slice(start, end),
      /isWaitingRoomInteractive\.value/,
      `${handler} must reject mutations while controls are locked`,
    );
  }
});

test("player list uses native disabled for all mutation buttons", async () => {
  const source = await readSource("src/components/gameRoom/CustomRoomPlayerList.vue");

  assert.match(source, /controlsDisabled:\s*\{[\s\S]*type:\s*Boolean/);
  assert.match(source, /:disabled="controlsDisabled \|\| !slot\.canRemovePlayer"/);
  assert.match(source, /:disabled="controlsDisabled \|\| !slot\.canAddComputer"/);
  assert.match(source, /:disabled="controlsDisabled \|\| !slot\.canInviteFriend"/);
});

test("waiting-room slots are derived from backend seatOrder instead of array index", async () => {
  const source = await readSource("src/views/CustomRoomView.vue");

  assert.match(source, /playersBySeatOrder/);
  assert.match(source, /Number\(player\?\.seatOrder\)/);
  assert.match(source, /playersBySeatOrder\.value\.get\(index \+ 1\)/);
  assert.doesNotMatch(source, /const roomPlayer = players\.value\[index\]/);
  assert.match(source, /pendingRemovalSlots[^\n]*playerId|pendingRemovalSlots\.value\[String\(player\.playerId\)\]/);
});

test("room store exposes explicit leave with socket-first HTTP fallback", async () => {
  const storeSource = await readSource("src/stores/roomStore.js");
  const apiSource = await readSource("src/services/roomApi.js");

  assert.match(apiSource, /function leaveRoom\(roomCode, payload\)/);
  assert.match(apiSource, /buildRoomPath\(roomCode, "leave"\)/);
  assert.match(storeSource, /async leaveRoom\(roomCode, payload\)/);
  assert.match(storeSource, /emitWithAck\("room:leave"/);
  assert.match(storeSource, /leaveRoomRequest\(roomCode, payload\)/);
  assert.match(storeSource, /this\.resetRoom\(\)/);
});

test("return to lobby explicitly leaves while route unmount only unsubscribes", async () => {
  const viewSource = await readSource("src/views/CustomRoomView.vue");

  assert.match(viewSource, /async function handleLeaveRoom/);
  assert.match(viewSource, /await roomStore\.leaveRoom/);
  assert.match(viewSource, /@click="handleLeaveRoom"/);
  const unmountHandler = viewSource.slice(viewSource.indexOf("onBeforeUnmount(() =>"));
  assert.match(unmountHandler, /unsubscribeFromRoom/);
  assert.doesNotMatch(unmountHandler, /roomStore\.leaveRoom/);
  const storeSource = await readSource("src/stores/roomStore.js");
  assert.match(storeSource, /socket\.on\("room:dissolved"/);
  assert.match(storeSource, /handleSocketRoomDissolved/);
});
