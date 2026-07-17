import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

async function readSource(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8")
}

function getCssRule(source, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return source.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`))?.[1] ?? ""
}

function getTagClasses(source, tag, requiredClass) {
  const escapedRequiredClass = requiredClass.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const tagPattern = new RegExp(`<${tag}[^>]*class="([^"]*${escapedRequiredClass}[^"]*)"[^>]*>`)
  return new Set((source.match(tagPattern)?.[1] ?? "").split(/\s+/).filter(Boolean))
}

function assertHasClasses(classTokens, expectedClasses) {
  for (const expectedClass of expectedClasses) {
    assert.equal(classTokens.has(expectedClass), true, `missing class: ${expectedClass}`)
  }
}

test("long conversations scroll inside the message body while the composer stays visible", async () => {
  const [friendViewSource, chatPanelSource] = await Promise.all([
    readSource("src/views/FriendView.vue"),
    readSource("src/components/friend/FriendChatPanel.vue"),
  ])
  const panelRule = getCssRule(chatPanelSource, ".friend-chat-panel")
  const bodyRule = getCssRule(chatPanelSource, ".chat-body")
  const toolbarRule = getCssRule(chatPanelSource, ".chat-toolbar")
  const composerRule = getCssRule(chatPanelSource, ".chat-composer")
  const asideClasses = getTagClasses(friendViewSource, "aside", "border-b")
  const mainClasses = getTagClasses(friendViewSource, "main", "flex-1")
  const contentClasses = getTagClasses(friendViewSource, "section", "bg-[rgba(244,247,251,0.74)]")

  assertHasClasses(asideClasses, [
    "max-h-[40%]",
    "shrink-0",
    "overflow-hidden",
    "md:max-h-none",
  ])
  assertHasClasses(mainClasses, ["flex", "min-h-0", "flex-1", "flex-col"])
  assertHasClasses(contentClasses, ["flex", "min-h-0", "flex-1", "flex-col", "overflow-hidden"])
  assert.match(panelRule, /min-h-0/)
  assert.match(panelRule, /flex-1/)
  assert.match(panelRule, /overflow-hidden/)
  assert.doesNotMatch(panelRule, /min-h-full/)
  assert.match(bodyRule, /min-h-0/)
  assert.match(bodyRule, /flex-1/)
  assert.match(bodyRule, /overflow-y-auto/)
  assert.match(toolbarRule, /shrink-0/)
  assert.match(composerRule, /shrink-0/)
})

test("square message bubbles are narrow and point toward their aligned edge", async () => {
  const source = await readSource("src/components/friend/FriendChatPanel.vue")
  const bubbleRule = getCssRule(source, ".message-bubble")
  const mineRule = getCssRule(source, ".chat-message--mine")
  const friendRule = getCssRule(source, ".chat-message--friend")
  const commonTailRule = getCssRule(
    source,
    ".message-bubble::before,\n.message-bubble::after",
  )
  const ownOuterTailRule = getCssRule(
    source,
    ".chat-message--mine .message-bubble::before",
  )
  const ownInnerTailRule = getCssRule(
    source,
    ".chat-message--mine .message-bubble::after",
  )
  const friendOuterTailRule = getCssRule(
    source,
    ".chat-message--friend .message-bubble::before",
  )
  const friendInnerTailRule = getCssRule(
    source,
    ".chat-message--friend .message-bubble::after",
  )

  assert.match(bubbleRule, /relative/)
  assert.match(bubbleRule, /max-w-\[62%\]/)
  assert.match(bubbleRule, /max-md:max-w-\[82%\]/)
  assert.doesNotMatch(bubbleRule, /rounded/)
  assert.match(commonTailRule, /position:\s*absolute/)
  assert.match(commonTailRule, /content:\s*""/)
  assert.match(commonTailRule, /pointer-events:\s*none/)
  assert.match(mineRule, /items-start/)
  assert.match(friendRule, /items-end/)
  assert.match(ownOuterTailRule, /left:\s*-9px/)
  assert.match(ownOuterTailRule, /border-right:\s*9px solid var\(--gray-100\)/)
  assert.match(ownInnerTailRule, /left:\s*-7px/)
  assert.match(ownInnerTailRule, /border-right:\s*8px solid white/)
  assert.match(friendOuterTailRule, /right:\s*-9px/)
  assert.match(friendOuterTailRule, /border-left:\s*9px solid var\(--gray-200\)/)
  assert.match(friendInnerTailRule, /right:\s*-7px/)
  assert.match(friendInnerTailRule, /border-left:\s*8px solid var\(--gray-100\)/)
})

test("message ownership uses labels and source-specific bubble colors", async () => {
  const source = await readSource("src/components/friend/FriendChatPanel.vue")
  const authorRule = getCssRule(source, ".message-author")
  const mineBubbleRule = getCssRule(source, ".chat-message--mine .message-bubble")
  const friendBubbleRule = getCssRule(source, ".chat-message--friend .message-bubble")

  assert.match(
    source,
    /<p class="message-author">\s*\{\{\s*isMine\(message\) \? "我" : friend\.name\s*\}\}\s*<\/p>\s*<div class="message-bubble">/,
  )
  assert.doesNotMatch(
    source,
    /<p class="message-author">\s*\{\{\s*isMine\(message\) \? "我" : friend\.playerId\s*\}\}\s*<\/p>/,
  )
  assert.match(authorRule, /text-xs/)
  assert.match(mineBubbleRule, /bg-white/)
  assert.match(friendBubbleRule, /bg-\[var\(--gray-100\)\]/)
  assert.doesNotMatch(mineBubbleRule, /rounded/)
  assert.doesNotMatch(friendBubbleRule, /rounded/)
})
