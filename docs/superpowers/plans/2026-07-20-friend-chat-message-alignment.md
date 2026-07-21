# Friend Chat Message Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current player's friend-chat messages right-aligned with a `#86B3E0` bubble, while incoming messages remain left-aligned on white.

**Architecture:** Keep the existing `FriendChatPanel.vue` template and `isMine(message)` ownership decision unchanged. Update only the component's scoped message-alignment, bubble, and tail CSS, with the existing source-level layout test locking the visual contract.

**Tech Stack:** Vue 3 single-file components, Tailwind CSS 4 `@apply`, Node.js built-in test runner

## Global Constraints

- Use `--brand-primary` (`#86B3E0`) for the current player's bubble and `--brand-navy` for its text.
- Use white for the friend's bubble, `--gray-100` for its border, and `--brand-active` for its text.
- Preserve the Square UI square shape, current shadow, width limits, labels, timestamps, and responsive behavior.
- Do not change chat data, ownership detection, REST, Socket.IO, Pinia, or database behavior.

---

### Task 1: Correct message alignment, colors, and bubble tails

**Files:**
- Modify: `tests/friend-chat-layout.test.mjs:59-128`
- Modify: `src/components/friend/FriendChatPanel.vue:232-296`

**Interfaces:**
- Consumes: Existing `chat-message--mine`, `chat-message--friend`, and `message-bubble` classes selected by `isMine(message)`.
- Produces: A scoped CSS contract where own messages align right with `--brand-primary`, and friend messages align left with white.

- [ ] **Step 1: Write the failing layout assertions**

Update the alignment and tail assertions in `square message bubbles are narrow and point toward their aligned edge`:

```js
assert.match(mineRule, /items-end/)
assert.match(friendRule, /items-start/)
assert.match(ownOuterTailRule, /right:\s*-9px/)
assert.match(
  ownOuterTailRule,
  /border-left:\s*9px solid var\(--brand-primary\)/,
)
assert.match(ownInnerTailRule, /right:\s*-7px/)
assert.match(
  ownInnerTailRule,
  /border-left:\s*8px solid var\(--brand-primary\)/,
)
assert.match(friendOuterTailRule, /left:\s*-9px/)
assert.match(
  friendOuterTailRule,
  /border-right:\s*9px solid var\(--gray-100\)/,
)
assert.match(friendInnerTailRule, /left:\s*-7px/)
assert.match(friendInnerTailRule, /border-right:\s*8px solid white/)
```

Update the color assertions in `message ownership uses labels and source-specific bubble colors`:

```js
assert.match(mineBubbleRule, /bg-\[var\(--brand-primary\)\]/)
assert.match(mineBubbleRule, /text-\[var\(--brand-navy\)\]/)
assert.match(friendBubbleRule, /bg-white/)
assert.match(friendBubbleRule, /text-\[var\(--brand-active\)\]/)
assert.doesNotMatch(mineBubbleRule, /rounded/)
assert.doesNotMatch(friendBubbleRule, /rounded/)
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node tests\friend-chat-layout.test.mjs
```

Expected: FAIL because the current implementation contains `items-start` for own messages, `items-end` for friend messages, a white own bubble, and a gray friend bubble.

- [ ] **Step 3: Apply the minimal scoped CSS change**

Replace the ownership-specific rules in `FriendChatPanel.vue` with:

```css
.chat-message--mine {
  @apply items-end;
}

.chat-message--friend {
  @apply items-start;
}

.chat-message--mine .message-bubble {
  @apply border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-navy)];
}

.chat-message--mine .message-bubble::before {
  top: 11px;
  right: -9px;
  border-top-width: 8px;
  border-bottom-width: 8px;
  border-left: 9px solid var(--brand-primary);
}

.chat-message--mine .message-bubble::after {
  right: -7px;
  border-left: 8px solid var(--brand-primary);
}

.chat-message--friend .message-bubble {
  @apply border-[var(--gray-100)] bg-white text-[var(--brand-active)];
}

.chat-message--friend .message-bubble::before {
  top: 11px;
  left: -9px;
  border-top-width: 8px;
  border-bottom-width: 8px;
  border-right: 9px solid var(--gray-100);
}

.chat-message--friend .message-bubble::after {
  left: -7px;
  border-right: 8px solid white;
}
```

- [ ] **Step 4: Run focused and related tests and verify GREEN**

Run:

```powershell
node tests\friend-chat-layout.test.mjs
node tests\friend-api-integration.test.mjs
```

Expected: Both commands exit with code `0`; the layout test reports all chat layout subtests passing, and the API integration test keeps the existing chat rendering contract green.

- [ ] **Step 5: Verify the production build**

Run:

```powershell
npm run build
```

Expected: Vite completes the production build with exit code `0` and no Vue or Tailwind compilation errors.

- [ ] **Step 6: Review and commit the implementation**

Run:

```powershell
git diff --check
git diff -- tests/friend-chat-layout.test.mjs src/components/friend/FriendChatPanel.vue
git add -- tests/friend-chat-layout.test.mjs src/components/friend/FriendChatPanel.vue
git commit -m "fix(friend-chat): 修正訊息泡泡對齊與配色"
```

Expected: `git diff --check` prints no errors, the diff contains only the approved test and scoped CSS changes, and the commit succeeds.
