import { watch } from "vue";
import { useAudioSettings } from "@/composables/UseAudioSettings";
import gameCardDealSoundUrl from "@/assets/audio/game-card-draw.mp3";
import gameCardPlaySoundUrl from "@/assets/audio/game-card-play-rise.mp3";
import gameCardShuffleSoundUrl from "@/assets/audio/game-card-shuffle.ogg";
import gameSeniorProtectionActivateSoundUrl from "@/assets/audio/game-senior-protection-activate.mp3";
import gameTableStartThemeUrl from "@/assets/audio/game-table-start-theme.mp3";
import internGuessCorrectSoundUrl from "@/assets/audio/intern-guess-correct.mp3";
import internGuessIncorrectSoundUrl from "@/assets/audio/intern-guess-incorrect.mp3";

const GAME_TABLE_MUSIC_GAIN = 0.2;
const GAME_TABLE_MUSIC_FADE_IN_MS = 5000;
const GAME_TABLE_MUSIC_FADE_INTERVAL_MS = 30;
const GAME_CARD_SHUFFLE_SOUND_DURATION_MS = 1200;
const GAME_CARD_SHUFFLE_LAYER_DELAY_MS = 100;
const GAME_CARD_SHUFFLE_PRIMARY_GAIN = 0.25;
const GAME_CARD_SHUFFLE_SECONDARY_GAIN = 0.15;
const GAME_CARD_DEAL_SOUND_GAIN = 0.35;
const GAME_CARD_PLAY_SOUND_GAIN = 0.4;
const GAME_SENIOR_PROTECTION_ACTIVATE_SOUND_GAIN = 0.45;
const INTERN_GUESS_RESULT_SOUND_GAIN = 0.45;

let gameTableMusicAudio = null;
let gameTableMusicFadeTimerId = null;
let gameTableBackgroundActive = false;
let gameCardDealAudio = null;
let gameCardPlayAudio = null;
let gameCardShuffleAudios = null;
let gameCardShuffleTimerIds = [];
let gameSeniorProtectionActivateAudio = null;
let internGuessResultAudios = null;
let settingsStopHandle = null;

function canUseAudio() {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

function getBoundedGameTableVolume(volume) {
  const numericVolume = Number(volume);

  if (!Number.isFinite(numericVolume)) {
    return GAME_TABLE_MUSIC_GAIN;
  }

  return (
    Math.min(1, Math.max(0, numericVolume / 100)) * GAME_TABLE_MUSIC_GAIN
  );
}

function getGameTableTargetVolume() {
  const { musicVolume } = useAudioSettings();
  return getBoundedGameTableVolume(musicVolume.value);
}

function getBoundedGameTableSoundVolume(volume) {
  const numericVolume = Number(volume);

  if (!Number.isFinite(numericVolume)) {
    return 1;
  }

  return Math.min(1, Math.max(0, numericVolume / 100));
}

function ensureGameTableMusicAudio() {
  if (!gameTableMusicAudio) {
    const audio = new Audio(gameTableStartThemeUrl);
    audio.loop = false;
    audio.preload = "auto";
    audio.addEventListener("ended", handleGameTableMusicEnded);
    gameTableMusicAudio = audio;
  }

  return gameTableMusicAudio;
}

function ensureGameCardShuffleAudios() {
  if (!gameCardShuffleAudios) {
    gameCardShuffleAudios = [
      new Audio(gameCardShuffleSoundUrl),
      new Audio(gameCardShuffleSoundUrl),
    ];
    gameCardShuffleAudios.forEach((audio) => {
      audio.preload = "auto";
    });
  }

  return gameCardShuffleAudios;
}

function ensureGameCardDealAudio() {
  if (!gameCardDealAudio) {
    const audio = new Audio(gameCardDealSoundUrl);
    audio.preload = "auto";
    gameCardDealAudio = audio;
  }

  return gameCardDealAudio;
}

function ensureGameCardPlayAudio() {
  if (!gameCardPlayAudio) {
    const audio = new Audio(gameCardPlaySoundUrl);
    audio.preload = "auto";
    gameCardPlayAudio = audio;
  }

  return gameCardPlayAudio;
}

function ensureInternGuessResultAudios() {
  if (!internGuessResultAudios) {
    internGuessResultAudios = {
      correct: new Audio(internGuessCorrectSoundUrl),
      incorrect: new Audio(internGuessIncorrectSoundUrl),
    };
    Object.values(internGuessResultAudios).forEach((audio) => {
      audio.preload = "auto";
    });
  }

  return internGuessResultAudios;
}

function ensureGameSeniorProtectionActivateAudio() {
  if (!gameSeniorProtectionActivateAudio) {
    const audio = new Audio(gameSeniorProtectionActivateSoundUrl);
    audio.preload = "auto";
    gameSeniorProtectionActivateAudio = audio;
  }

  return gameSeniorProtectionActivateAudio;
}

function clearGameCardShuffleTimers() {
  gameCardShuffleTimerIds.forEach((timerId) => window.clearTimeout(timerId));
  gameCardShuffleTimerIds = [];
}

function pauseAndResetGameCardShuffleAudio(audio) {
  audio.pause();
  audio.currentTime = 0;
}

function stopGameCardShuffleSounds() {
  clearGameCardShuffleTimers();
  gameCardShuffleAudios?.forEach(pauseAndResetGameCardShuffleAudio);
}

function scheduleGameCardShuffleAction(action, delayMs) {
  gameCardShuffleTimerIds.push(window.setTimeout(action, delayMs));
}

function clearGameTableMusicFade() {
  if (gameTableMusicFadeTimerId === null) {
    return;
  }

  if (typeof window !== "undefined") {
    window.clearInterval(gameTableMusicFadeTimerId);
  }

  gameTableMusicFadeTimerId = null;
}

function pauseAndResetGameTableMusic() {
  const audio = gameTableMusicAudio;

  if (!audio) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
  audio.volume = 0;
}

function playAudio(audio) {
  try {
    const playResult = audio.play();

    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => {});
    }
  } catch {
    // Browser playback policies must not block the game table.
  }
}

