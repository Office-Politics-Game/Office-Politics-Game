import { watch } from "vue";
import { useAudioSettings } from "@/composables/UseAudioSettings";
import lobbyMoneyChantThemeUrl from "@/assets/audio/lobby-money-chant-theme.mp3";
import preGameLobbyThemeUrl from "@/assets/audio/pre-game-lobby-theme.mp3";
import lobbyNavigationWhooshUrl from "@/assets/audio/lobby-navigation-whoosh.mp3";
import loginButtonClickUrl from "@/assets/audio/login-button-click.mp3";

export const PRE_LOGIN_AUDIO_ROUTE_NAMES = Object.freeze([
  "Entry",
  "Login",
  "Register",
]);

export const PRE_GAME_AUDIO_ROUTE_NAMES = Object.freeze([
  "LobbyHome",
  "LobbyGameMenu",
  "Matching",
  "JoinRoom",
  "CustomRoom",
  "Loading",
]);

const PRE_LOGIN_ROUTE_NAME_SET = new Set(PRE_LOGIN_AUDIO_ROUTE_NAMES);
const PRE_GAME_ROUTE_NAME_SET = new Set(PRE_GAME_AUDIO_ROUTE_NAMES);
const PRE_LOGIN_MUSIC_GAIN = 1.8;
const PRE_GAME_MUSIC_GAIN = 0.2;
const LOBBY_MUSIC_FADE_IN_MS = 900;
const LOBBY_MUSIC_FADE_OUT_MS = 900;
const LOBBY_MUSIC_FADE_INTERVAL_MS = 30;
const SOUND_EFFECT_GAIN = 0.78;

const soundEffectUrls = {
  "login-button-click": loginButtonClickUrl,
  "lobby-navigation-whoosh": lobbyNavigationWhooshUrl,
};

let loginLobbyMusicAudio = null;
let preGameLobbyMusicAudio = null;
let lobbyMusicFadeTimerId = null;
let soundEffectAudios = new Map();
let currentPreLoginRouteActive = false;
let currentPreGameRouteActive = false;
let preGameBackgroundStarted = false;
let audioUnlocked = false;
let settingsStopHandle = null;

