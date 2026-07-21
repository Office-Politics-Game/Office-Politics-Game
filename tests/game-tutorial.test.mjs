import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createGameTutorialSteps,
  GAME_TUTORIAL_STEP_CONTENT,
  isGameTutorialEligible,
  useGameTutorial,
} from "../src/composables/UseGameTutorial.js";

const human = { id: "human", isComputer: false };
const computerOne = { id: "computer-1", isComputer: true };
const computerTwo = { id: "computer-2", isComputer: true };
const computerThree = { id: "computer-3", isComputer: true };
const createClassList = () => {
  const classes = new Set();
  return {
    add: (...names) => names.forEach((name) => classes.add(name)),
    remove: (...names) => names.forEach((name) => classes.delete(name)),
    contains: (name) => classes.has(name),
  };
};
const element = (name) => ({ nodeType: 1, name, classList: createClassList() });
const seatsRoot = element("seats-root");
const currentPlayerSeat = element("current-player");
const opponentSeats = [
  element("opponent-top"),
  element("opponent-left"),
  element("opponent-right"),
];
const allSeats = [currentPlayerSeat, ...opponentSeats];
seatsRoot.querySelectorAll = () => allSeats;
opponentSeats.forEach((seat) => {
  seat.closest = () => seatsRoot;
});
const targets = {
  deck: element("deck"),
  hand: element("hand"),
  discard: element("discard"),
  opponents: opponentSeats,
  settings: element("settings"),
  rules: element("rules"),
};
const readSource = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

function createTourHarness({ rejectStart = false } = {}) {
  const tours = [];
  const createTour = () => {
    const tour = {
      options: null,
      exitCount: 0,
      stepIndex: 0,
      setOptions(options) {
        this.options = options;
        return this;
      },
      setOption(name, value) {
        this.options[name] = value;
        return this;
      },
      onComplete(callback) {
        this.complete = callback;
        return this;
      },
      onExit(callback) {
        this.exited = callback;
        return this;
      },
      onAfterChange(callback) {
        this.afterChange = callback;
        return this;
      },
      onBeforeChange(callback) {
        this.beforeChange = callback;
        return this;
      },
      currentStep() {
        return this.stepIndex;
      },
      showStep(index) {
        this.beforeChange?.(null, index);
        this.stepIndex = index;
        this.afterChange?.();
      },
      async start() {
        if (rejectStart) {
          throw new Error("start failed");
        }
        return this;
      },
      async exit() {
        this.exitCount += 1;
        this.exited?.();
        return this;
      },
    };
    tours.push(tour);
    return tour;
  };

  return { createTour, tours };
}

test("tutorial eligibility requires one human current player and only computer opponents", () => {
  assert.equal(
    isGameTutorialEligible(
      [human, computerOne, computerTwo, computerThree],
      human.id,
    ),
    true,
  );
  assert.equal(
    isGameTutorialEligible(
      [human, { id: "other-human", isComputer: false }, computerOne],
      human.id,
    ),
    false,
  );
  assert.equal(
    isGameTutorialEligible(
      [human, computerOne, computerTwo, computerThree],
      computerOne.id,
    ),
    false,
  );
  assert.equal(
    isGameTutorialEligible([human, computerOne], "missing-player"),
    false,
  );
  assert.equal(isGameTutorialEligible([human], human.id), false);
  assert.equal(
    isGameTutorialEligible(
      [human, computerOne, computerTwo, computerThree],
      human.id,
      true,
    ),
    false,
  );
});

test("tutorial steps require all targets and follow the specified gameplay order", () => {
  assert.equal(createGameTutorialSteps({ ...targets, hand: null }), null);
  assert.equal(createGameTutorialSteps({ ...targets, settings: null }), null);
  assert.equal(createGameTutorialSteps({ ...targets, rules: null }), null);
  assert.equal(
    createGameTutorialSteps({
      ...targets,
      opponents: opponentSeats.slice(0, 2),
    }),
    null,
  );

  const steps = createGameTutorialSteps(targets);
  assert.deepEqual(
    steps.slice(0, 3).map((step) => step.element.name),
    ["deck", "hand", "discard"],
  );
  assert.equal(steps[3].element, undefined);
  assert.equal(steps[3].position, "floating");
  assert.equal(steps[3].title, "其他玩家");
  assert.match(steps[3].intro, /淘汰其他仍存活的玩家/);
  assert.match(steps[3].intro, /3 次回合勝利/);
  assert.deepEqual(
    steps.slice(4).map((step) => step.element.name),
    ["settings", "rules"],
  );
  assert.equal(steps[4].title, "設定按鍵");
  assert.equal(steps[4].intro, "調整音效與配樂，或投降離開遊戲。");
  assert.equal(steps[5].title, "規則側邊欄");
  assert.equal(steps[5].intro, "隨時查看遊戲規則。");
  assert.equal(GAME_TUTORIAL_STEP_CONTENT.deck.title, "抽牌區");

  const compactSteps = createGameTutorialSteps(targets, {
    isCompactLandscape: true,
  });
  assert.equal(compactSteps[0].position, "right");
  assert.equal(compactSteps[1].position, undefined);
  assert.equal(compactSteps[2].position, "left");
  assert.equal(compactSteps[3].position, "bottom");
  assert.equal(
    compactSteps[3].tooltipClass,
    "game-tutorial game-tutorial--opponents",
  );
});

