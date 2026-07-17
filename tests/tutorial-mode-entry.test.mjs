import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const menuSource = readFileSync(
  "src/components/gameRoom/WaitingRoomMenu.vue",
  "utf8",
);
const stageSource = readFileSync(
  "src/components/game/ui/GameStage.vue",
  "utf8",
);

assert.match(
  menuSource,
  /title: "教學模式"[\s\S]*description: \["與電腦玩家對戰", "熟悉遊戲操作"\]/,
  "the first play mode should be presented as tutorial mode",
);

assert.doesNotMatch(
  menuSource,
  /開始配對|配對中|matchElapsedSeconds|startMatchTimer/,
  "tutorial mode should fully replace the automatic matching UI",
);

assert.match(
  menuSource,
  /async function handleTutorialMode\(\)[\s\S]*roomStore\.createRoom\([\s\S]*index < 3[\s\S]*roomStore\.addComputerPlayer\([\s\S]*roomStore\.startRoom\(/,
  "tutorial mode should create a room and fill it with three computers using existing actions",
);

assert.match(
  menuSource,
  /name: "Loading"[\s\S]*roomCode: tutorialRoomCode[\s\S]*playerId: String\(currentPlayerId\.value\)/,
  "tutorial mode should enter the existing loading and game route",
);

assert.match(
  stageSource,
  /useGameTutorial\(\)[\s\S]*startTutorial\(\{[\s\S]*players: props\.players[\s\S]*hasAnyCardBeenPlayed/,
  "the game stage should continue to launch the existing frontend tutorial",
);

console.log("tutorial mode entry ok");
