import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('api client uses VITE_API_BASE_URL with /api fallback', async () => {
  const source = await readSource('src/services/apiClient.js')

  assert.match(source, /const API_BASE_URL = import\.meta\.env\.VITE_API_BASE_URL \|\| ["']\/api["']/)
  assert.match(source, /baseURL: API_BASE_URL/)
  assert.match(source, /export \{ apiClient, API_BASE_URL \}/)
})

test('socket client uses VITE_SOCKET_URL with current-origin fallback', async () => {
  const source = await readSource('src/services/socketClient.js')

  assert.match(source, /const SOCKET_URL = import\.meta\.env\.VITE_SOCKET_URL \|\| ["']\/["']/)
  assert.match(source, /socket = io\(SOCKET_URL,[\s\S]*autoConnect: false/)
  assert.match(source, /SOCKET_URL,/)
})

test('local Vite proxy entries remain available for fallback endpoints', async () => {
  const source = await readSource('vite.config.js')

  assert.match(source, /["']\/api["']:\s*\{[\s\S]*target:\s*["']http:\/\/localhost:3000["']/)
  assert.match(source, /["']\/socket\.io["']:\s*\{[\s\S]*target:\s*["']http:\/\/localhost:3000["'][\s\S]*ws:\s*true/)
})
