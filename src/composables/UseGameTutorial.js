import { ref } from "vue";

export const GAME_TUTORIAL_STEP_CONTENT = Object.freeze({
  deck: {
    title: "抽牌區",
    intro: "輪到你時，從這裡抽一張牌加入手牌。",
  },
  hand: {
    title: "手牌區",
    intro: "你的手牌會放在這裡。選擇卡牌並依牌面效果行動。",
  },
  discard: {
    title: "棄牌區",
    intro: "打出的牌會進入棄牌區，你可以從這裡掌握已使用的卡牌。",
  },
  opponents: {
    title: "其他玩家",
    intro:
      "淘汰其他仍存活的玩家可取得回合勝利；率先累積 3 次回合勝利，就能贏得整場遊戲。",
  },
  settings: {
    title: "設定按鍵",
    intro: "調整音效與配樂，或投降離開遊戲。",
  },
  rules: {
    title: "規則側邊欄",
    intro: "隨時查看遊戲規則。",
  },
});

export function isGameTutorialEligible(
  players,
  currentPlayerId,
  hasAnyCardBeenPlayed = false,
) {
  if (
    !Array.isArray(players) ||
    players.length !== 4 ||
    currentPlayerId == null ||
    hasAnyCardBeenPlayed
  ) {
    return false;
  }

  const currentPlayer = players.find(
    (player) => String(player?.id) === String(currentPlayerId),
  );
  if (!currentPlayer || currentPlayer.isComputer) {
    return false;
  }

  const humanPlayers = players.filter((player) => !player?.isComputer);
  const opponents = players.filter(
    (player) => String(player?.id) !== String(currentPlayerId),
  );
  return (
    humanPlayers.length === 1 &&
    opponents.length === 3 &&
    opponents.every((player) => player.isComputer)
  );
}

function isHtmlElement(value) {
  if (typeof HTMLElement === "undefined") {
    return value?.nodeType === 1;
  }

  return value instanceof HTMLElement;
}

export function createGameTutorialSteps(targets, { isCompactLandscape = false } = {}) {
  const anchoredTargets = [
    ["deck", targets?.deck],
    ["hand", targets?.hand],
    ["discard", targets?.discard],
  ];
  const opponents = targets?.opponents;
  const settings = targets?.settings;
  const rules = targets?.rules;

  if (
    anchoredTargets.some(([, element]) => !isHtmlElement(element)) ||
    !isHtmlElement(settings) ||
    !isHtmlElement(rules) ||
    !Array.isArray(opponents) ||
    opponents.length !== 3 ||
    opponents.some((element) => !isHtmlElement(element))
  ) {
    return null;
  }

  return [
    ...anchoredTargets.map(([key, element]) => ({
      element,
      ...GAME_TUTORIAL_STEP_CONTENT[key],
      ...(isCompactLandscape && key === "deck" ? { position: "right" } : {}),
      ...(isCompactLandscape && key === "discard"
        ? { position: "left" }
        : {}),
    })),
    {
      ...GAME_TUTORIAL_STEP_CONTENT.opponents,
      position: isCompactLandscape ? "bottom" : "floating",
      tooltipClass: isCompactLandscape
        ? "game-tutorial game-tutorial--opponents"
        : "game-tutorial",
    },
    {
      element: settings,
      ...GAME_TUTORIAL_STEP_CONTENT.settings,
    },
    {
      element: rules,
      ...GAME_TUTORIAL_STEP_CONTENT.rules,
    },
  ];
}

