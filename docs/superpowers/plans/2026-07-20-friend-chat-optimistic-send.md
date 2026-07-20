# Friend Chat Optimistic Send Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display an outgoing friend-chat message immediately, replace it with the persisted server message on success, and roll it back while restoring the composer on failure.

**Architecture:** Keep optimistic messages inside the existing Pinia `conversations` collection so rendering, ordering, and auto-scroll continue through the current data path. Give pending messages explicitly marked negative IDs, reconcile them in `chatStore.sendMessage()`, and keep input clearing/restoration local to `FriendChatPanel.vue`.

**Tech Stack:** Vue 3, Pinia, Axios, Vite SSR test loading, Node.js built-in test runner

## Global Constraints

- The server response remains the final source of truth.
- Only explicitly marked optimistic messages may use negative integer IDs.
- Keep the existing single-send `isSending` restriction.
- On failure, remove the optimistic message, keep the existing error display, and return `null`.
- Clear the composer immediately after dispatch; restore its original text when the Store returns `null`.
- Do not modify REST, Socket.IO, database, bubble layout, or bubble colors.

---

### Task 1: Store-managed optimistic message lifecycle

**Files:**
- Create: `tests/friend-chat-optimistic-send.test.mjs`
- Modify: `src/stores/chatStore.js:18-141, 361-477`

**Interfaces:**
- Consumes: `sendDirectMessageApi({ friendId, content })`, authenticated player ID from `getCurrentPlayerId()`, and existing `conversations` storage.
- Produces: `sendMessage({ friendId, content }): Promise<DirectMessage | null>` with immediate optimistic insertion, success replacement, and failure rollback.
- Produces: `replaceMessage(friendId, previousMessageId, replacementMessage)` Store action, where `replacementMessage` may be `null` to remove without replacement.

- [ ] **Step 1: Create the Store test harness and failing optimistic-insertion test**

Create `tests/friend-chat-optimistic-send.test.mjs` with a Vite SSR harness, controllable Axios adapter, and the first test:

```js
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
  assert.deepEqual(store.messagesByFriend(1), [
    {
      id: store.messagesByFriend(1)[0].id,
      senderPlayerId: 2,
      receiverPlayerId: 1,
      content: "hello",
      createdAt: store.messagesByFriend(1)[0].createdAt,
      isOptimistic: true,
    },
  ])
  assert.equal(store.messagesByFriend(1)[0].id < 0, true)

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
```

- [ ] **Step 2: Run the new test and verify RED**

Run:

```powershell
node tests\friend-chat-optimistic-send.test.mjs
```

Expected: FAIL because `messagesByFriend(1)` is empty while the Axios Promise is pending.

- [ ] **Step 3: Add optimistic message identity and replacement helpers**

Add a module counter near the existing realtime counters:

```js
let nextOptimisticMessageId = -1;
```

Replace `isValidDirectMessage()` with validation that preserves persisted IDs and explicitly allows optimistic IDs:

```js
function hasValidDirectMessageId(message) {
  if (toPositiveInteger(message?.id)) {
    return true;
  }

  return Boolean(
    message?.isOptimistic === true &&
      Number.isInteger(message.id) &&
      message.id < 0,
  );
}

function isValidDirectMessage(message) {
  return Boolean(
    hasValidDirectMessageId(message) &&
      toPositiveInteger(message?.senderPlayerId) &&
      toPositiveInteger(message?.receiverPlayerId),
  );
}

function createOptimisticDirectMessage({
  senderPlayerId,
  receiverPlayerId,
  content,
}) {
  const optimisticMessage = {
    id: nextOptimisticMessageId,
    senderPlayerId,
    receiverPlayerId,
    content,
    createdAt: new Date().toISOString(),
    isOptimistic: true,
  };

  nextOptimisticMessageId -= 1;
  return optimisticMessage;
}
```

Add the replacement action after `appendMessage()`:

```js
replaceMessage(friendId, previousMessageId, replacementMessage = null) {
  const key = String(friendId);
  const remainingMessages = (this.conversations[key] ?? []).filter(
    (message) => String(message.id) !== String(previousMessageId),
  );

  this.conversations = {
    ...this.conversations,
    [key]: mergeDirectMessages(
      remainingMessages,
      replacementMessage ? [replacementMessage] : [],
    ),
  };
},
```

- [ ] **Step 4: Insert, replace, and roll back inside `sendMessage()`**

Replace the `try/catch/finally` portion of `sendMessage()` with:

