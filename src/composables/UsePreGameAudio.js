import { watch } from "vue";
import { useAudioSettings } from "@/composables/UseAudioSettings";
import lobbyFootstepsHeels01Url from "@/assets/audio/lobby-footsteps-heels-01.mp3";
import lobbyFootstepsHeels02Url from "@/assets/audio/lobby-footsteps-heels-02.mp3";
import lobbyFootstepsHeels03Url from "@/assets/audio/lobby-footsteps-heels-03.mp3";
import lobbyFootstepsHeels04Url from "@/assets/audio/lobby-footsteps-heels-04.mp3";
import lobbyMoneyChantThemeUrl from "@/assets/audio/lobby-money-chant-theme.mp3";
import preGameLobbyThemeUrl from "@/assets/audio/pre-game-lobby-theme.mp3";
import lobbyNavigationWhooshUrl from "@/assets/audio/lobby-navigation-whoosh.mp3";
import loginButtonClickUrl from "@/assets/audio/login-button-click.mp3";
import mallEntranceBellUrl from "@/assets/audio/mall-entrance-bell.mp3";

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
  "Profile",
  "Friend",
  "Gacha",
]);

const PRE_LOGIN_ROUTE_NAME_SET = new Set(PRE_LOGIN_AUDIO_ROUTE_NAMES);
const PRE_GAME_ROUTE_NAME_SET = new Set(PRE_GAME_AUDIO_ROUTE_NAMES);
const PRESERVE_PRE_GAME_ACTIVATION_ROUTE_NAMES = new Set([
  "Mall",
  "Loading",
  "Game",
]);
const AUDIO_UNLOCK_EVENTS = ["pointerdown", "keydown", "touchstart"];
const PRE_LOGIN_MUSIC_GAIN = 1.0;
const PRE_GAME_MUSIC_GAIN = 0.2;
const LOBBY_DETAIL_GAIN = 0.2;
const LOBBY_MUSIC_FADE_IN_MS = 900;
const LOBBY_MUSIC_FADE_OUT_MS = 900;
const LOADING_MUSIC_FADE_OUT_MS = 4000;
const LOBBY_MUSIC_FADE_INTERVAL_MS = 30;
const SOUND_EFFECT_GAIN = 0.78;
const FOOTSTEP_INITIAL_DELAY_MS = 1800;
const FOOTSTEP_DELAY_MIN_MS = 10000;
const FOOTSTEP_DELAY_RANGE_MS = 14000;
const LOBBY_FOOTSTEP_LAYERS = Object.freeze([
  {
    url: lobbyFootstepsHeels01Url,
    pan: -0.62,
    delayMs: 0,
    gain: 1.05,
  },
  {
    url: lobbyFootstepsHeels02Url,
    pan: 0.58,
    delayMs: 180,
    gain: 0.92,
  },
  {
    url: lobbyFootstepsHeels03Url,
    pan: -0.12,
    delayMs: 360,
    gain: 0.95,
  },
  {
    url: lobbyFootstepsHeels04Url,
    pan: 0.28,
    delayMs: 540,
    gain: 0.94,
  },
]);

const soundEffectUrls = {
  "login-button-click": loginButtonClickUrl,
  "lobby-navigation-whoosh": lobbyNavigationWhooshUrl,
  "mall-entrance-bell": mallEntranceBellUrl,
};

let loginLobbyMusicAudio = null;
let preGameLobbyMusicAudio = null;
let lobbyMusicFadeTimerId = null;
let footstepLayers = [];
let soundEffectAudios = new Map();
let currentPreLoginRouteActive = false;
let currentPreGameRouteActive = false;
let preGameBackgroundStarted = false;
let audioUnlocked = false;
let unlockListenersInstalled = false;
let footstepTimerId = null;
let footstepLayerTimerIds = new Set();
let settingsStopHandle = null;
let audioContext = null;

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

function getAudioContext() {
  if (!canUseAudio()) {
    return null;
  }

  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextConstructor) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextConstructor();
  }

  return audioContext;
}

function resumeAudioContext() {
  const context = getAudioContext();

  if (!context || context.state !== "suspended") {
    return;
  }

  const resumeResult = context.resume();

  if (resumeResult && typeof resumeResult.catch === "function") {
    resumeResult.catch(() => {});
  }
}