function playGameCardShuffleSound() {
  if (!canUseAudio()) {
    return;
  }

  stopGameCardShuffleSounds();

  const { soundEnabled, soundVolume } = useAudioSettings();
  const targetVolume = getBoundedGameTableSoundVolume(soundVolume.value);

  if (!soundEnabled.value || targetVolume <= 0) {
    return;
  }

  const [primaryAudio, secondaryAudio] = ensureGameCardShuffleAudios();
  primaryAudio.volume = targetVolume * GAME_CARD_SHUFFLE_PRIMARY_GAIN;
  secondaryAudio.volume = targetVolume * GAME_CARD_SHUFFLE_SECONDARY_GAIN;
  playAudio(primaryAudio);

  scheduleGameCardShuffleAction(
    () => playAudio(secondaryAudio),
    GAME_CARD_SHUFFLE_LAYER_DELAY_MS,
  );
  scheduleGameCardShuffleAction(
    () => pauseAndResetGameCardShuffleAudio(primaryAudio),
    GAME_CARD_SHUFFLE_SOUND_DURATION_MS,
  );
  scheduleGameCardShuffleAction(
    () => pauseAndResetGameCardShuffleAudio(secondaryAudio),
    GAME_CARD_SHUFFLE_LAYER_DELAY_MS + GAME_CARD_SHUFFLE_SOUND_DURATION_MS,
  );
}

function playGameCardDealSound() {
  if (!canUseAudio()) {
    return;
  }

  const { soundEnabled, soundVolume } = useAudioSettings();
  const targetVolume = getBoundedGameTableSoundVolume(soundVolume.value);

  if (!soundEnabled.value || targetVolume <= 0) {
    return;
  }

  const audio = ensureGameCardDealAudio();
  audio.currentTime = 0;
  audio.volume = targetVolume * GAME_CARD_DEAL_SOUND_GAIN;
  playAudio(audio);
}

function playGameCardPlaySound() {
  if (!canUseAudio()) {
    return;
  }

  const { soundEnabled, soundVolume } = useAudioSettings();
  const targetVolume = getBoundedGameTableSoundVolume(soundVolume.value);

  if (!soundEnabled.value || targetVolume <= 0) {
    return;
  }

  const audio = ensureGameCardPlayAudio();
  audio.currentTime = 0;
  audio.volume = targetVolume * GAME_CARD_PLAY_SOUND_GAIN;
  playAudio(audio);
}

