import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("top-level RouterView preserves the Lobby instance across child routes", async () => {
  const appSource = await readSource("src/App.vue");

  assert.doesNotMatch(appSource, /:key="route\.fullPath"/);
  assert.match(
    appSource,
    /:key="route\.matched\[0\]\?\.name \?\? route\.matched\[0\]\?\.path \?\? route\.name \?\? route\.path"/,
  );
});

test("Lobby keeps the existing bidirectional 700ms flip contract", async () => {
  const [lobbySource, lobbyMenuSource, gameMenuSource] = await Promise.all([
    readSource("src/views/Lobby.vue"),
    readSource("src/components/menu/LobbyMenu.vue"),
    readSource("src/components/gameRoom/GameMenuPanel.vue"),
  ]);

  assert.match(lobbySource, /route\.name === "LobbyGameMenu"/);
  assert.match(lobbySource, /:class="\{ 'is-flipped': isGameMenuRoute \}"/);
  assert.match(
    lobbySource,
    /transition:\s*transform 700ms cubic-bezier\(0\.22, 0\.61, 0\.36, 1\)/,
  );
  assert.match(
    lobbySource,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.lobby-flip-card \{\s*transition: none;/,
  );
  assert.match(
    lobbyMenuSource,
    /function openGameMenu\(\)[\s\S]*?router\.push\(\{ name: "LobbyGameMenu" \}\)/,
  );
  assert.match(
    gameMenuSource,
    /function returnLobby\(\)[\s\S]*?router\.push\(\{ name: "LobbyHome" \}\)/,
  );
});

test("game-end navigation keeps the result page slide transition", async () => {
  const appSource = await readSource("src/App.vue");

  assert.match(
    appSource,
    /route\.query\.transition === 'game-end' \? 'result-page-slide' : ''/,
  );
  assert.match(appSource, /\.result-page-slide-enter-active/);
});
