import { ref, watch } from 'vue'

export const AUDIO_SETTINGS_STORAGE_KEY = 'office-politics.audio-settings.v1'

export const DEFAULT_AUDIO_SETTINGS = Object.freeze({
  musicEnabled: true,
  musicVolume: 100,
  soundEnabled: true,
  soundVolume: 100,
})

export function clampVolume(value) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return 100
  }

  return Math.min(100, Math.max(0, Math.round(numericValue)))
}

export function normalizeAudioSettings(value) {
  if (
    !value ||
    typeof value !== 'object' ||
    typeof value.musicEnabled !== 'boolean' ||
    typeof value.soundEnabled !== 'boolean' ||
    typeof value.musicVolume !== 'number' ||
    typeof value.soundVolume !== 'number' ||
    !Number.isFinite(value.musicVolume) ||
    !Number.isFinite(value.soundVolume) ||
    value.musicVolume < 0 ||
    value.musicVolume > 100 ||
    value.soundVolume < 0 ||
    value.soundVolume > 100
  ) {
    return { ...DEFAULT_AUDIO_SETTINGS }
  }

  return {
    musicEnabled: value.musicEnabled,
    musicVolume: clampVolume(value.musicVolume),
    soundEnabled: value.soundEnabled,
    soundVolume: clampVolume(value.soundVolume),
  }
}

function getLocalStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function readAudioSettings() {
  const storage = getLocalStorage()

  if (!storage) {
    return { ...DEFAULT_AUDIO_SETTINGS }
  }

  try {
    const storedValue = storage.getItem(AUDIO_SETTINGS_STORAGE_KEY)
    return storedValue
      ? normalizeAudioSettings(JSON.parse(storedValue))
      : { ...DEFAULT_AUDIO_SETTINGS }
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS }
  }
}

let audioSettingsState = null

function createAudioSettingsState() {
  const initialSettings = readAudioSettings()
  const musicEnabled = ref(initialSettings.musicEnabled)
  const musicVolume = ref(initialSettings.musicVolume)
  const soundEnabled = ref(initialSettings.soundEnabled)
  const soundVolume = ref(initialSettings.soundVolume)

  function persistSettings() {
    const storage = getLocalStorage()

    if (!storage) {
      return
    }

    try {
      storage.setItem(
        AUDIO_SETTINGS_STORAGE_KEY,
        JSON.stringify({
          musicEnabled: musicEnabled.value,
          musicVolume: musicVolume.value,
          soundEnabled: soundEnabled.value,
          soundVolume: soundVolume.value,
        }),
      )
    } catch {
      // Keep the in-memory preference when storage is unavailable.
    }
  }

  function setMusicEnabled(value) {
    musicEnabled.value = Boolean(value)
  }

  function setMusicVolume(value) {
    musicVolume.value = clampVolume(value)
  }

  function setSoundEnabled(value) {
    soundEnabled.value = Boolean(value)
  }

  function setSoundVolume(value) {
    soundVolume.value = clampVolume(value)
  }

  watch(
    [musicEnabled, musicVolume, soundEnabled, soundVolume],
    persistSettings,
    { flush: 'sync' },
  )

  return {
    musicEnabled,
    musicVolume,
    soundEnabled,
    soundVolume,
    setMusicEnabled,
    setMusicVolume,
    setSoundEnabled,
    setSoundVolume,
  }
}

export function useAudioSettings() {
  if (!audioSettingsState) {
    audioSettingsState = createAudioSettingsState()
  }

  return audioSettingsState
}
