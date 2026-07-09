import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('pre-game audio assets use semantic mp3 filenames', async () => {
  const audioFiles = await readdir(new URL('../src/assets/audio/', import.meta.url))

  assert.ok(audioFiles.includes('lobby-ambience-office-60s.mp3'))
  assert.ok(audioFiles.includes('login-button-click.mp3'))
  assert.ok(audioFiles.includes('lobby-navigation-whoosh.mp3'))
  assert.ok(audioFiles.includes('lobby-footsteps-heels-01.mp3'))
  assert.ok(audioFiles.includes('lobby-footsteps-heels-02.mp3'))
  assert.equal(audioFiles.some((fileName) => fileName.endsWith('.mp3.mp3')), false)
})

test('pre-game audio controller maps ambience, detail layers, and ui sounds', async () => {
  const source = await readSource('src/composables/UsePreGameAudio.js')

  assert.match(source, /lobbyAmbienceOfficeUrl/)
  assert.match(source, /loginButtonClickUrl/)
  assert.match(source, /lobbyNavigationWhooshUrl/)
  assert.match(source, /lobbyFootstepsHeels01Url/)
  assert.match(source, /lobbyFootstepsHeels02Url/)
  assert.match(source, /function syncPreGameRouteAudio/)
  assert.match(source, /function playPreGameSound/)
  assert.match(source, /musicEnabled/)
  assert.match(source, /soundEnabled/)
})

test('entry, login, and lobby screens are wired to pre-game audio', async () => {
  const appSource = await readSource('src/App.vue')
  const entrySource = await readSource('src/views/EntryPage.vue')
  const loginSource = await readSource('src/components/login/LoginContent.vue')
  const lobbyMenuSource = await readSource('src/components/menu/LobbyMenu.vue')
  const gameMenuSource = await readSource('src/components/gameRoom/GameMenuPanel.vue')

  assert.match(appSource, /usePreGameAudio/)
  assert.match(appSource, /syncPreGameRouteAudio/)
  assert.match(entrySource, /playPreGameSound\(["']login-button-click["']\)/)
  assert.match(loginSource, /playPreGameSound\(["']login-button-click["']\)/)
  assert.match(lobbyMenuSource, /playPreGameSound\(["']lobby-navigation-whoosh["']\)/)
  assert.match(gameMenuSource, /playPreGameSound\(["']lobby-navigation-whoosh["']\)/)
})
