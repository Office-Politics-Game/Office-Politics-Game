function noop() {}

export function useGameTableAudio() {
  return {
    playGameCardDealSound: noop,
    playGameCardPlaySound: noop,
    playGameCardShuffleSound: noop,
    playHrCardSwapSound: noop,
    playInternGuessResultSound: noop,
    playPlayerEliminatedSound: noop,
    playRoundWinSound: noop,
    playSeniorProtectionActivateSound: noop,
    startGameTableBackground: noop,
    stopGameTableBackground: noop,
  };
}
