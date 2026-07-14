import { watch } from "vue";
import { useAudioSettings } from "@/composables/UseAudioSettings";
import gameTableStartThemeUrl from "@/assets/audio/game-table-start-theme.mp3";

const GAME_TABLE_MUSIC_GAIN = 0.2;
const GAME_TABLE_MUSIC_FADE_IN_MS = 5000;
const GAME_TABLE_MUSIC_FADE_INTERVAL_MS = 30;

let gameTableMusicAudio = null;
let gameTableMusicFadeTimerId = null;
let gameTableBackgroundActive = false;
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
    startGameTableBackground,
    stopGameTableBackground,
  };
}
