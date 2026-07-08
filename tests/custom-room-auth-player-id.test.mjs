import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("custom room flow accepts member and guest player ids", async () => {
  const currentPlayerIdSource = await readSource("src/composables/useCurrentPlayerId.js");
  const waitingRoomSource = await readSource("src/components/gameRoom/WaitingRoomMenu.vue");
  const joinRoomModalSource = await readSource("src/components/gameRoom/JoinRoomModal.vue");
  const customRoomSource = await readSource("src/views/CustomRoomView.vue");

  assert.match(currentPlayerIdSource, /useAuthStore/);
  assert.match(currentPlayerIdSource, /usePlayerStore/);
  assert.match(
    currentPlayerIdSource,
    /authStore\.currentPlayer\?\.id\s*\?\?\s*playerStore\.currentPlayerId/,
  );

  assert.match(waitingRoomSource, /useCurrentPlayerId/);
  assert.match(waitingRoomSource, /hostPlayerId:\s*currentPlayerId\.value/);
  assert.match(waitingRoomSource, /playerId:\s*currentPlayerId\.value/);

  assert.match(joinRoomModalSource, /useCurrentPlayerId/);
  assert.match(joinRoomModalSource, /playerId:\s*currentPlayerId\.value/);

  assert.match(customRoomSource, /useCurrentPlayerId/);
  assert.match(
    customRoomSource,
    /String\(player\.playerId\)\s*===\s*String\(currentPlayerId\.value\)/,
  );
  assert.match(customRoomSource, /playerId:\s*currentPlayerId\.value/);
});