test("tutorial starts once, exposes localized controls, and disposes safely", async () => {
  const harness = createTourHarness();
  const tutorial = useGameTutorial({ createTour: harness.createTour });
  const input = {
    players: [human, computerOne, computerTwo, computerThree],
    currentPlayerId: human.id,
    targets,
  };

  assert.equal(tutorial.isBlocking.value, false);
  assert.equal(await tutorial.startTutorial(input), true);
  assert.equal(tutorial.isBlocking.value, true);
  assert.equal(await tutorial.startTutorial(input), false);
  assert.equal(harness.tours.length, 1);
  assert.equal(tutorial.hasStarted, true);
  assert.equal(harness.tours[0].options.steps.length, 6);
  assert.equal(harness.tours[0].options.nextLabel, "下一步");
  assert.equal(harness.tours[0].options.prevLabel, "上一步");
  assert.equal(harness.tours[0].options.skipLabel, "略過");
  assert.equal(harness.tours[0].options.doneLabel, "完成");
  assert.equal(harness.tours[0].options.overlayOpacity, 0.72);
  assert.equal(harness.tours[0].options.scrollToElement, false);
  assert.equal(harness.tours[0].options.helperElementPadding, 10);
  assert.equal(harness.tours[0].options.autoPosition, true);

  harness.tours[0].showStep(3);
  assert.equal(
    seatsRoot.classList.contains("game-tutorial-opponents-active"),
    true,
  );
  opponentSeats.forEach((seat) =>
    assert.equal(
      seat.classList.contains("game-tutorial-opponent-highlight"),
      true,
    ),
  );
  assert.equal(
    currentPlayerSeat.classList.contains("game-tutorial-current-player-muted"),
    true,
  );

  harness.tours[0].showStep(2);
  assert.equal(
    seatsRoot.classList.contains("game-tutorial-opponents-active"),
    false,
  );
  opponentSeats.forEach((seat) =>
    assert.equal(
      seat.classList.contains("game-tutorial-opponent-highlight"),
      false,
    ),
  );

  tutorial.disposeTutorial();
  tutorial.disposeTutorial();
  await Promise.resolve();
  assert.equal(tutorial.isBlocking.value, false);
  assert.equal(harness.tours[0].exitCount, 1);
});

test("tutorial settlement waits for exit and finalizes skipped mounts", async () => {
  const harness = createTourHarness();
  const tutorial = useGameTutorial({ createTour: harness.createTour });
  const input = {
    players: [human, computerOne, computerTwo, computerThree],
    currentPlayerId: human.id,
    targets,
  };

  assert.equal(await tutorial.startTutorial(input), true);
  let didSettle = false;
  const settlement = tutorial.waitForTutorialSettlement().then((result) => {
    didSettle = true;
    return result;
  });
  await Promise.resolve();
  assert.equal(didSettle, false);

  harness.tours[0].complete();
  assert.equal(await settlement, true);
  assert.equal(tutorial.isBlocking.value, false);

  const skippedHarness = createTourHarness();
  const skipped = useGameTutorial({ createTour: skippedHarness.createTour });
  assert.equal(await skipped.waitForTutorialSettlement(), false);
  assert.equal(await skipped.startTutorial(input), false);
  assert.equal(skippedHarness.tours.length, 0);
});

