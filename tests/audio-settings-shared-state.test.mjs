import assert from 'node:assert/strict'
import test from 'node:test'

function createStorage() {
  const values = new Map()

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null
    },
    setItem(key, value) {
      values.set(key, String(value))
    },
    removeItem(key) {
      values.delete(key)
    },
  }
}

test('audio settings composable shares one preference state across callers', async () => {
  global.window = {
    localStorage: createStorage(),
  }

  const moduleUrl = new URL('../src/composables/UseAudioSettings.js', import.meta.url)
  moduleUrl.search = `?shared-state=${Date.now()}`
  const { useAudioSettings } = await import(moduleUrl.href)

  const firstSettings = useAudioSettings()
  const secondSettings = useAudioSettings()

  firstSettings.setMusicEnabled(false)
  firstSettings.setMusicVolume(42)
  secondSettings.setSoundEnabled(false)
  secondSettings.setSoundVolume(37)

  assert.equal(secondSettings.musicEnabled.value, false)
  assert.equal(secondSettings.musicVolume.value, 42)
  assert.equal(firstSettings.soundEnabled.value, false)
  assert.equal(firstSettings.soundVolume.value, 37)

  delete global.window
})