function connectFootstepLayer(layer) {
  const context = getAudioContext();

  if (!context || typeof context.createStereoPanner !== "function") {
    return;
  }

  if (layer.pannerNode) {
    layer.pannerNode.pan.value = layer.pan;
    return;
  }

  try {
    layer.sourceNode = context.createMediaElementSource(layer.audio);
    layer.pannerNode = context.createStereoPanner();
    layer.pannerNode.pan.value = layer.pan;
    layer.sourceNode.connect(layer.pannerNode);
    layer.pannerNode.connect(context.destination);
  } catch {
    layer.sourceNode = null;
    layer.pannerNode = null;
  }
}

function prepareFootstepSpatialLayers() {
  if (!canUseAudio()) {
    return;
  }

  ensureFootstepAudios().forEach(connectFootstepLayer);
  resumeAudioContext();
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

  footstepLayers.forEach((layer) => {
    layer.audio.volume = getBoundedVolume(
      musicVolume.value,
      LOBBY_DETAIL_GAIN * layer.gain,
    );
  });

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

function fadeOutAudio(audio, fadeOutMs = LOBBY_MUSIC_FADE_OUT_MS) {
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
      (Date.now() - fadeStartedAt) / fadeOutMs,
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

function ensureFootstepAudios() {
  if (!footstepLayers.length) {
    footstepLayers = LOBBY_FOOTSTEP_LAYERS.map((layer) => ({
      ...layer,
      audio: createAudio(layer.url),
      sourceNode: null,
      pannerNode: null,
    }));
  }

  return footstepLayers;
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

function clearFootstepTimer() {
  if (typeof window === "undefined") {
    return;
  }

  if (footstepTimerId !== null) {
    window.clearTimeout(footstepTimerId);
    footstepTimerId = null;
  }

  footstepLayerTimerIds.forEach((timerId) => {
    window.clearTimeout(timerId);
  });
  footstepLayerTimerIds.clear();
}

function stopLobbyFootsteps() {
  clearFootstepTimer();
  footstepLayers.forEach((layer) => pauseAudio(layer.audio, { reset: true }));
}

function scheduleFootstepLayer({ initial = false } = {}) {
  if (!canUseAudio() || footstepTimerId !== null) {
    return;
  }

  const { musicEnabled } = getAudioSettings();

  if (!currentPreLoginRouteActive || !audioUnlocked || !musicEnabled.value) {
    return;
  }

  const delay = initial
    ? FOOTSTEP_INITIAL_DELAY_MS
    : FOOTSTEP_DELAY_MIN_MS + Math.random() * FOOTSTEP_DELAY_RANGE_MS;

  footstepTimerId = window.setTimeout(() => {
    footstepTimerId = null;
    playLobbyFootstep();
    scheduleFootstepLayer();
  }, delay);
}

function playFootstepLayer(layer) {
  const { musicEnabled } = getAudioSettings();

  if (!canUseAudio() || !currentPreLoginRouteActive || !musicEnabled.value) {
    return;
  }

  connectFootstepLayer(layer);
  resumeAudioContext();
  updateAudioVolumes();
  layer.audio.currentTime = 0;
  playAudio(layer.audio);
}

function playLobbyFootstep() {
  const { musicEnabled } = getAudioSettings();

  if (!canUseAudio() || !currentPreLoginRouteActive || !musicEnabled.value) {
    return;
  }

  const layers = ensureFootstepAudios();
  updateAudioVolumes();

  layers.forEach((layer) => {
    if (!layer.delayMs) {
      playFootstepLayer(layer);
      return;
    }

    const timerId = window.setTimeout(() => {
      footstepLayerTimerIds.delete(timerId);
      playFootstepLayer(layer);
    }, layer.delayMs);

    footstepLayerTimerIds.add(timerId);
  });
}

function playLoginLobbyMusic() {
  const { musicEnabled } = getAudioSettings();

  if (
    !canUseAudio() ||
    !currentPreLoginRouteActive ||
    !audioUnlocked ||
    !musicEnabled.value
  ) {
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
  updateAudioVolumes();

  const { musicEnabled } = getAudioSettings();

  if (!musicEnabled.value) {
    pauseAudio(loginLobbyMusicAudio, { reset: true });
    stopLobbyFootsteps();
    return;
  }

  installAudioUnlockListeners();

  if (!audioUnlocked) {
    return;
  }

  prepareFootstepSpatialLayers();
  playLoginLobbyMusic();
  scheduleFootstepLayer({ initial: true });
}

function stopPreGameBackground({
  fadeOut = true,
  preserveActivation = false,
  fadeOutMs = LOBBY_MUSIC_FADE_OUT_MS,
} = {}) {
  currentPreGameRouteActive = false;
  if (!preserveActivation) {
    preGameBackgroundStarted = false;
  }
  if (fadeOut) {
    fadeOutAudio(preGameLobbyMusicAudio, fadeOutMs);
  } else {
    clearLobbyMusicFade();
    pauseAudio(preGameLobbyMusicAudio, { reset: true });
  }
}

function startPreGameBackground({ fadeIn = false, userInitiated = false } = {}) {
  if (!canUseAudio()) {
    return;
  }

  const { musicEnabled, musicVolume } = getAudioSettings();

  if (userInitiated) {
    audioUnlocked = true;
    preGameBackgroundStarted = true;
    removeAudioUnlockListeners();
  }

  currentPreGameRouteActive = true;
  currentPreLoginRouteActive = false;
  clearLobbyMusicFade();
  pauseAudio(loginLobbyMusicAudio, { reset: true });
  stopLobbyFootsteps();
  ensureSettingsWatcher();
  updateAudioVolumes();

  if (
    !musicEnabled.value ||
    getBoundedVolume(musicVolume.value, PRE_GAME_MUSIC_GAIN) <= 0
  ) {
    stopPreGameBackground({ fadeOut: false, preserveActivation: true });
    currentPreGameRouteActive = true;
    return;
  }

  if (!audioUnlocked) {
    return;
  }

  playPreGameLobbyMusic({ fadeIn });
}

function removeAudioUnlockListeners() {
  if (!canUseAudio() || !unlockListenersInstalled) {
    return;
  }

  AUDIO_UNLOCK_EVENTS.forEach((eventName) => {
    window.removeEventListener(eventName, unlockAudio, true);
  });

  unlockListenersInstalled = false;
}

function unlockAudio() {
  audioUnlocked = true;
  removeAudioUnlockListeners();

  if (currentPreLoginRouteActive) {
    prepareFootstepSpatialLayers();
    playLoginLobbyMusic();
    scheduleFootstepLayer({ initial: true });
    return;
  }

  if (currentPreGameRouteActive && preGameBackgroundStarted) {
    startPreGameBackground();
  }
}

function installAudioUnlockListeners() {
  if (!canUseAudio() || unlockListenersInstalled || audioUnlocked) {
    return;
  }

  unlockListenersInstalled = true;

  AUDIO_UNLOCK_EVENTS.forEach((eventName) => {
    window.addEventListener(eventName, unlockAudio, {
      capture: true,
      once: true,
      passive: true,
    });
  });
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
          startPreLoginBackground();
        } else {
          clearLobbyMusicFade();
          pauseAudio(loginLobbyMusicAudio, { reset: true });
          stopLobbyFootsteps();
        }
        return;
      }

      if (!currentPreGameRouteActive) {
        if (!musicEnabled.value) {
          clearLobbyMusicFade();
          pauseAudio(loginLobbyMusicAudio, { reset: true });
          stopLobbyFootsteps();
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

  function syncPreGameRouteAudio(routeName, { fadeIn = false } = {}) {
    if (isPreLoginAudioRoute(routeName)) {
      startPreLoginBackground();
      return;
    }

    if (isPreGameAudioRoute(routeName)) {
      currentPreLoginRouteActive = false;
      pauseAudio(loginLobbyMusicAudio, { reset: true });
      stopLobbyFootsteps();

      currentPreGameRouteActive = true;
      if (preGameBackgroundStarted) {
        startPreGameBackground({ fadeIn });
      }
      return;
    }

    currentPreLoginRouteActive = false;
    pauseAudio(loginLobbyMusicAudio, { reset: true });
    stopLobbyFootsteps();
    stopPreGameBackground({
      fadeOut: true,
      fadeOutMs:
        routeName === "Loading"
          ? LOADING_MUSIC_FADE_OUT_MS
          : LOBBY_MUSIC_FADE_OUT_MS,
      preserveActivation:
        PRESERVE_PRE_GAME_ACTIVATION_ROUTE_NAMES.has(routeName),
    });
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
