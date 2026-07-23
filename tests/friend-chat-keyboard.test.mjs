import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { isFriendChatSubmitShortcut } from "../src/utils/FriendChatKeyboard.js";

const friendChatPanelSource = await readFile(
  new URL("../src/components/friend/FriendChatPanel.vue", import.meta.url),
  "utf8",
);

test("沒有修飾鍵的 Enter 是好友聊天送出快捷鍵", () => {
  assert.equal(
    isFriendChatSubmitShortcut({
      key: "Enter",
      shiftKey: false,
      ctrlKey: false,
      altKey: false,
      metaKey: false,
      isComposing: false,
    }),
    true,
  );
});

test("修飾鍵、輸入法組字與非 Enter 按鍵不會觸發送出", () => {
  const events = [
    { key: "Enter", shiftKey: true },
    { key: "Enter", ctrlKey: true },
    { key: "Enter", altKey: true },
    { key: "Enter", metaKey: true },
    { key: "Enter", isComposing: true },
    { key: "a" },
  ];

  for (const event of events) {
    assert.equal(isFriendChatSubmitShortcut(event), false);
  }
});

test("FriendChatPanel 只在可送出時沿用一次既有送出流程", () => {
  assert.match(
    friendChatPanelSource,
    /@keydown="handleMessageKeydown"/,
    "textarea 應綁定鍵盤事件處理函式",
  );
  assert.match(
    friendChatPanelSource,
    /import \{ isFriendChatSubmitShortcut \} from "@\/utils\/FriendChatKeyboard\.js";/,
    "元件應使用共用鍵盤判斷函式",
  );

  const handlerMatch = friendChatPanelSource.match(
    /function handleMessageKeydown\(event\) \{([\s\S]*?)\n\}/,
  );
  assert.ok(handlerMatch, "元件應定義 handleMessageKeydown");

  const handlerBody = handlerMatch[1];
  const shortcutIndex = handlerBody.indexOf(
    "isFriendChatSubmitShortcut(event)",
  );
  const preventDefaultIndex = handlerBody.indexOf("event.preventDefault();");
  const disabledIndex = handlerBody.indexOf("if (sendDisabled.value)");
  const submitIndex = handlerBody.indexOf("submitMessage();");

  assert.ok(shortcutIndex >= 0, "應先判斷是否為送出快捷鍵");
  assert.ok(
    preventDefaultIndex > shortcutIndex,
    "送出快捷鍵應在判斷後阻止 textarea 預設換行",
  );
  assert.ok(
    disabledIndex > preventDefaultIndex,
    "應在阻止預設換行後檢查目前是否可送出",
  );
  assert.ok(submitIndex > disabledIndex, "可送出時才呼叫既有送出流程");
  assert.equal(
    (handlerBody.match(/\bsubmitMessage\(\);/g) ?? []).length,
    1,
    "鍵盤處理函式只能呼叫一次 submitMessage",
  );
});

test("FriendChatPanel 立即清空輸入框並在送出失敗時還原內容", () => {
  const submitMatch = friendChatPanelSource.match(
    /async function submitMessage\(\) \{([\s\S]*?)\n\}/,
  );
  assert.ok(submitMatch, "FriendChatPanel 應定義 submitMessage");

  const body = submitMatch[1];
  const preserveIndex = body.indexOf("const originalMessage = messageText.value;");
  const dispatchIndex = body.indexOf("const sendRequest = chatStore.sendMessage({");
  const clearIndex = body.indexOf('messageText.value = "";');
  const awaitIndex = body.indexOf("const sentMessage = await sendRequest;");
  const restoreIndex = body.indexOf("messageText.value = originalMessage;");

  assert.ok(preserveIndex >= 0);
  assert.ok(dispatchIndex > preserveIndex);
  assert.ok(clearIndex > dispatchIndex);
  assert.ok(awaitIndex > clearIndex);
  assert.ok(restoreIndex > awaitIndex);
  assert.match(
    body,
    /if \(!sentMessage\) \{[\s\S]*messageText\.value = originalMessage;/,
  );
});