function canUseAudio() {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

function getBoundedVolume(volume, gain = 1) {
  const numericVolume = Number(volume);

  if (!Number.isFinite(numericVolume)) {
    return gain;
  }

  return Math.min(1, Math.max(0, numericVolume / 100)) * gain;
}

export function isPreGameAudioRoute(routeName) {
  return PRE_GAME_ROUTE_NAME_SET.has(String(routeName ?? ""));
}

export function isPreLoginAudioRoute(routeName) {
  return PRE_LOGIN_ROUTE_NAME_SET.has(String(routeName ?? ""));
}

function createAudio(url, { loop = false } = {}) {
  const audio = new Audio(url);
  audio.loop = loop;
  audio.preload = "auto";
  return audio;
}

function getAudioSettings() {
  return useAudioSettings();
}

function updateAudioVolumes() {
  const { musicVolume, soundVolume } = getAudioSettings();

  if (loginLobbyMusicAudio) {
    loginLobbyMusicAudio.volume = getBoundedVolume(
      musicVolume.value,
      PRE_LOGIN_MUSIC_GAIN,
    );
  }

  if (preGameLobbyMusicAudio) {
    preGameLobbyMusicAudio.volume = getBoundedVolume(
      musicVolume.value,
      PRE_GAME_MUSIC_GAIN,
    );
  }

  soundEffectAudios.forEach((audio) => {
    audio.volume = getBoundedVolume(soundVolume.value, SOUND_EFFECT_GAIN);
  });
}

function pauseAudio(audio, { reset = false } = {}) {
  if (!audio) {
    return;
  }

  audio.pause();

  if (reset) {
    audio.currentTime = 0;
  }
}

function clearLobbyMusicFade() {
  if (lobbyMusicFadeTimerId === null) {
    return;
  }

  if (typeof window !== "undefined") {
    window.clearInterval(lobbyMusicFadeTimerId);
  }

  lobbyMusicFadeTimerId = null;
}

function fadeOutAudio(audio) {
  if (!audio) {
    return;
  }

  clearLobbyMusicFade();

  if (
    typeof window === "undefined" ||
    audio.paused ||
    audio.volume <= 0
  ) {
    pauseAudio(audio, { reset: true });
    return;
  }

  const initialVolume = audio.volume;
  const fadeStartedAt = Date.now();

  lobbyMusicFadeTimerId = window.setInterval(() => {
    const progress = Math.min(
      1,
      (Date.now() - fadeStartedAt) / LOBBY_MUSIC_FADE_OUT_MS,
    );

    audio.volume = initialVolume * (1 - progress);

    if (progress >= 1) {
      clearLobbyMusicFade();
      pauseAudio(audio, { reset: true });
      updateAudioVolumes();
    }
  }, LOBBY_MUSIC_FADE_INTERVAL_MS);
}

function fadeInAudio(audio, targetVolume = audio?.volume ?? 0) {
  if (!audio) {
    return;
  }

  clearLobbyMusicFade();

  if (targetVolume <= 0) {
    playAudio(audio);
    return;
  }

  const initialVolume = audio.paused
    ? 0
    : Math.min(audio.volume, targetVolume);

  if (!audio.paused && initialVolume >= targetVolume) {
    audio.volume = targetVolume;
    return;
  }

  audio.volume = initialVolume;

  if (audio.paused) {
    playAudio(audio);
  }

  if (typeof window === "undefined") {
    audio.volume = targetVolume;
    return;
  }

  const fadeStartedAt = Date.now();

  lobbyMusicFadeTimerId = window.setInterval(() => {
    const progress = Math.min(
      1,
      (Date.now() - fadeStartedAt) / LOBBY_MUSIC_FADE_IN_MS,
    );

    audio.volume =
      initialVolume + (targetVolume - initialVolume) * progress;

    if (progress >= 1) {
      clearLobbyMusicFade();
      audio.volume = targetVolume;
    }
  }, LOBBY_MUSIC_FADE_INTERVAL_MS);
}

function playAudio(audio) {
  const playResult = audio.play();

  if (playResult && typeof playResult.catch === "function") {
    playResult.catch(() => {});
  }
}

function ensureLoginLobbyMusicAudio() {
  if (!loginLobbyMusicAudio) {
    loginLobbyMusicAudio = createAudio(lobbyMoneyChantThemeUrl, { loop: true });
  }

  return loginLobbyMusicAudio;
}

function ensurePreGameLobbyMusicAudio() {
  if (!preGameLobbyMusicAudio) {
    preGameLobbyMusicAudio = createAudio(preGameLobbyThemeUrl, { loop: true });
  }

  return preGameLobbyMusicAudio;
}

function ensureSoundEffectAudio(soundName) {
  const soundUrl = soundEffectUrls[soundName];

  if (!soundUrl) {
    return null;
  }

  if (!soundEffectAudios.has(soundName)) {
    soundEffectAudios.set(soundName, createAudio(soundUrl));
  }

  return soundEffectAudios.get(soundName);
}

function playLoginLobbyMusic() {
  const { musicEnabled } = getAudioSettings();

  if (!canUseAudio() || !currentPreLoginRouteActive || !musicEnabled.value) {
    return;
  }

  const audio = ensureLoginLobbyMusicAudio();
  updateAudioVolumes();
  playAudio(audio);
}

function playPreGameLobbyMusic({ fadeIn = false } = {}) {
  const { musicEnabled } = getAudioSettings();

  if (!canUseAudio() || !currentPreGameRouteActive || !musicEnabled.value) {
    return;
  }

  const audio = ensurePreGameLobbyMusicAudio();
  const currentVolume = audio.volume;
  updateAudioVolumes();
  if (fadeIn) {
    if (!audio.paused && currentVolume < audio.volume) {
      audio.volume = currentVolume;
    }
    fadeInAudio(audio, audio.volume);
    return;
  }

  playAudio(audio);
}

function startPreLoginBackground() {
  if (!canUseAudio()) {
    return;
  }

  currentPreLoginRouteActive = true;
  currentPreGameRouteActive = false;
  preGameBackgroundStarted = false;
  clearLobbyMusicFade();
  pauseAudio(preGameLobbyMusicAudio, { reset: true });
  ensureSettingsWatcher();

  const { musicEnabled } = getAudioSettings();

  if (!musicEnabled.value) {
    pauseAudio(loginLobbyMusicAudio, { reset: true });
    return;
  }

  playLoginLobbyMusic();
}

function stopPreGameBackground({ fadeOut = true, preserveActivation = false } = {}) {
  currentPreGameRouteActive = false;
  if (!preserveActivation) {
    preGameBackgroundStarted = false;
  }
  if (fadeOut) {
    fadeOutAudio(preGameLobbyMusicAudio);
  } else {
    clearLobbyMusicFade();
    pauseAudio(preGameLobbyMusicAudio, { reset: true });
  }
}

function startPreGameBackground({ fadeIn = false, userInitiated = false } = {}) {
  if (!canUseAudio()) {
    return;
  }

  const { musicEnabled } = getAudioSettings();

  if (userInitiated) {
    audioUnlocked = true;
    preGameBackgroundStarted = true;
  }

  currentPreGameRouteActive = true;
  currentPreLoginRouteActive = false;
  clearLobbyMusicFade();
  pauseAudio(loginLobbyMusicAudio, { reset: true });
  ensureSettingsWatcher();
  updateAudioVolumes();

  if (!musicEnabled.value) {
    stopPreGameBackground({ fadeOut: false, preserveActivation: true });
    currentPreGameRouteActive = true;
    return;
  }

  if (!audioUnlocked) {
    return;
  }

  playPreGameLobbyMusic({ fadeIn });
}

function ensureSettingsWatcher() {
  if (settingsStopHandle) {
    return;
  }

  const { musicEnabled, musicVolume, soundEnabled, soundVolume } = getAudioSettings();

  settingsStopHandle = watch(
    [musicEnabled, musicVolume, soundEnabled, soundVolume],
    () => {
      updateAudioVolumes();

      if (currentPreLoginRouteActive) {
        if (musicEnabled.value) {
          playLoginLobbyMusic();
        } else {
          clearLobbyMusicFade();
          pauseAudio(loginLobbyMusicAudio, { reset: true });
        }
        return;
      }

      if (!currentPreGameRouteActive) {
        if (!musicEnabled.value) {
          clearLobbyMusicFade();
          pauseAudio(loginLobbyMusicAudio, { reset: true });
          pauseAudio(preGameLobbyMusicAudio, { reset: true });
        }
        return;
      }

      if (!preGameBackgroundStarted) {
        return;
      }

      if (musicEnabled.value) {
          startPreGameBackground();
        } else {
          clearLobbyMusicFade();
          pauseAudio(preGameLobbyMusicAudio, { reset: true });
        }
    },
    { flush: "sync" },
  );
}

export function usePreGameAudio() {
  ensureSettingsWatcher();

  function syncPreGameRouteAudio(routeName) {
    if (isPreLoginAudioRoute(routeName)) {
      startPreLoginBackground();
      return;
    }

    if (isPreGameAudioRoute(routeName)) {
      currentPreGameRouteActive = true;
      currentPreLoginRouteActive = false;
      pauseAudio(loginLobbyMusicAudio, { reset: true });
      if (preGameBackgroundStarted) {
        startPreGameBackground();
      }
      return;
    }

    currentPreLoginRouteActive = false;
    pauseAudio(loginLobbyMusicAudio, { reset: true });
    stopPreGameBackground({ fadeOut: true });
  }

  function playPreGameSound(soundName) {
    if (!canUseAudio()) {
      return;
    }

    const { soundEnabled } = getAudioSettings();

    if (!soundEnabled.value) {
      return;
    }

    const audio = ensureSoundEffectAudio(soundName);

    if (!audio) {
      return;
    }

    updateAudioVolumes();
    audio.currentTime = 0;
    playAudio(audio);
  }

  return {
    playPreGameSound,
    startPreGameBackground,
    stopPreGameBackground,
    syncPreGameRouteAudio,
  };
}