export function useGameTutorial({
  createTour = async () => {
    const { default: introJs } = await import("intro.js");
    return introJs.tour();
  },
} = {}) {
  let tour = null;
  let hasStarted = false;
  let isStarting = false;
  let isFinalized = false;
  let highlightedTargets = null;
  const settlementResolvers = new Set();
  const isBlocking = ref(false);

  function settleTutorial(result = false) {
    settlementResolvers.forEach((resolve) => resolve(result));
    settlementResolvers.clear();
  }

  function clearOpponentHighlights() {
    if (!highlightedTargets) {
      return;
    }

    const { root, opponents, currentPlayerSeats } = highlightedTargets;
    root.classList.remove("game-tutorial-opponents-active");
    opponents.forEach((element) =>
      element.classList.remove("game-tutorial-opponent-highlight"),
    );
    currentPlayerSeats.forEach((element) =>
      element.classList.remove("game-tutorial-current-player-muted"),
    );
    highlightedTargets = null;
  }

  function showOpponentHighlights(opponents) {
    clearOpponentHighlights();
    const root = opponents[0]?.closest?.(".player-seats");
    if (!root) {
      return;
    }

    const opponentSet = new Set(opponents);
    const currentPlayerSeats = Array.from(
      root.querySelectorAll(".player-seats__seat"),
    ).filter((element) => !opponentSet.has(element));

    root.classList.add("game-tutorial-opponents-active");
    opponents.forEach((element) =>
      element.classList.add("game-tutorial-opponent-highlight"),
    );
    currentPlayerSeats.forEach((element) =>
      element.classList.add("game-tutorial-current-player-muted"),
    );
    highlightedTargets = { root, opponents, currentPlayerSeats };
  }

  function clearTour(activeTour) {
    clearOpponentHighlights();
    if (tour === activeTour) {
      tour = null;
    }
    isBlocking.value = false;
    settleTutorial(true);
  }

  async function startTutorial({
    players,
    currentPlayerId,
    hasAnyCardBeenPlayed = false,
    targets,
  }) {
    if (
      hasStarted ||
      isFinalized ||
      isStarting ||
      !isGameTutorialEligible(
        players,
        currentPlayerId,
        hasAnyCardBeenPlayed,
      )
    ) {
      return false;
    }

    const isCompactLandscape =
      typeof window !== "undefined" && window.innerWidth < 1024;
    const steps = createGameTutorialSteps(targets, { isCompactLandscape });
    if (!steps) {
      return false;
    }

    isBlocking.value = true;
    isStarting = true;
    let nextTour = null;
    try {
      nextTour = await createTour();
      if (isFinalized) {
        Promise.resolve(nextTour.exit?.(true)).catch(() => {});
        settleTutorial(false);
        return false;
      }
      tour = nextTour;
      nextTour.setOptions({
        steps,
        nextLabel: "下一步",
        prevLabel: "上一步",
        skipLabel: "略過",
        doneLabel: "完成",
        showProgress: true,
        showBullets: false,
        autoPosition: true,
        overlayOpacity: 0.72,
        exitOnOverlayClick: false,
        disableInteraction: true,
        scrollToElement: false,
        helperElementPadding: isCompactLandscape ? 4 : 10,
        tooltipClass: "game-tutorial",
      });
      nextTour.onComplete(() => clearTour(nextTour));
      nextTour.onExit(() => clearTour(nextTour));
      nextTour.onBeforeChange((_targetElement, currentStep) => {
        nextTour.setOption(
          "autoPosition",
          !(isCompactLandscape && currentStep === 2),
        );
        return true;
      });
      nextTour.onAfterChange(() => {
        if (nextTour.currentStep() === 3) {
          showOpponentHighlights(targets.opponents);
          return;
        }

        clearOpponentHighlights();
      });
      await nextTour.start();
      hasStarted = true;
      return true;
    } catch {
      clearOpponentHighlights();
      clearTour(nextTour);
      return false;
    } finally {
      isStarting = false;
    }
  }

  function waitForTutorialSettlement() {
    if (!tour && !isStarting) {
      isFinalized = true;
      settleTutorial(false);
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      settlementResolvers.add(resolve);
    });
  }

  function disposeTutorial() {
    const activeTour = tour;
    tour = null;
    isFinalized = true;
    clearOpponentHighlights();
    isBlocking.value = false;
    settleTutorial(false);

    if (activeTour) {
      Promise.resolve(activeTour.exit(true)).catch(() => {});
    }
  }

  return {
    startTutorial,
    waitForTutorialSettlement,
    disposeTutorial,
    isBlocking,
    get hasStarted() {
      return hasStarted;
    },
  };
}
