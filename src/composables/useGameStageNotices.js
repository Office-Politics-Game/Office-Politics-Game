import { nextTick, ref } from "vue";

const NOTICE_CLOSE_ACK_BUFFER_MS = 600;
const MANAGER_EFFECT_ACK_BUFFER_MS = 900;

function getRoundWinSnapshot(players) {
  return Object.fromEntries(
    players.map((player) => [String(player.id), Number(player.roundWins ?? 0)]),
  );
}

function getEliminatedSnapshot(players) {
  return Object.fromEntries(
    players.map((player) => [String(player.id), Boolean(player.isEliminated)]),
  );
}

export function useGameStageNotices({
  props,
  isInitialRoundDrawAnimating,
  activeEffectResult,
  getInitialRoundDealSignature,
  lastInitialRoundDealSignature,
  playPlayerEliminatedSound = () => {},
} = {}) {
  const isTurnNoticeOpen = ref(false);
  const isRoundStartNoticeOpen = ref(false);
  const isRoundWinnerNoticeOpen = ref(false);
  const roundWinnerNotice = ref(null);
  const isPlayerEliminatedNoticeOpen = ref(false);
  const playerEliminatedNotice = ref(null);
  const lastRoundStartNoticeKey = ref(null);
  const pendingNoticeOpenCount = ref(0);
  const pendingNoticeAckDelayCount = ref(0);

  let roundStartNoticeResolve = null;
  const noticeIdleResolvers = [];
  const noticeAckDelayTimers = new Set();

  const roundStartNoticeText = ref("");

  function getRoundStartNoticeKey(signature) {
    return signature ? `${props.roundNumber}:${signature}` : null;
  }

  function settleRoundStartNotice(completed = false) {
    const resolve = roundStartNoticeResolve;
    roundStartNoticeResolve = null;
    resolve?.(completed);
    resolveNoticeIdleIfIdle();
  }

  function closeRoundStartNotice() {
    if (isRoundStartNoticeOpen.value) {
      holdNoticeAckAfterClose();
    }

    isRoundStartNoticeOpen.value = false;
    settleRoundStartNotice(true);
  }

  function isNoticeIdle() {
    return (
      pendingNoticeOpenCount.value === 0 &&
      pendingNoticeAckDelayCount.value === 0 &&
      !isTurnNoticeOpen.value &&
      !isRoundStartNoticeOpen.value &&
      !isRoundWinnerNoticeOpen.value &&
      !isPlayerEliminatedNoticeOpen.value &&
      !isInitialRoundDrawAnimating.value &&
      !activeEffectResult.value
    );
  }

  function resolveNoticeIdleIfIdle() {
    if (!isNoticeIdle()) {
      return;
    }

    while (noticeIdleResolvers.length > 0) {
      noticeIdleResolvers.shift()?.(true);
    }
  }

  function waitForNoticeIdle() {
    if (isNoticeIdle()) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      noticeIdleResolvers.push(resolve);
    });
  }

  function scheduleNoticeOpen(openNotice) {
    pendingNoticeOpenCount.value += 1;

    nextTick(() => {
      pendingNoticeOpenCount.value = Math.max(
        0,
        pendingNoticeOpenCount.value - 1,
      );
      openNotice();
      resolveNoticeIdleIfIdle();
    });
  }

  function holdNoticeAckAfterClose(durationMs = NOTICE_CLOSE_ACK_BUFFER_MS) {
    const timer = window.setTimeout(() => {
      noticeAckDelayTimers.delete(timer);
      pendingNoticeAckDelayCount.value = noticeAckDelayTimers.size;
      resolveNoticeIdleIfIdle();
    }, durationMs);

    noticeAckDelayTimers.add(timer);
    pendingNoticeAckDelayCount.value = noticeAckDelayTimers.size;
  }

  function closeTurnNotice() {
    if (isTurnNoticeOpen.value) {
      holdNoticeAckAfterClose();
    }

    isTurnNoticeOpen.value = false;
    resolveNoticeIdleIfIdle();
  }

  function closeRoundWinnerNotice() {
    if (isRoundWinnerNoticeOpen.value) {
      holdNoticeAckAfterClose();
    }

    isRoundWinnerNoticeOpen.value = false;
    resolveNoticeIdleIfIdle();
  }

  function closePlayerEliminatedNotice() {
    if (isPlayerEliminatedNoticeOpen.value) {
      holdNoticeAckAfterClose();
    }

    isPlayerEliminatedNoticeOpen.value = false;
    resolveNoticeIdleIfIdle();
  }

  async function playRoundStartNotice(signature = getInitialRoundDealSignature()) {
    const noticeKey = getRoundStartNoticeKey(signature);

    if (
      !noticeKey ||
      isRoundWinnerNoticeOpen.value ||
      isPlayerEliminatedNoticeOpen.value ||
      lastRoundStartNoticeKey.value === noticeKey
    ) {
      return false;
    }

    lastRoundStartNoticeKey.value = noticeKey;
    roundStartNoticeText.value = `第 ${props.roundNumber} 回合開始`;
    isTurnNoticeOpen.value = false;
    isRoundStartNoticeOpen.value = false;
    settleRoundStartNotice(false);

    await nextTick();

    return new Promise((resolve) => {
      roundStartNoticeResolve = resolve;
      isRoundStartNoticeOpen.value = true;
    });
  }

  function playTurnNotice({ force = false } = {}) {
    const initialRoundDealSignature = getInitialRoundDealSignature();

    if (
      isRoundStartNoticeOpen.value ||
      isRoundWinnerNoticeOpen.value ||
      isPlayerEliminatedNoticeOpen.value ||
      isInitialRoundDrawAnimating.value ||
      (!force &&
        initialRoundDealSignature &&
        lastInitialRoundDealSignature.value !== initialRoundDealSignature)
    ) {
      return;
    }

    isTurnNoticeOpen.value = false;

    scheduleNoticeOpen(() => {
      isTurnNoticeOpen.value = true;
    });
  }

  function playRoundWinnerNotice(player) {
    if (!player) {
      return;
    }

    isRoundStartNoticeOpen.value = false;
    settleRoundStartNotice(false);
    isTurnNoticeOpen.value = false;
    isPlayerEliminatedNoticeOpen.value = false;
    isRoundWinnerNoticeOpen.value = false;
    roundWinnerNotice.value = {
      name: player.name,
      avatarUrl: player.avatarUrl,
    };

    scheduleNoticeOpen(() => {
      isRoundWinnerNoticeOpen.value = true;
    });
  }

  function playPlayerEliminatedNotice(player) {
    if (!player) {
      return;
    }

    isRoundStartNoticeOpen.value = false;
    settleRoundStartNotice(false);
    isTurnNoticeOpen.value = false;
    isRoundWinnerNoticeOpen.value = false;
    isPlayerEliminatedNoticeOpen.value = false;
    playerEliminatedNotice.value = {
      name: player.name,
      avatarUrl: player.avatarUrl,
    };

    scheduleNoticeOpen(() => {
      isPlayerEliminatedNoticeOpen.value = true;
      playPlayerEliminatedSound();
    });
  }

  function cleanupNotices() {
    settleRoundStartNotice(false);
    noticeAckDelayTimers.forEach((timer) => window.clearTimeout(timer));
    noticeAckDelayTimers.clear();
    pendingNoticeAckDelayCount.value = 0;
  }

  return {
    isTurnNoticeOpen,
    isRoundStartNoticeOpen,
    isRoundWinnerNoticeOpen,
    roundWinnerNotice,
    isPlayerEliminatedNoticeOpen,
    playerEliminatedNotice,
    roundStartNoticeText,
    pendingNoticeOpenCount,
    pendingNoticeAckDelayCount,
    playRoundStartNotice,
    playTurnNotice,
    playRoundWinnerNotice,
    playPlayerEliminatedNotice,
    closeRoundStartNotice,
    closeTurnNotice,
    closeRoundWinnerNotice,
    closePlayerEliminatedNotice,
    waitForNoticeIdle,
    resolveNoticeIdleIfIdle,
    holdNoticeAckAfterClose,
    cleanupNotices,
  };
}

export {
  getEliminatedSnapshot,
  getRoundWinSnapshot,
  MANAGER_EFFECT_ACK_BUFFER_MS,
  NOTICE_CLOSE_ACK_BUFFER_MS,
};
