import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { scrollFriendChatToLatest } from "../src/utils/FriendChatScroll.js";

const friendChatPanelSource = await readFile(
  new URL("../src/components/friend/FriendChatPanel.vue", import.meta.url),
  "utf8",
);

test("好友聊天容器會捲到最新訊息位置", () => {
  const container = {
    scrollTop: 120,
    scrollHeight: 640,
  };

  scrollFriendChatToLatest(container);

  assert.equal(container.scrollTop, 640);
});

test("聊天容器尚未掛載時不會發生錯誤", () => {
  assert.doesNotThrow(() => scrollFriendChatToLatest(null));
  assert.doesNotThrow(() => scrollFriendChatToLatest(undefined));
});

test("FriendChatPanel 在目前對話更新後等待畫面完成再捲到底部", () => {
  assert.match(
    friendChatPanelSource,
    /<div ref="chatBodyRef" class="chat-body">/,
    "訊息內容區應提供 chatBodyRef",
  );
  assert.match(
    friendChatPanelSource,
    /import \{ computed, nextTick, ref, watch \} from "vue";/,
    "元件應使用 nextTick 等待訊息 DOM 更新",
  );
  assert.match(
    friendChatPanelSource,
    /import \{ scrollFriendChatToLatest \} from "@\/utils\/FriendChatScroll\.js";/,
    "元件應沿用共用捲動工具",
  );
  assert.match(
    friendChatPanelSource,
    /const chatBodyRef = ref\(null\);/,
    "元件應保存目前訊息內容區",
  );
  assert.match(
    friendChatPanelSource,
    /const latestMessageId = computed\(\s*\(\) =>\s*messages\.value\.at\(-1\)\?\.id \?\? null,?\s*\);/,
    "元件應追蹤目前 conversation 的最後一則訊息 ID",
  );

  const scrollHandlerMatch = friendChatPanelSource.match(
    /async function scrollToLatestMessage\(\) \{([\s\S]*?)\n\}/,
  );
  assert.ok(scrollHandlerMatch, "元件應定義 scrollToLatestMessage");

  const scrollHandlerBody = scrollHandlerMatch[1];
  const nextTickIndex = scrollHandlerBody.indexOf("await nextTick();");
  const scrollIndex = scrollHandlerBody.indexOf(
    "scrollFriendChatToLatest(chatBodyRef.value);",
  );

  assert.ok(nextTickIndex >= 0, "捲動前應等待 Vue 完成 DOM 更新");
  assert.ok(scrollIndex > nextTickIndex, "DOM 更新完成後才可捲到底部");
  assert.equal(
    (scrollHandlerBody.match(/scrollFriendChatToLatest\(/g) ?? []).length,
    1,
    "每次目前對話更新只呼叫一次捲動工具",
  );
  assert.match(
    friendChatPanelSource,
    /watch\(\s*\[\s*\(\) => props\.friend\.playerId,\s*\(\) => messages\.value\.length,\s*latestMessageId,\s*\],\s*scrollToLatestMessage,\s*\{ immediate: true \},\s*\);/,
    "元件應監聽好友、訊息數量與最新訊息 ID",
  );
});
