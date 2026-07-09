import { watch } from "vue";
import { useAudioSettings } from "@/composables/UseAudioSettings";
import lobbyAmbienceOfficeUrl from "@/assets/audio/lobby-ambience-office-60s.mp3";
import lobbyFootstepsHeels01Url from "@/assets/audio/lobby-footsteps-heels-01.mp3";
import lobbyFootstepsHeels02Url from "@/assets/audio/lobby-footsteps-heels-02.mp3";
import lobbyNavigationWhooshUrl from "@/assets/audio/lobby-navigation-whoosh.mp3";
import loginButtonClickUrl from "@/assets/audio/login-button-click.mp3";

export const PRE_GAME_AUDIO_ROUTE_NAMES = Object.freeze([
  "Entry",
  "Login",
  "Register",
  "Lobby",
  "LobbyHome",
  "LobbyGameMenu",
  "GameMenu",
  "Friend",
  "Profile",
  "Mall",
  "Matching",
  "JoinRoom",
  "CustomRoom",
  "InviteFriend",
]);

const PRE_GAME_ROUTE_NAME_SET = new Set(PRE_GAME_AUDIO_ROUTE_NAMES);
const AUDIO_UNLOCK_EVENTS = ["pointerdown", "keydown", "touchstart"];
const LOBBY_AMBIENCE_GAIN = 0.28;
const LOBBY_DETAIL_GAIN = 0.36;
const SOUND_EFFECT_GAIN = 0.78;
const FOOTSTEP_DELAY_MIN_MS = 10000;
const FOOTSTEP_DELAY_RANGE_MS = 14000;

const soundEffectUrls = {
  "login-button-click": loginButtonClickUrl,
  "lobby-navigation-whoosh": lobbyNavigationWhooshUrl,
};

const lobbyFootstepUrls = [
  lobbyFootstepsHeels01Url,
  lobbyFootstepsHeels02Url,
];

let ambienceAudio = null;
let footstepAudios = [];
let soundEffectAudios = new Map();
let currentPreGameRouteActive = false;
let audioUnlocked = false;
let unlockListenersInstalled = false;
let footstepTimerId = null;
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

  if (ambienceAudio) {
    ambienceAudio.volume = getBoundedVolume(musicVolume.value, LOBBY_AMBIENCE_GAIN);
  }

  footstepAudios.forEach((audio) => {
    audio.volume = getBoundedVolume(musicVolume.value, LOBBY_DETAIL_GAIN);
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

function ensureAmbienceAudio() {
  if (!ambienceAudio) {
    ambienceAudio = createAudio(lobbyAmbienceOfficeUrl, { loop: true });
  }

  return ambienceAudio;
}

function ensureFootstepAudios() {
  if (!footstepAudios.length) {
    footstepAudios = lobbyFootstepUrls.map((url) => createAudio(url));
  }

  return footstepAudios;
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
  if (!footstepTimerId || typeof window === "undefined") {
    return;
  }

  window.clearTimeout(footstepTimerId);
  footstepTimerId = null;
}

function scheduleFootstepLayer() {
  if (!canUseAudio() || footstepTimerId) {
    return;
  }

  const { musicEnabled } = getAudioSettings();

  if (!currentPreGameRouteActive || !audioUnlocked || !musicEnabled.value) {
    return;
  }

  const delay = FOOTSTEP_DELAY_MIN_MS + Math.random() * FOOTSTEP_DELAY_RANGE_MS;

  footstepTimerId = window.setTimeout(() => {
    footstepTimerId = null;
    playLobbyFootstep();
    scheduleFootstepLayer();
  }, delay);
}

function playLobbyFootstep() {
  const { musicEnabled } = getAudioSettings();

  if (!canUseAudio() || !currentPreGameRouteActive || !musicEnabled.value) {
    return;
  }

  const audios = ensureFootstepAudios();
  const audio = audios[Math.floor(Math.random() * audios.length)];
  updateAudioVolumes();
  audio.currentTime = 0;
  playAudio(audio);
}

function stopPreGameBackground() {
  currentPreGameRouteActive = false;
  clearFootstepTimer();
  pauseAudio(ambienceAudio);
  footstepAudios.forEach((audio) => pauseAudio(audio, { reset: true }));
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

  const audio = ensureAmbienceAudio();
  playAudio(audio);
  scheduleFootstepLayer();
}

function unlockAudio() {
  audioUnlocked = true;

  AUDIO_UNLOCK_EVENTS.forEach((eventName) => {
    window.removeEventListener(eventName, unlockAudio, true);
  });

  if (currentPreGameRouteActive) {
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
        pauseAudio(ambienceAudio);
        footstepAudios.forEach((audio) => pauseAudio(audio, { reset: true }));
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