```js
let optimisticMessage = null;

try {
  const currentPlayerId = this.getCurrentPlayerId();
  optimisticMessage = createOptimisticDirectMessage({
    senderPlayerId: currentPlayerId,
    receiverPlayerId: numericFriendId,
    content: normalizedContent,
  });
  this.appendMessage(numericFriendId, optimisticMessage);

  const data = await sendDirectMessageApi({
    friendId: numericFriendId,
    content: normalizedContent,
  });
  const directMessage = data.directMessage;

  if (!isValidDirectMessage(directMessage) || directMessage.isOptimistic) {
    throw new Error("訊息送出失敗");
  }

  this.replaceMessage(numericFriendId, optimisticMessage.id, directMessage);
  return directMessage;
} catch (error) {
  if (optimisticMessage) {
    this.replaceMessage(numericFriendId, optimisticMessage.id);
  }
  this.errorMessage = error.message || "訊息送出失敗";
  return null;
} finally {
  this.isSending = false;
}
```

- [ ] **Step 5: Add success-replacement and failure-rollback tests**

Append these tests to `tests/friend-chat-optimistic-send.test.mjs`:

```js
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
```

- [ ] **Step 6: Run Store tests and verify GREEN**

Run:

```powershell
node tests\friend-chat-optimistic-send.test.mjs
node tests\friend-chat-realtime.test.mjs
```

Expected: Both commands exit with code `0`; the optimistic suite reports 3 passing tests and the existing realtime suite remains green.

- [ ] **Step 7: Commit the Store behavior**

```powershell
git add -- tests/friend-chat-optimistic-send.test.mjs src/stores/chatStore.js
git commit -m "feat(friend-chat): 新增訊息樂觀更新"
```

### Task 2: Immediate composer clearing and failure restoration

**Files:**
- Modify: `tests/friend-chat-keyboard.test.mjs`
- Modify: `src/components/friend/FriendChatPanel.vue:163-172`

**Interfaces:**
- Consumes: Task 1's `chatStore.sendMessage()` result (`DirectMessage` on success, `null` on failure).
- Produces: `submitMessage()` behavior that clears `messageText` before the Store Promise settles and restores the original content only when the result is `null`.

- [ ] **Step 1: Add a failing source-contract test for composer behavior**

Append to `tests/friend-chat-keyboard.test.mjs`:

```js
test("FriendChatPanel clears the composer immediately and restores it on failure", () => {
  const submitMatch = friendChatPanelSource.match(
    /async function submitMessage\(\) \{([\s\S]*?)\n\}/,
  )
  assert.ok(submitMatch, "FriendChatPanel should define submitMessage")

  const body = submitMatch[1]
  const preserveIndex = body.indexOf("const originalMessage = messageText.value;")
  const dispatchIndex = body.indexOf("const sendRequest = chatStore.sendMessage({")
  const clearIndex = body.indexOf('messageText.value = "";')
  const awaitIndex = body.indexOf("const sentMessage = await sendRequest;")
  const restoreIndex = body.indexOf("messageText.value = originalMessage;")

  assert.ok(preserveIndex >= 0)
  assert.ok(dispatchIndex > preserveIndex)
  assert.ok(clearIndex > dispatchIndex)
  assert.ok(awaitIndex > clearIndex)
  assert.ok(restoreIndex > awaitIndex)
  assert.match(body, /if \(!sentMessage\) \{[\s\S]*messageText\.value = originalMessage;/)
})
```

- [ ] **Step 2: Run the component test and verify RED**

Run:

```powershell
node tests\friend-chat-keyboard.test.mjs
```

Expected: FAIL because `submitMessage()` awaits `chatStore.sendMessage()` before clearing the composer and has no failure restoration.

- [ ] **Step 3: Implement immediate clearing and restoration**

Replace `submitMessage()` in `FriendChatPanel.vue` with:

```js
async function submitMessage() {
  const originalMessage = messageText.value;
  const sendRequest = chatStore.sendMessage({
    friendId: props.friend.playerId,
    content: originalMessage,
  });
  messageText.value = "";

  const sentMessage = await sendRequest;

  if (!sentMessage) {
    messageText.value = originalMessage;
  }
}
```

- [ ] **Step 4: Run focused and related tests and verify GREEN**

Run:

```powershell
node tests\friend-chat-keyboard.test.mjs
node tests\friend-chat-scroll.test.mjs
node tests\friend-api-integration.test.mjs
node tests\friend-chat-optimistic-send.test.mjs
node tests\friend-chat-realtime.test.mjs
```

Expected: All commands exit with code `0`; keyboard behavior, auto-scroll, API wiring, optimistic lifecycle, and realtime merging remain green.

- [ ] **Step 5: Verify the production build**

Run:

```powershell
npm run build
```

Expected: Vite completes with exit code `0` and no Vue, Pinia, Axios, or Tailwind compilation errors.

- [ ] **Step 6: Review and commit the component behavior**

```powershell
git diff --check
git diff -- tests/friend-chat-keyboard.test.mjs src/components/friend/FriendChatPanel.vue
git add -- tests/friend-chat-keyboard.test.mjs src/components/friend/FriendChatPanel.vue
git commit -m "feat(friend-chat): 即時清空並回復送出內容"
```