function playInternGuessResultSound(outcome) {
  if (!canUseAudio() || !["correct", "incorrect"].includes(outcome)) {
    return;
  }

  const { soundEnabled, soundVolume } = useAudioSettings();
  const targetVolume = getBoundedGameTableSoundVolume(soundVolume.value);

  if (!soundEnabled.value || targetVolume <= 0) {
    return;
  }

  const audio = ensureInternGuessResultAudios()[outcome];
  audio.currentTime = 0;
  audio.volume = targetVolume * INTERN_GUESS_RESULT_SOUND_GAIN;
  playAudio(audio);
}

function playSeniorProtectionActivateSound() {
  if (!canUseAudio()) {
    return;
  }

  const { soundEnabled, soundVolume } = useAudioSettings();
  const targetVolume = getBoundedGameTableSoundVolume(soundVolume.value);

  if (!soundEnabled.value || targetVolume <= 0) {
    return;
  }

  const audio = ensureGameSeniorProtectionActivateAudio();
  audio.currentTime = 0;
  audio.volume = targetVolume * GAME_SENIOR_PROTECTION_ACTIVATE_SOUND_GAIN;
  playAudio(audio);
}

function fadeInGameTableMusic(audio) {
  clearGameTableMusicFade();
  audio.volume = 0;
  playAudio(audio);

  if (typeof window === "undefined") {
    audio.volume = getGameTableTargetVolume();
    return;
  }

  const fadeStartedAt = Date.now();

  gameTableMusicFadeTimerId = window.setInterval(() => {
    const progress = Math.min(
      1,
      (Date.now() - fadeStartedAt) / GAME_TABLE_MUSIC_FADE_IN_MS,
    );

    audio.volume = getGameTableTargetVolume() * progress;

    if (progress >= 1) {
      clearGameTableMusicFade();
      audio.volume = getGameTableTargetVolume();
    }
  }, GAME_TABLE_MUSIC_FADE_INTERVAL_MS);
}

function handleGameTableMusicEnded() {
  const { musicEnabled } = useAudioSettings();
  const targetVolume = getGameTableTargetVolume();

  if (!gameTableBackgroundActive || !musicEnabled.value || targetVolume <= 0) {
    return;
  }

  const audio = gameTableMusicAudio;

  if (!audio) {
    return;
  }

  audio.currentTime = 0;
  fadeInGameTableMusic(audio);
}

function startGameTableBackground() {
  gameTableBackgroundActive = true;
  ensureSettingsWatcher();

  if (!canUseAudio()) {
    return;
  }

  const { musicEnabled } = useAudioSettings();
  const targetVolume = getGameTableTargetVolume();

  if (!musicEnabled.value || targetVolume <= 0) {
    return;
  }

  const audio = ensureGameTableMusicAudio();

  if (!audio.paused || gameTableMusicFadeTimerId !== null) {
    return;
  }

  fadeInGameTableMusic(audio);
}

function stopGameTableBackground() {
  gameTableBackgroundActive = false;
  clearGameTableMusicFade();
  pauseAndResetGameTableMusic();
}

function ensureSettingsWatcher() {
  if (settingsStopHandle) {
    return;
  }

  const { musicEnabled, musicVolume } = useAudioSettings();

  settingsStopHandle = watch(
    [musicEnabled, musicVolume],
    () => {
      if (!gameTableBackgroundActive || !canUseAudio()) {
        return;
      }

      const targetVolume = getGameTableTargetVolume();

      if (!musicEnabled.value || targetVolume <= 0) {
        clearGameTableMusicFade();
        pauseAndResetGameTableMusic();
        return;
      }

      const audio = ensureGameTableMusicAudio();

      if (audio.paused) {
        startGameTableBackground();
        return;
      }

      if (gameTableMusicFadeTimerId === null) {
        audio.volume = targetVolume;
      }
    },
    { flush: "sync" },
  );
}

export function useGameTableAudio() {
  ensureSettingsWatcher();

  return {
    playGameCardDealSound,
    playGameCardPlaySound,
    playGameCardShuffleSound,
    playInternGuessResultSound,
    playSeniorProtectionActivateSound,
    startGameTableBackground,
    stopGameTableBackground,
  };
}
