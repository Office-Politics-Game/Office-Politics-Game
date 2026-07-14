import { watch } from "vue";
import { useAudioSettings } from "@/composables/UseAudioSettings";
import gameCardShuffleSoundUrl from "@/assets/audio/game-card-shuffle.ogg";
import gameTableStartThemeUrl from "@/assets/audio/game-table-start-theme.mp3";

const GAME_TABLE_MUSIC_GAIN = 0.2;
const GAME_TABLE_MUSIC_FADE_IN_MS = 5000;
const GAME_TABLE_MUSIC_FADE_INTERVAL_MS = 30;
const GAME_CARD_SHUFFLE_SOUND_DURATION_MS = 1200;
const GAME_CARD_SHUFFLE_LAYER_DELAY_MS = 100;
const GAME_CARD_SHUFFLE_PRIMARY_GAIN = 0.25;
const GAME_CARD_SHUFFLE_SECONDARY_GAIN = 0.15;

let gameTableMusicAudio = null;
let gameTableMusicFadeTimerId = null;
let gameTableBackgroundActive = false;
let gameCardShuffleAudios = null;
let gameCardShuffleTimerIds = [];
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
    playGameCardShuffleSound,
    startGameTableBackground,
    stopGameTableBackground,
  };
}
