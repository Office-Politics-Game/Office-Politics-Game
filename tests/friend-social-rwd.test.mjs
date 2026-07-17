import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const canvasModuleUrl = new URL(
  "../src/composables/UseFriendSocialCanvas.js",
  import.meta.url,
)

async function resolveCanvas(viewportWidth, viewportHeight) {
  const { resolveFriendSocialCanvas } = await import(canvasModuleUrl)
  return resolveFriendSocialCanvas(viewportWidth, viewportHeight)
}

async function readSource(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8")
}

test("viewport widths below 1024 use the compact fixed canvas", async () => {
  const canvas = await resolveCanvas(1023, 800)

  assert.deepEqual(
    {
      mode: canvas.mode,
      designWidth: canvas.designWidth,
      designHeight: canvas.designHeight,
      panelWidth: canvas.panelWidth,
      panelHeight: canvas.panelHeight,
      leftColumnWidth: canvas.leftColumnWidth,
      rightColumnWidth: canvas.rightColumnWidth,
    },
    {
      mode: "compact",
      designWidth: 960,
      designHeight: 540,
      panelWidth: 920,
      panelHeight: 520,
      leftColumnWidth: 340,
      rightColumnWidth: 580,
    },
  )
})

test("viewport widths at 1024 use the standard fixed canvas", async () => {
  const canvas = await resolveCanvas(1024, 800)

  assert.deepEqual(
    {
      mode: canvas.mode,
      designWidth: canvas.designWidth,
      designHeight: canvas.designHeight,
      panelWidth: canvas.panelWidth,
      panelHeight: canvas.panelHeight,
      leftColumnWidth: canvas.leftColumnWidth,
      rightColumnWidth: canvas.rightColumnWidth,
    },
    {
      mode: "standard",
      designWidth: 1280,
      designHeight: 720,
      panelWidth: 1180,
      panelHeight: 688,
      leftColumnWidth: 420,
      rightColumnWidth: 760,
    },
  )
})

test("standard canvas uses the tighter viewport ratio", async () => {
  const canvas = await resolveCanvas(1024, 600)

  assert.equal(canvas.scale, 0.8)
  assert.equal(canvas.scaledWidth, 1024)
  assert.equal(canvas.scaledHeight, 576)
})

test("compact canvas can be constrained by viewport height", async () => {
  const canvas = await resolveCanvas(900, 400)
  const expectedScale = 400 / 540

  assert.equal(canvas.scale, expectedScale)
  assert.equal(canvas.scaledWidth, 960 * expectedScale)
  assert.equal(canvas.scaledHeight, 400)
})

test("canvas never scales above its fixed design size", async () => {
  const canvas = await resolveCanvas(1600, 900)

  assert.equal(canvas.scale, 1)
  assert.equal(canvas.scaledWidth, 1280)
  assert.equal(canvas.scaledHeight, 720)
})

test("invalid viewport values become finite non-negative output", async () => {
  const canvas = await resolveCanvas(-20, Number.POSITIVE_INFINITY)

  assert.equal(canvas.mode, "compact")
  for (const value of Object.values(canvas).filter(
    (entry) => typeof entry === "number",
  )) {
    assert.equal(Number.isFinite(value), true)
    assert.equal(value >= 0, true)
  }
  assert.equal(canvas.scale, 0)
  assert.equal(canvas.scaledWidth, 0)
  assert.equal(canvas.scaledHeight, 0)
})

test("friend view renders one scaled frame around fixed two-column content", async () => {
  const source = await readSource("src/views/FriendView.vue")

  assert.match(source, /class="friend-canvas-frame"/)
  assert.match(source, /:style="frameStyle"/)
  assert.match(source, /class="friend-page-canvas"/)
  assert.match(source, /:style="canvasStyle"/)
  assert.match(source, /:style="panelStyle"/)
  assert.match(source, /class="[^"]*friend-social-column[^"]*"/)
  assert.match(source, /class="[^"]*friend-chat-column[^"]*"/)
  assert.match(source, /useFriendSocialCanvas/)

  for (const legacyLayoutToken of [
    "h-[92vh]",
    "w-[94vw]",
    "md:h-[82vh]",
    "md:flex-row",
    "max-h-[40%]",
    "md:max-h-none",
    "md:w-[38%]",
    "overflow-x-auto",
  ]) {
    assert.equal(source.includes(legacyLayoutToken), false, legacyLayoutToken)
  }
})

test("friend content keeps bounded text and control states without extra breakpoints", async () => {
  const [
    friendView,
    chatPanel,
    friendItem,
    addFriendForm,
    requestList,
    blockedList,
  ] = await Promise.all([
    readSource("src/views/FriendView.vue"),
    readSource("src/components/friend/FriendChatPanel.vue"),
    readSource("src/components/friend/FriendItem.vue"),
    readSource("src/components/friend/AddFriendForm.vue"),
    readSource("src/components/friend/FriendRequestList.vue"),
    readSource("src/components/friend/BlockedPlayerList.vue"),
  ])

  assert.match(friendView, /friend-tabs grid h-14 shrink-0 grid-cols-4/)
  assert.doesNotMatch(friendView, /overflow-x-auto/)
  assert.match(
    friendView,
    /\.tab:focus-visible\s*\{[\s\S]*?box-shadow:\s*inset 0 0 0 4px var\(--brand-focus\)/,
  )

  for (const source of [friendView, chatPanel, addFriendForm]) {
    assert.doesNotMatch(source, /\b(?:max-)?(?:sm|md):/)
  }

  assert.match(chatPanel, /overflow-wrap:\s*anywhere/)
  assert.match(chatPanel, /\.chat-send-button:active:not\(:disabled\)/)
  assert.match(chatPanel, /focus-visible/)
  assert.match(chatPanel, /disabled:/)

  assert.match(friendItem, /class="truncate text-sm/)
  assert.match(friendItem, /class="truncate text-xs/)
  assert.match(friendItem, /\.friend-item-action:focus-visible/)
  assert.match(friendItem, /:disabled=/)

  assert.match(addFriendForm, /class="truncate text-sm/)
  assert.match(addFriendForm, /\.friend-button:focus-visible/)
  assert.match(addFriendForm, /:disabled=/)

  assert.match(requestList, /class="truncate text-sm/)
  assert.match(requestList, /focus-visible/)
  assert.match(requestList, /:disabled=/)

  assert.match(blockedList, /class="truncate text-sm/)
  assert.match(blockedList, /\.blocked-action:focus-visible/)
  assert.match(blockedList, /:disabled=/)
})
