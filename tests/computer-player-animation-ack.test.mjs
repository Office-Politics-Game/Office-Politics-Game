import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("game view defers afterActionId states until the matching action completes", async () => {
  const gameViewSource = await readSource("src/views/GameView.vue");

  assert.match(gameViewSource, /pendingSocketGameStatesByActionId = new Map/);
  assert.match(gameViewSource, /completedSocketActionIds = new Set/);
  assert.match(gameViewSource, /const afterActionId = data\?\.afterActionId/);
  assert.match(gameViewSource, /pendingSocketGameStatesByActionId\.set\(afterActionId, data\)/);
  assert.match(gameViewSource, /completeSocketAction\(event\.id\)/);
  assert.match(gameViewSource, /applySocketGameStateAfterAnimation/);
});

test("game view sends computer readiness ACK after action and round sequences", async () => {
  const gameViewSource = await readSource("src/views/GameView.vue");
  const gameStageSource = await readSource("src/components/game/ui/GameStage.vue");

  assert.match(gameViewSource, /game:ready-for-computer-turn/);
  assert.match(
    gameViewSource,
    /applySocketGameStateAfterAnimation\(data, reason = ['"]action-complete['"]\)/,
  );
  assert.match(gameViewSource, /sendReadyForComputerTurn\(['"]round-start['"]\)/);
  assert.match(gameViewSource, /@round-sequence-complete="handleRoundSequenceComplete"/);
  assert.match(gameViewSource, /if \(data\?\.readyForComputerTurn === false\) \{\s+return\s+\}/);
  assert.match(gameViewSource, /if \(pendingSocketActionCount > 0\) \{\s+return\s+\}/);
  assert.match(gameStageSource, /"round-sequence-complete"/);
  assert.match(gameStageSource, /waitForNoticeIdle/);
});

test("game view does not ACK an intermediate computer draw while play animations are queued", async () => {
  const gameViewSource = await readSource("src/views/GameView.vue");
  const applyStateFunction = gameViewSource.slice(
    gameViewSource.indexOf("async function applySocketGameStateAfterAnimation"),
    gameViewSource.indexOf("function pruneCompletedSocketActionIds"),
  );

  assert.match(applyStateFunction, /await gameStage\.value\?\.waitForNoticeIdle\?\.\(\)/);
  assert.match(applyStateFunction, /if \(data\?\.readyForComputerTurn === false\) \{\s+return\s+\}/);
  assert.match(applyStateFunction, /if \(pendingSocketActionCount > 0\) \{\s+return\s+\}/);
  assert.equal(
    applyStateFunction.indexOf("readyForComputerTurn === false") <
      applyStateFunction.indexOf("pendingSocketActionCount > 0") &&
      applyStateFunction.indexOf("pendingSocketActionCount > 0") <
      applyStateFunction.indexOf("await sendReadyForComputerTurn"),
    true,
  );
});

test("game stage treats scheduled winner and eliminated notices as busy before ACK", async () => {
  const gameStageSource = await readSource("src/components/game/ui/GameStage.vue");
  const gameViewSource = await readSource("src/views/GameView.vue");

  assert.match(gameStageSource, /pendingNoticeOpenCount = ref\(0\)/);
  assert.match(gameStageSource, /pendingNoticeOpenCount\.value === 0/);
  assert.match(gameStageSource, /pendingNoticeAckDelayCount = ref\(0\)/);
  assert.match(gameStageSource, /pendingNoticeAckDelayCount\.value === 0/);
  assert.match(gameStageSource, /NOTICE_CLOSE_ACK_BUFFER_MS = 600/);
  assert.match(gameStageSource, /MANAGER_EFFECT_ACK_BUFFER_MS = 900/);
  assert.match(gameStageSource, /function scheduleNoticeOpen\(openNotice\)/);
  assert.match(gameStageSource, /pendingNoticeOpenCount\.value \+= 1/);
  assert.match(gameStageSource, /function holdNoticeAckAfterClose\(durationMs = NOTICE_CLOSE_ACK_BUFFER_MS\)/);
  assert.match(gameStageSource, /window\.setTimeout\(\(\) => \{/);
  assert.match(gameStageSource, /completed && result\?\.type === ["']manager["']/);
  assert.match(gameStageSource, /holdNoticeAckAfterClose\(MANAGER_EFFECT_ACK_BUFFER_MS\)/);
  assert.match(gameStageSource, /resolveNoticeIdleIfIdle\(\)/);
  assert.match(gameStageSource, /scheduleNoticeOpen\(\(\) => \{\s+isRoundWinnerNoticeOpen\.value = true;/);
  assert.match(gameStageSource, /scheduleNoticeOpen\(\(\) => \{\s+isPlayerEliminatedNoticeOpen\.value = true;/);
  assert.match(gameStageSource, /:duration="2400"/);
  assert.match(gameViewSource, /await nextTick\(\)\s+await nextTick\(\)\s+await gameStage\.value\?\.waitForNoticeIdle\?\.\(\)/);
});

test("backend emits action-bound states and protects PVP from computer-only actions", async () => {
  const gameHandlersSource = await readSource("server/src/socket/gameHandlers.js");

  assert.match(gameHandlersSource, /afterActionId: actionId/);
  assert.match(gameHandlersSource, /readyForComputerTurn/);
  assert.match(gameHandlersSource, /\{ readyForComputerTurn: false \}/);
  assert.match(gameHandlersSource, /\{ readyForComputerTurn: true \}/);
  assert.match(gameHandlersSource, /game:ready-for-computer-turn/);
  assert.match(gameHandlersSource, /activeComputerTurnRooms/);
  assert.match(gameHandlersSource, /runComputerTurn/);
  assert.match(gameHandlersSource, /didRun: Boolean\(result\?\.didRun\)/);
});
