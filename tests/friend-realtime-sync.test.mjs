import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test, { after, afterEach, before, beforeEach } from "node:test"
import { createPinia, setActivePinia } from "pinia"
import { createServer } from "vite"

let viteServer
let getSocket
let restoreSocketHarness
let useAuthStore
let useFriendStore

before(async () => {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }

  viteServer = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  })

  ;({ useFriendStore } = await viteServer.ssrLoadModule("/src/stores/friendStore.js"))
  ;({ useAuthStore } = await viteServer.ssrLoadModule("/src/stores/authStore.js"))
  ;({ getSocket } = await viteServer.ssrLoadModule("/src/services/socketClient.js"))
})

after(async () => {
  await viteServer?.close()
  delete globalThis.localStorage
})

beforeEach(() => {
  setActivePinia(createPinia())
})

afterEach(() => {
  const store = useFriendStore?.()

  if (typeof store?.stopRealtime === "function") {
    store.stopRealtime()
  }

  restoreSocketHarness?.()
  restoreSocketHarness = null
})

function authenticatePlayer(playerId = 2) {
  const authStore = useAuthStore()
  authStore.currentPlayer = { id: playerId }
  authStore.isLoggedIn = true
  authStore.hasVerifiedToken = true
}

function installSocketHarness({
  connected = true,
  subscribeResponse = { ok: true, data: { playerId: 2 } },
} = {}) {
  const socket = getSocket()
  const original = {
    connect: socket.connect,
    connected: socket.connected,
    emit: socket.emit,
    off: socket.off,
    on: socket.on,
    timeout: socket.timeout,
  }
  const handlers = new Map()
  const registrations = []
  const acknowledgements = []
  const directEmits = []
  let connectCalls = 0

  socket.connected = connected
  socket.connect = () => {
    connectCalls += 1
    return socket
  }
  socket.on = (eventName, handler) => {
    registrations.push(eventName)
    handlers.set(eventName, handler)
    return socket
  }
  socket.off = (eventName, handler) => {
    if (!handler || handlers.get(eventName) === handler) {
      handlers.delete(eventName)
    }
    return socket
  }
  socket.timeout = () => ({
    emit(eventName, payload, callback) {
      acknowledgements.push({ eventName, payload })
      const response =
        eventName === "friend:subscribe"
          ? subscribeResponse
          : { ok: true, data: { playerId: 2 } }
      callback(null, response)
    },
  })
  socket.emit = (eventName, payload, callback) => {
    directEmits.push({ eventName, payload })
    callback?.({ ok: true, data: { playerId: 2 } })
    return socket
  }

  restoreSocketHarness = () => {
    socket.connect = original.connect
    socket.connected = original.connected
    socket.emit = original.emit
    socket.off = original.off
    socket.on = original.on
    socket.timeout = original.timeout
  }

  return {
    acknowledgements,
    directEmits,
    handlers,
    registrations,
    socket,
    get connectCalls() {
      return connectCalls
    },
  }
}

test("subscribes once without sending a token or player ID", async () => {
  const harness = installSocketHarness()
  authenticatePlayer(2)
  const store = useFriendStore()

  assert.equal(typeof store.startRealtime, "function")
  await store.startRealtime()
  await store.startRealtime()

  const subscriptions = harness.acknowledgements.filter(
    ({ eventName }) => eventName === "friend:subscribe",
  )
  assert.equal(subscriptions.length, 1)
  assert.deepEqual(subscriptions[0], {
    eventName: "friend:subscribe",
    payload: {},
  })
  assert.equal(harness.handlers.has("friend:data-invalidated"), true)
  assert.equal(harness.handlers.has("connect"), true)
})

test("reloads all friend data after an invalidation event", async () => {
  const harness = installSocketHarness()
  authenticatePlayer(2)
  const store = useFriendStore()
  let refreshCount = 0
  store.loadFriendData = async () => {
    refreshCount += 1
  }

  assert.equal(typeof store.startRealtime, "function")
  await store.startRealtime()
  await harness.handlers.get("friend:data-invalidated")({})

  assert.equal(refreshCount, 1)
})

test("reconnects, resubscribes, and reloads missed friend state", async () => {
  const harness = installSocketHarness()
  authenticatePlayer(2)
  const store = useFriendStore()
  let refreshCount = 0
  store.loadFriendData = async () => {
    refreshCount += 1
  }

  assert.equal(typeof store.startRealtime, "function")
  await store.startRealtime()
  await harness.handlers.get("connect")()

  assert.equal(
    harness.acknowledgements.filter(
      ({ eventName }) => eventName === "friend:subscribe",
    ).length,
    2,
  )
  assert.equal(refreshCount, 1)
})

test("waits for the initial Socket connection before subscribing", async () => {
  const harness = installSocketHarness({ connected: false })
  authenticatePlayer(2)
  const store = useFriendStore()

  assert.equal(typeof store.startRealtime, "function")
  await store.startRealtime()

  assert.equal(harness.connectCalls, 1)
  assert.equal(harness.acknowledgements.length, 0)

  harness.socket.connected = true
  await harness.handlers.get("connect")()

  assert.equal(
    harness.acknowledgements.filter(
      ({ eventName }) => eventName === "friend:subscribe",
    ).length,
    1,
  )
})

test("stops only friend listeners and preserves unrelated Socket listeners", async () => {
  const harness = installSocketHarness()
  authenticatePlayer(2)
  const store = useFriendStore()
  harness.handlers.set("room:state", () => {})

  assert.equal(typeof store.startRealtime, "function")
  assert.equal(typeof store.stopRealtime, "function")
  await store.startRealtime()
  store.stopRealtime()

  assert.equal(harness.handlers.has("friend:data-invalidated"), false)
  assert.equal(harness.handlers.has("connect"), false)
  assert.equal(harness.handlers.has("disconnect"), false)
  assert.equal(harness.handlers.has("connect_error"), false)
  assert.equal(harness.handlers.has("room:state"), true)
  assert.deepEqual(harness.directEmits, [
    { eventName: "friend:unsubscribe", payload: {} },
  ])
})

test("subscription failure keeps REST friend actions available", async () => {
  installSocketHarness({
    subscribeResponse: {
      ok: false,
      error: { message: "好友即時訂閱失敗" },
    },
  })
  authenticatePlayer(2)
  const store = useFriendStore()

  assert.equal(typeof store.startRealtime, "function")
  await store.startRealtime()

  assert.equal(store.isRealtimeSubscribed, false)
  assert.equal(store.realtimeErrorMessage, "好友即時訂閱失敗")
  assert.equal(typeof store.loadFriendData, "function")
  assert.equal(typeof store.sendFriendRequest, "function")
  assert.equal(typeof store.acceptRequest, "function")
})

test("does not start realtime for a logged-out player", async () => {
  const harness = installSocketHarness()
  const store = useFriendStore()

  assert.equal(typeof store.startRealtime, "function")
  await store.startRealtime()

  assert.equal(store.isRealtimeStarted, false)
  assert.equal(harness.acknowledgements.length, 0)
  assert.equal(harness.handlers.has("friend:data-invalidated"), false)
})

test("FriendView owns friend realtime startup and teardown", async () => {
  const source = await readFile(
    new URL("../src/views/FriendView.vue", import.meta.url),
    "utf8",
  )

  assert.match(source, /friendStore\.startRealtime\(\)/)
  assert.match(source, /onUnmounted\(\(\) =>/)
  assert.match(source, /friendStore\.stopRealtime\(\)/)
})
