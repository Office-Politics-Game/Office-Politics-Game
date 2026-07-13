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
    isGameTutorialEligible([human, computerOne, computerTwo], human.id),
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
    isGameTutorialEligible([human, computerOne], computerOne.id),
    false,
  );
  assert.equal(
    isGameTutorialEligible([human, computerOne], "missing-player"),
    false,
  );
  assert.equal(isGameTutorialEligible([human], human.id), false);
});

test("tutorial steps require all targets and follow the specified gameplay order", () => {
  assert.equal(createGameTutorialSteps({ ...targets, hand: null }), null);
  assert.equal(
    createGameTutorialSteps({ ...targets, opponents: opponentSeats.slice(0, 2) }),
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
    players: [human, computerOne, computerTwo],
    currentPlayerId: human.id,
    targets,
  };

  assert.equal(await tutorial.startTutorial(input), true);
  assert.equal(await tutorial.startTutorial(input), false);
  assert.equal(harness.tours.length, 1);
  assert.equal(tutorial.hasStarted, true);
  assert.equal(harness.tours[0].options.steps.length, 4);
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
  assert.equal(harness.tours[0].exitCount, 1);
});

test("missing targets and failed starts remain retryable during the same mount", async () => {
  const missingTargetHarness = createTourHarness();
  const tutorial = useGameTutorial({
    createTour: missingTargetHarness.createTour,
  });
  const baseInput = {
    players: [human, computerOne],
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
  const failedTutorial = useGameTutorial({ createTour: failedHarness.createTour });
  assert.equal(await failedTutorial.startTutorial({ ...baseInput, targets }), false);
  assert.equal(failedTutorial.hasStarted, false);
  assert.equal(await failedTutorial.startTutorial({ ...baseInput, targets }), false);
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
        players: [human, computerOne, computerTwo],
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
  const [stage, piles, hand, seats] = await Promise.all([
    readSource("src/components/game/ui/GameStage.vue"),
    readSource("src/components/game/ui/TableCardPiles.vue"),
    readSource("src/components/game/ui/PlayerHand.vue"),
    readSource("src/components/game/ui/PlayerSeats.vue"),
  ]);

  assert.match(piles, /getDeckElement\(\)/);
  assert.match(piles, /getDiscardElement\(\)/);
  assert.match(hand, /function getHandElement\(\)/);
  assert.match(seats, /ref="seatsRoot"/);
  assert.match(seats, /getOpponentSeatsElement\(\)/);
  assert.match(seats, /getOpponentSeatElements\(currentPlayerId\)/);
  assert.match(stage, /import \{ useGameTutorial \}/);
  assert.match(stage, /deck: tableCardPilesRef\.value\?\.getDeckElement/);
  assert.match(stage, /hand: playerHand\.value\?\.getHandElement/);
  assert.match(stage, /discard: tableCardPilesRef\.value\?\.getDiscardElement/);
  assert.match(stage, /playerSeats\.value\?\.getOpponentSeatElements/);
  assert.match(stage, /await nextTick\(\)/);
  assert.match(stage, /flush: "post"/);
  assert.match(stage, /onBeforeUnmount\(\(\) => \{\s*disposeTutorial\(\)/);
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
    /\.introjs-tooltip\.game-tutorial--opponents \{[^}]*translateY\(120px\)/,
  );
  assert.match(styles, /writing-mode: horizontal-tb/);
  assert.match(
    styles,
    /\.game-tutorial \.introjs-skipbutton \{[^}]*font-size: 18px/,
  );
  assert.match(
    styles,
    /@media \(min-width: 1024px\)[\s\S]*\.game-tutorial \.introjs-skipbutton \{[^}]*font-size: 22px/,
  );
  assert.match(styles, /game-tutorial-opponent-highlight/);
  assert.match(styles, /rgba\(0, 19, 50, 0\.72\)/);
  assert.doesNotMatch(styles, /\b(?:clamp|vw|vh)\b|width:\s*100%/);
});
