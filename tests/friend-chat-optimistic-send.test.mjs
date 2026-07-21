import assert from "node:assert/strict"
import test, { after, afterEach, before, beforeEach } from "node:test"
import { createPinia, setActivePinia } from "pinia"
import { createServer } from "vite"

let apiClient
let originalAdapter
let useAuthStore
let useChatStore
let viteServer

function createDeferred() {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

function createAxiosResponse(data) {
  return {
    config: {},
    data,
    headers: {},
    status: 201,
    statusText: "Created",
  }
}

function authenticatePlayer(playerId = 2) {
  const authStore = useAuthStore()
  authStore.currentPlayer = { id: playerId }
  authStore.isLoggedIn = true
  authStore.hasVerifiedToken = true
}

before(async () => {
  globalThis.localStorage = {
    getItem: () => null,
    removeItem: () => {},
    setItem: () => {},
  }
  viteServer = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  })
  ;({ apiClient } = await viteServer.ssrLoadModule("/src/services/apiClient.js"))
  ;({ useAuthStore } = await viteServer.ssrLoadModule("/src/stores/authStore.js"))
  ;({ useChatStore } = await viteServer.ssrLoadModule("/src/stores/chatStore.js"))
  originalAdapter = apiClient.defaults.adapter
})

after(async () => {
  apiClient.defaults.adapter = originalAdapter
  await viteServer?.close()
  delete globalThis.localStorage
})

beforeEach(() => {
  setActivePinia(createPinia())
  authenticatePlayer(2)
})

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter
})

test("shows an optimistic outgoing message before the REST request settles", async () => {
  const request = createDeferred()
  apiClient.defaults.adapter = () => request.promise
  const store = useChatStore()

  const sendPromise = store.sendMessage({ friendId: 1, content: " hello " })

  assert.equal(store.isSending, true)
  const optimisticMessages = store.messagesByFriend(1)
  assert.equal(optimisticMessages.length, 1)
  const optimisticMessage = optimisticMessages[0]
  assert.deepEqual(optimisticMessages, [
    {
      id: optimisticMessage.id,
      senderPlayerId: 2,
      receiverPlayerId: 1,
      content: "hello",
      createdAt: optimisticMessage.createdAt,
      isOptimistic: true,
    },
  ])
  assert.equal(optimisticMessage.id < 0, true)

  request.resolve(
    createAxiosResponse({
      directMessage: {
        id: 101,
        senderPlayerId: 2,
        receiverPlayerId: 1,
        content: "hello",
        createdAt: "2026-07-20T10:00:00.000Z",
      },
    }),
  )
  await sendPromise
})

test("replaces the optimistic message with the persisted server message", async () => {
  const persistedMessage = {
    id: 102,
    senderPlayerId: 2,
    receiverPlayerId: 1,
    content: "persisted",
    createdAt: "2026-07-20T10:01:00.000Z",
  }
  apiClient.defaults.adapter = async () =>
    createAxiosResponse({ directMessage: persistedMessage })
  const store = useChatStore()

  const result = await store.sendMessage({ friendId: 1, content: "persisted" })

  assert.deepEqual(result, persistedMessage)
  assert.deepEqual(store.messagesByFriend(1), [persistedMessage])
  assert.equal(store.isSending, false)
  assert.equal(store.errorMessage, "")
})

test("removes the optimistic message when the REST request fails", async () => {
  const request = createDeferred()
  apiClient.defaults.adapter = () => request.promise
  const store = useChatStore()
  const sendPromise = store.sendMessage({ friendId: 1, content: "retry me" })

  assert.equal(store.messagesByFriend(1).length, 1)
  request.reject(new Error("network unavailable"))

  const result = await sendPromise
  assert.equal(result, null)
  assert.deepEqual(store.messagesByFriend(1), [])
  assert.equal(store.errorMessage, "network unavailable")
  assert.equal(store.isSending, false)
})
