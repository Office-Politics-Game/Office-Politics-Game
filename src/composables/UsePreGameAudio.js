import { watch } from "vue";
import { useAudioSettings } from "@/composables/UseAudioSettings";
import lobbyFootstepsHeels01Url from "@/assets/audio/lobby-footsteps-heels-01.mp3";
import lobbyFootstepsHeels02Url from "@/assets/audio/lobby-footsteps-heels-02.mp3";
import lobbyFootstepsHeels03Url from "@/assets/audio/lobby-footsteps-heels-03.mp3";
import lobbyFootstepsHeels04Url from "@/assets/audio/lobby-footsteps-heels-04.mp3";
import lobbyMoneyChantThemeUrl from "@/assets/audio/lobby-money-chant-theme.mp3";
import lobbyNavigationWhooshUrl from "@/assets/audio/lobby-navigation-whoosh.mp3";
import loginButtonClickUrl from "@/assets/audio/login-button-click.mp3";

export const PRE_GAME_AUDIO_ROUTE_NAMES = Object.freeze([
  "Entry",
  "Login",
  "Register",
]);

const PRE_GAME_ROUTE_NAME_SET = new Set(PRE_GAME_AUDIO_ROUTE_NAMES);
const AUDIO_UNLOCK_EVENTS = ["pointerdown", "keydown", "touchstart"];
const LOBBY_MUSIC_GAIN = 1.5;
const LOBBY_DETAIL_GAIN = 0.2;
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
};

let lobbyMusicAudio = null;
let footstepLayers = [];
let soundEffectAudios = new Map();
let currentPreGameRouteActive = false;
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

  if (lobbyMusicAudio) {
    lobbyMusicAudio.volume = getBoundedVolume(musicVolume.value, LOBBY_MUSIC_GAIN);
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

function playAudio(audio) {
  const playResult = audio.play();

  if (playResult && typeof playResult.catch === "function") {
    playResult.catch(() => {});
  }
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

function ensureLobbyMusicAudio() {
  if (!lobbyMusicAudio) {
    lobbyMusicAudio = createAudio(lobbyMoneyChantThemeUrl, { loop: true });
  }

  return lobbyMusicAudio;
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

  if (footstepTimerId) {
    window.clearTimeout(footstepTimerId);
    footstepTimerId = null;
  }

  footstepLayerTimerIds.forEach((timerId) => {
    window.clearTimeout(timerId);
  });
  footstepLayerTimerIds.clear();
}

function scheduleFootstepLayer({ initial = false } = {}) {
  if (!canUseAudio() || footstepTimerId) {
    return;
  }

  const { musicEnabled } = getAudioSettings();

  if (!currentPreGameRouteActive || !audioUnlocked || !musicEnabled.value) {
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

  if (!canUseAudio() || !currentPreGameRouteActive || !musicEnabled.value) {
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

  if (!canUseAudio() || !currentPreGameRouteActive || !musicEnabled.value) {
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

function playLobbyMusic() {
  const { musicEnabled } = getAudioSettings();

  if (!canUseAudio() || !currentPreGameRouteActive || !musicEnabled.value) {
    return;
  }

  const audio = ensureLobbyMusicAudio();
  updateAudioVolumes();
  playAudio(audio);
}

function stopPreGameBackground() {
  currentPreGameRouteActive = false;
  clearFootstepTimer();
  pauseAudio(lobbyMusicAudio, { reset: true });
  footstepLayers.forEach((layer) => pauseAudio(layer.audio, { reset: true }));
}

function startPreGameBackground() {
  if (!canUseAudio()) {
    return;
  }

  const { musicEnabled } = getAudioSettings();

  currentPreGameRouteActive = true;
  ensureSettingsWatcher();
  installAudioUnlockListeners();
  updateAudioVolumes();

  if (!musicEnabled.value) {
    stopPreGameBackground();
    currentPreGameRouteActive = true;
    return;
  }

  if (!audioUnlocked) {
    return;
  }

  playLobbyMusic();
  scheduleFootstepLayer({ initial: true });
}

function unlockAudio() {
  audioUnlocked = true;

  AUDIO_UNLOCK_EVENTS.forEach((eventName) => {
    window.removeEventListener(eventName, unlockAudio, true);
  });

  if (currentPreGameRouteActive) {
    prepareFootstepSpatialLayers();
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

      if (!currentPreGameRouteActive) {
        return;
      }

      if (musicEnabled.value) {
        startPreGameBackground();
      } else {
        clearFootstepTimer();
        pauseAudio(lobbyMusicAudio, { reset: true });
        footstepLayers.forEach((layer) => pauseAudio(layer.audio, { reset: true }));
      }
    },
    { flush: "sync" },
  );
}

export function usePreGameAudio() {
  ensureSettingsWatcher();

  function syncPreGameRouteAudio(routeName) {
    if (isPreGameAudioRoute(routeName)) {
      startPreGameBackground();
      return;
    }

    stopPreGameBackground();
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
    syncPreGameRouteAudio,
  };
}