test("tutorial start failures and disposal always release settlement", async () => {
  const createRejectableTour = () => {
    let rejectCreate;
    const createTour = () =>
      new Promise((_resolve, reject) => {
        rejectCreate = reject;
      });
    return { createTour, reject: (error) => rejectCreate(error) };
  };
  const input = {
    players: [human, computerOne, computerTwo, computerThree],
    currentPlayerId: human.id,
    targets,
  };

  const failedHarness = createRejectableTour();
  const failed = useGameTutorial({ createTour: failedHarness.createTour });
  const failedStart = failed.startTutorial(input);
  const failedSettlement = failed.waitForTutorialSettlement();
  failedHarness.reject(new Error("create failed"));
  assert.equal(await failedStart, false);
  assert.equal(await failedSettlement, true);

  const disposedHarness = createRejectableTour();
  const disposed = useGameTutorial({ createTour: disposedHarness.createTour });
  const disposedStart = disposed.startTutorial(input);
  const disposedSettlement = disposed.waitForTutorialSettlement();
  disposed.disposeTutorial();
  disposedHarness.reject(new Error("disposed"));
  assert.equal(await disposedStart, false);
  assert.equal(await disposedSettlement, false);
});

test("missing targets and failed starts remain retryable during the same mount", async () => {
  const missingTargetHarness = createTourHarness();
  const tutorial = useGameTutorial({
    createTour: missingTargetHarness.createTour,
  });
  const baseInput = {
    players: [human, computerOne, computerTwo, computerThree],
    currentPlayerId: human.id,
  };

  assert.equal(
    await tutorial.startTutorial({
      ...baseInput,
      targets: { ...targets, discard: null },
    }),
    false,
  );
  assert.equal(await tutorial.startTutorial({ ...baseInput, targets }), true);
  assert.equal(missingTargetHarness.tours.length, 1);

  const failedHarness = createTourHarness({ rejectStart: true });
  const failedTutorial = useGameTutorial({
    createTour: failedHarness.createTour,
  });
  assert.equal(
    await failedTutorial.startTutorial({ ...baseInput, targets }),
    false,
  );
  assert.equal(failedTutorial.hasStarted, false);
  assert.equal(
    await failedTutorial.startTutorial({ ...baseInput, targets }),
    false,
  );
  assert.equal(failedHarness.tours.length, 2);
});

test("compact landscape keeps forced side placement and moves opponents below center", async () => {
  const previousWindow = globalThis.window;
  globalThis.window = { innerWidth: 800 };
  const harness = createTourHarness();
  const tutorial = useGameTutorial({ createTour: harness.createTour });

  try {
    assert.equal(
      await tutorial.startTutorial({
        players: [human, computerOne, computerTwo, computerThree],
        currentPlayerId: human.id,
        targets,
      }),
      true,
    );
    assert.equal(harness.tours[0].options.autoPosition, true);
    assert.equal(harness.tours[0].options.helperElementPadding, 4);
    assert.equal(harness.tours[0].options.steps[0].position, "right");
    assert.equal(harness.tours[0].options.steps[2].position, "left");
    assert.equal(
      harness.tours[0].options.steps[3].tooltipClass,
      "game-tutorial game-tutorial--opponents",
    );
    harness.tours[0].showStep(1);
    assert.equal(harness.tours[0].options.autoPosition, true);
    harness.tours[0].showStep(2);
    assert.equal(harness.tours[0].options.autoPosition, false);
    harness.tours[0].showStep(3);
    assert.equal(harness.tours[0].options.autoPosition, true);
  } finally {
    tutorial.disposeTutorial();
    globalThis.window = previousWindow;
  }
});

