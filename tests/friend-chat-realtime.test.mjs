import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test, { after, afterEach, before, beforeEach } from "node:test"
import { createPinia, setActivePinia } from "pinia"
import { shallowReactive, toRaw } from "vue"
import { createServer } from "vite"

let viteServer
let getSocket
let restoreSocketHarness
let useAuthStore
let useChatStore

function createMessage({
  id,
  senderPlayerId = 1,
  receiverPlayerId = 2,
  content = `message-${id}`,
  createdAt,
}) {
  return {
    id,
    senderPlayerId,
    receiverPlayerId,
    content,
    createdAt,
  }
}

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
  ;({ useChatStore } = await viteServer.ssrLoadModule("/src/stores/chatStore.js"))
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
  useChatStore?.().stopRealtime()
  restoreSocketHarness?.()
  restoreSocketHarness = null
})

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function authenticatePlayer(playerId = 2) {
  const authStore = useAuthStore()
  authStore.currentPlayer = { id: playerId }
  authStore.isLoggedIn = true
  authStore.hasVerifiedToken = true
}

function installSocketHarness({
  autoAcknowledge = true,
  connected = true,
  subscribeResponse,
  subscribeResponses = [],
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
  const onRegistrations = []
  const acknowledgements = []
  const directEmits = []
  const pendingAcknowledgements = []
  let connectCalls = 0
  let shouldAutoAcknowledge = autoAcknowledge

  socket.connected = connected
  socket.connect = () => {
    connectCalls += 1
    return socket
  }
  socket.on = (eventName, handler) => {
    onRegistrations.push(eventName)
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
        eventName === "chat:subscribe"
          ? subscribeResponses.shift() ??
            subscribeResponse ??
            { ok: true, data: { playerId: 2 } }
          : { ok: true, data: { playerId: 2 } }

      if (shouldAutoAcknowledge) {
        callback(null, response)
      } else {
        pendingAcknowledgements.push({ callback, response })
      }
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
    onRegistrations,
    pendingAcknowledgements,
    socket,
    get connectCalls() {
      return connectCalls
    },
    resolveNextAcknowledgement(response) {
      const pending = pendingAcknowledgements.shift()
      pending?.callback(null, response ?? pending.response)
    },
    setAutoAcknowledge(value) {
      shouldAutoAcknowledge = value
    },
  }
}

test("merges REST and realtime messages by id in chronological order", () => {
  const store = useChatStore()
  const message50 = createMessage({ id: 50, createdAt: "2026-07-11T10:00:00.000Z" })
  const message51 = createMessage({ id: 51, createdAt: "2026-07-11T10:01:00.000Z" })
  const message52 = createMessage({ id: 52, createdAt: "2026-07-11T10:02:00.000Z" })

  store.setConversation(1, [message50, message52])
  store.mergeMessages(1, [message50, message51, message52])

  assert.deepEqual(
    store.messagesByFriend(1).map((message) => message.id),
    [50, 51, 52],
  )
})

test("stores a realtime message under its sender while another friend is selected", () => {
  const store = useChatStore()
  const realtimeMessage = createMessage({
    id: 99,
    senderPlayerId: 1,
    receiverPlayerId: 2,
    createdAt: "2026-07-11T10:03:00.000Z",
  })
  store.selectedFriendId = "3"
  store.setConversation(3, [
    createMessage({
      id: 80,
      senderPlayerId: 3,
      receiverPlayerId: 2,
      createdAt: "2026-07-11T09:00:00.000Z",
    }),
  ])

  store.handleRealtimeMessage(realtimeMessage)

  assert.deepEqual(store.messagesByFriend(1), [realtimeMessage])
  assert.deepEqual(
    store.messagesByFriend(3).map((message) => message.id),
    [80],
  )
})

test("ignores malformed realtime messages", () => {
  const store = useChatStore()

  store.handleRealtimeMessage({
    id: null,
    senderPlayerId: 1,
    receiverPlayerId: 2,
    content: "invalid",
    createdAt: "2026-07-11T10:04:00.000Z",
  })

  assert.deepEqual(store.conversations, {})
})

test("starts realtime once without exposing or sending the member token", async () => {
  const harness = installSocketHarness()
  authenticatePlayer(2)
  const authStore = useAuthStore()
  const store = useChatStore()

  await store.startRealtime()
  await store.startRealtime()

  assert.equal("token" in authStore, false)
  assert.equal(store.isRealtimeStarted, true)
  assert.equal(
    harness.acknowledgements.filter(({ eventName }) => eventName === "chat:subscribe").length,
    1,
  )
  assert.deepEqual(harness.acknowledgements[0], {
    eventName: "chat:subscribe",
    payload: {},
  })
  assert.equal(harness.handlers.has("chat:message"), true)
  assert.equal(harness.handlers.has("connect"), true)
})

test("waits for the first socket connection before subscribing once", async () => {
  const harness = installSocketHarness({ connected: false })
  authenticatePlayer(2)
  const store = useChatStore()

  await store.startRealtime()

  assert.equal(harness.connectCalls, 1)
  assert.equal(harness.acknowledgements.length, 0)

  harness.socket.connected = true
  await harness.handlers.get("connect")()

  assert.equal(
    harness.acknowledgements.filter(({ eventName }) => eventName === "chat:subscribe").length,
    1,
  )
})

test("shares realtime generation when an equivalent store Proxy subscribes", async () => {
  const harness = installSocketHarness()
  authenticatePlayer(2)
  const store = useChatStore()
  const equivalentStoreProxy = shallowReactive(toRaw(store))

  assert.notEqual(equivalentStoreProxy, store)
  assert.equal(toRaw(equivalentStoreProxy), toRaw(store))

  await store.startRealtime()
  await equivalentStoreProxy.subscribeRealtime()

  assert.equal(
    harness.acknowledgements.filter(({ eventName }) => eventName === "chat:subscribe").length,
    2,
  )
})

test("cleans realtime handlers when an equivalent store Proxy stops", async () => {
  const harness = installSocketHarness()
  authenticatePlayer(2)
  const store = useChatStore()
  const equivalentStoreProxy = shallowReactive(toRaw(store))

  await store.startRealtime()
  equivalentStoreProxy.stopRealtime()

  assert.equal(harness.handlers.has("chat:message"), false)
  assert.equal(harness.handlers.has("connect"), false)
  assert.equal(harness.handlers.has("disconnect"), false)
  assert.equal(harness.handlers.has("connect_error"), false)
})

test("reconnects, resubscribes, and reloads the selected conversation", async () => {
  const harness = installSocketHarness()
  authenticatePlayer(2)
  const store = useChatStore()
  const loadedFriendIds = []
  store.selectedFriendId = "3"
  store.loadMessages = async (friendId) => {
    loadedFriendIds.push(Number(friendId))
  }

  await store.startRealtime()
  await harness.handlers.get("connect")()

  assert.equal(
    harness.acknowledgements.filter(({ eventName }) => eventName === "chat:subscribe").length,
    2,
  )
  assert.deepEqual(loadedFriendIds, [3])
})

test("reconnects without loading history when no friend is selected", async () => {
  const harness = installSocketHarness()
  authenticatePlayer(2)
  const store = useChatStore()
  const loadedFriendIds = []
  store.loadMessages = async (friendId) => {
    loadedFriendIds.push(Number(friendId))
  }

  await store.startRealtime()
  await harness.handlers.get("connect")()

  assert.deepEqual(loadedFriendIds, [])
})

test("stops only chat listeners and sends chat unsubscribe", async () => {
  const harness = installSocketHarness()
  authenticatePlayer(2)
  const store = useChatStore()
  harness.handlers.set("room:state", () => {})

  await store.startRealtime()
  await store.stopRealtime()

  assert.equal(harness.handlers.has("chat:message"), false)
  assert.equal(harness.handlers.has("connect"), false)
  assert.equal(harness.handlers.has("room:state"), true)
  assert.deepEqual(harness.directEmits, [
    { eventName: "chat:unsubscribe", payload: {} },
  ])
})

test("clearChatData stops realtime and clears conversations", async () => {
  const harness = installSocketHarness()
  authenticatePlayer(2)
  const store = useChatStore()
  store.setConversation(1, [
    createMessage({ id: 120, createdAt: "2026-07-11T10:05:00.000Z" }),
  ])

  await store.startRealtime()
  store.clearChatData()

  assert.deepEqual(store.conversations, {})
  assert.equal(store.isRealtimeStarted, false)
  assert.equal(harness.handlers.has("chat:message"), false)
})

test("subscription failure keeps REST actions available without duplicate listeners", async () => {
  const harness = installSocketHarness({
    subscribeResponse: {
      ok: false,
      error: { message: "登入驗證失敗" },
    },
  })
  authenticatePlayer(2)
  const store = useChatStore()

  await store.startRealtime()
  await store.startRealtime()

  assert.equal(store.realtimeErrorMessage, "登入驗證失敗")
  assert.equal(typeof store.loadMessages, "function")
  assert.equal(typeof store.sendMessage, "function")
  assert.equal(harness.handlers.has("chat:message"), true)
  assert.equal(harness.handlers.has("connect"), true)
})

test("automatically retries a temporary subscription failure without refreshing", async () => {
  const harness = installSocketHarness({
    subscribeResponses: [
      {
        ok: false,
        error: { message: "即時訂閱暫時失敗" },
      },
      {
        ok: true,
        data: { playerId: 2 },
      },
    ],
  })
  authenticatePlayer(2)
  const store = useChatStore()

  await store.startRealtime()

  assert.equal(store.isRealtimeSubscribed, false)
  assert.equal(store.realtimeErrorMessage, "即時訂閱暫時失敗")

  await wait(350)

  assert.equal(
    harness.acknowledgements.filter(({ eventName }) => eventName === "chat:subscribe").length,
    2,
  )
  assert.equal(store.isRealtimeSubscribed, true)
  assert.equal(store.realtimeErrorMessage, "")
  assert.deepEqual(
    harness.onRegistrations.filter((eventName) =>
      ["chat:message", "connect", "disconnect", "connect_error"].includes(eventName),
    ),
    ["chat:message", "connect", "disconnect", "connect_error"],
  )
})

test("repeated start retries immediately without waiting for the scheduled retry", async () => {
  const harness = installSocketHarness({
    subscribeResponses: [
      {
        ok: false,
        error: { message: "即時訂閱暫時失敗" },
      },
      {
        ok: true,
        data: { playerId: 2 },
      },
    ],
  })
  authenticatePlayer(2)
  const store = useChatStore()

  await store.startRealtime()
  await store.startRealtime()
  await wait(350)

  assert.equal(
    harness.acknowledgements.filter(({ eventName }) => eventName === "chat:subscribe").length,
    2,
  )
  assert.equal(store.isRealtimeSubscribed, true)
  assert.equal(
    harness.onRegistrations.filter((eventName) => eventName === "chat:message").length,
    1,
  )
})

test("stopRealtime cancels a scheduled subscription retry and all chat lifecycle listeners", async () => {
  const harness = installSocketHarness({
    subscribeResponse: {
      ok: false,
      error: { message: "即時訂閱暫時失敗" },
    },
  })
  authenticatePlayer(2)
  const store = useChatStore()

  await store.startRealtime()
  store.stopRealtime()
  await wait(350)

  assert.equal(
    harness.acknowledgements.filter(({ eventName }) => eventName === "chat:subscribe").length,
    1,
  )
  assert.equal(store.isRealtimeStarted, false)
  assert.equal(store.isRealtimeSubscribed, false)
  assert.equal(harness.handlers.has("chat:message"), false)
  assert.equal(harness.handlers.has("connect"), false)
  assert.equal(harness.handlers.has("disconnect"), false)
  assert.equal(harness.handlers.has("connect_error"), false)
})

test("ignores a reconnect acknowledgement that arrives after realtime stops", async () => {
  const harness = installSocketHarness()
  authenticatePlayer(2)
  const store = useChatStore()
  const loadedFriendIds = []

  await store.startRealtime()
  store.selectedFriendId = "3"
  store.loadMessages = async (friendId) => {
    loadedFriendIds.push(Number(friendId))
  }
  harness.setAutoAcknowledge(false)

  const reconnectPromise = harness.handlers.get("connect")()
  store.stopRealtime()
  harness.resolveNextAcknowledgement()
  await reconnectPromise

  assert.equal(store.isRealtimeSubscribed, false)
  assert.equal(store.realtimeErrorMessage, "")
  assert.deepEqual(loadedFriendIds, [])
})

test("ignores reconnect history that finishes after realtime stops", async () => {
  const harness = installSocketHarness()
  authenticatePlayer(2)
  const store = useChatStore()
  const recoveredMessage = createMessage({
    id: 140,
    senderPlayerId: 3,
    receiverPlayerId: 2,
    createdAt: "2026-07-11T10:06:00.000Z",
  })
  let resolveHistory
  let signalHistoryStarted
  const historyStarted = new Promise((resolve) => {
    signalHistoryStarted = resolve
  })
  const historyResponse = new Promise((resolve) => {
    resolveHistory = resolve
  })

  await store.startRealtime()
  store.selectedFriendId = "3"
  store.loadMessages = async (friendId, { realtimeGeneration } = {}) => {
    signalHistoryStarted()
    await historyResponse

    if (realtimeGeneration === undefined) {
      store.mergeMessages(friendId, [recoveredMessage])
      return
    }

    store.mergeMessagesForRealtimeGeneration(
      friendId,
      [recoveredMessage],
      realtimeGeneration,
    )
  }
  harness.setAutoAcknowledge(false)

  const reconnectPromise = harness.handlers.get("connect")()
  harness.resolveNextAcknowledgement()
  await historyStarted
  store.stopRealtime()
  resolveHistory()
  await reconnectPromise

  assert.deepEqual(store.messagesByFriend(3), [])
})

test("FriendView owns realtime startup and teardown", async () => {
  const source = await readFile(
    new URL("../src/views/FriendView.vue", import.meta.url),
    "utf8",
  )

  assert.match(source, /chatStore\.startRealtime\(\)/)
  assert.match(source, /onUnmounted\(\(\) =>/)
  assert.match(source, /chatStore\.stopRealtime\(\)/)
})

test("FriendChatPanel exposes a non-blocking realtime warning and reconnect control", async () => {
  const source = await readFile(
    new URL("../src/components/friend/FriendChatPanel.vue", import.meta.url),
    "utf8",
  )

  assert.match(source, /v-if="chatStore\.realtimeErrorMessage"/)
  assert.match(source, /role="status"/)
  assert.match(source, /@click="chatStore\.startRealtime"/)
  assert.match(source, /即時連線/)
})