test("game stage resolves component-owned tutorial elements after render and cleans up", async () => {
  const [stage, piles, hand, seats, settings, rules] = await Promise.all([
    readSource("src/components/game/ui/GameStage.vue"),
    readSource("src/components/game/ui/TableCardPiles.vue"),
    readSource("src/components/game/ui/PlayerHand.vue"),
    readSource("src/components/game/ui/PlayerSeats.vue"),
    readSource("src/components/game/ui/GameSettingsIcon.vue"),
    readSource("src/components/game/ui/GameRulesModal.vue"),
  ]);

  assert.match(piles, /getDeckElement\(\)/);
  assert.match(piles, /getDiscardElement\(\)/);
  assert.match(hand, /function getHandElement\(\)/);
  assert.match(seats, /ref="seatsRoot"/);
  assert.match(seats, /getOpponentSeatsElement\(\)/);
  assert.match(seats, /getOpponentSeatElements\(currentPlayerId\)/);
  assert.match(settings, /ref="settingButton"/);
  assert.match(settings, /getButtonElement/);
  assert.match(rules, /ref="triggerButton"/);
  assert.match(rules, /getTriggerElement/);
  assert.match(stage, /import \{ useGameTutorial \}/);
  assert.match(stage, /deck: tableCardPilesRef\.value\?\.getDeckElement/);
  assert.match(stage, /hand: playerHand\.value\?\.getHandElement/);
  assert.match(stage, /discard: tableCardPilesRef\.value\?\.getDiscardElement/);
  assert.match(stage, /settings: gameSettingsIcon\.value\?\.getButtonElement/);
  assert.match(stage, /rules: gameRulesModal\.value\?\.getTriggerElement/);
  assert.match(stage, /playerSeats\.value\?\.getOpponentSeatElements/);
  assert.match(stage, /await nextTick\(\)/);
  assert.match(stage, /flush: "post"/);
  assert.match(stage, /onBeforeUnmount\(\(\) => \{[\s\S]*stopTurnTimer\(\);[\s\S]*disposeTutorial\(\)/);
});

test("tutorial styles load after Intro.js and enforce Square UI responsive controls", async () => {
  const [main, styles] = await Promise.all([
    readSource("src/main.js"),
    readSource("src/assets/styles/game-tutorial.css"),
  ]);

  assert.ok(main.indexOf('import "intro.js/introjs.css"') >= 0);
  assert.ok(
    main.indexOf('import "intro.js/introjs.css"') <
      main.indexOf('import "./assets/styles/game-tutorial.css"'),
  );
  assert.match(styles, /\.introjs-tooltip\.game-tutorial/);
  assert.match(styles, /border-radius: 0/);
  assert.match(styles, /var\(--brand-hover\)/);
  assert.match(styles, /var\(--brand-focus\)/);
  assert.match(styles, /\.introjs-button:focus-visible/);
  assert.match(styles, /\.introjs-button\.introjs-disabled/);
  assert.match(styles, /@media \(min-width: 1024px\)/);
  assert.equal((styles.match(/@media/g) ?? []).length, 1);
  assert.match(styles, /width: 340px/);
  assert.match(styles, /width: 400px/);
  assert.match(styles, /width: 144px/);
  assert.match(styles, /width: 160px/);
  assert.match(styles, /white-space: nowrap/);
  assert.match(styles, /gap: 4px/);
  assert.match(styles, /padding: 10px 12px 4px/);
  assert.match(styles, /padding: 6px 12px 10px/);
  assert.match(
    styles,
    /\.introjs-tooltip\.game-tutorial--opponents \{[^}]*position: fixed !important/,
  );
  assert.match(
    styles,
    /\.introjs-tooltip\.game-tutorial--opponents \{[^}]*bottom: 10px !important/,
  );
  assert.match(
    styles,
    /\.introjs-tooltip\.game-tutorial--opponents \{[^}]*left: 50% !important/,
  );
  assert.match(
    styles,
    /\.introjs-tooltip\.game-tutorial--opponents \{[^}]*margin: 0 !important/,
  );
  assert.match(
    styles,
    /\.introjs-tooltip\.game-tutorial--opponents \{[^}]*translateX\(-50%\) !important/,
  );
  assert.doesNotMatch(styles, /translateY\(120px\)/);
  assert.match(styles, /writing-mode: horizontal-tb/);
  assert.match(
    styles,
    /\.game-tutorial \.introjs-skipbutton \{[^}]*font-size: 12px/,
  );
  assert.match(
    styles,
    /\.game-tutorial \.introjs-tooltip-title \{[^}]*font-size: 14px/,
  );
  assert.match(
    styles,
    /\.game-tutorial \.introjs-tooltiptext \{[^}]*font-size: 12px/,
  );
  assert.match(
    styles,
    /\.game-tutorial \.introjs-button \{[^}]*font-size: 12px/,
  );
  assert.match(
    styles,
    /@media \(min-width: 1024px\)[\s\S]*\.game-tutorial \.introjs-skipbutton \{[^}]*font-size: 16px/,
  );
  assert.match(styles, /game-tutorial-opponent-highlight/);
  assert.match(styles, /outline: 2px solid var\(--brand-hover\)/);
  assert.match(styles, /outline-offset: -2px/);
  assert.doesNotMatch(styles, /outline-offset: 6px/);
  assert.match(styles, /0 0 30px 2px rgba\(0, 70, 244, 0\.78\)/);
  assert.doesNotMatch(styles, /0 0 30px 8px rgba\(0, 70, 244, 0\.78\)/);
  assert.match(styles, /border: 2px solid var\(--brand-hover\)/);
  assert.match(styles, /0 0 28px rgba\(0, 70, 244, 0\.82\)/);
  assert.match(styles, /rgba\(0, 19, 50, 0\.72\)/);
  assert.doesNotMatch(styles, /0 0 0 2px rgba\(134, 179, 224, 0\.72\)/);
  assert.doesNotMatch(styles, /0 0 0 4px rgba\(134, 179, 224, 0\.56\)/);
  assert.doesNotMatch(styles, /\b(?:clamp|vw|vh)\b|width:\s*100%/);
});
