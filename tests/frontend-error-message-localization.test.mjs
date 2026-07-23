import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { getDisplayErrorMessage } from "../src/utils/errorMessages.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

async function readProjectFile(path) {
  return readFile(resolve(repoRoot, path), "utf8");
}

async function assertFileIncludes(path, expectedText) {
  const source = await readProjectFile(path);

  assert.match(
    source,
    new RegExp(expectedText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `${path} 應包含 ${expectedText}`,
  );
}

async function assertFileDoesNotMatch(path, pattern, description) {
  const source = await readProjectFile(path);

  assert.doesNotMatch(source, pattern, `${path} 不應${description}`);
}

const frontendErrorDisplayFiles = [
  "src/components/common/LoadingScreen.vue",
  "src/components/friend/AddFriendForm.vue",
  "src/components/friend/BlockedPlayerList.vue",
  "src/components/friend/FriendChatPanel.vue",
  "src/components/friend/FriendList.vue",
  "src/components/friend/FriendRequestList.vue",
  "src/components/gameRoom/InviteFriendModal.vue",
  "src/components/gameRoom/JoinRoomModal.vue",
  "src/components/gameRoom/WaitingRoomMenu.vue",
  "src/components/login/ForgotPasswordContent.vue",
  "src/components/login/GuestLoginModal.vue",
  "src/components/login/LoginContent.vue",
  "src/components/login/ResetPasswordContent.vue",
  "src/components/mall/MallProductGrid.vue",
  "src/components/profile/AchievementPanel.vue",
  "src/components/profile/ProfileAvatarModal.vue",
  "src/components/profile/ProfileEditModal.vue",
  "src/components/profile/ProfileEquipmentSwitcher.vue",
  "src/components/profile/ProfileMatchHistoryPanel.vue",
  "src/components/profile/ProfilePasswordModal.vue",
  "src/components/register/RegisterPage.vue",
  "src/views/CustomRoomView.vue",
  "src/views/ProfileEquipmentTestView.vue",
  "src/views/StyleStudioView.vue",
];

const frontendErrorSourceFiles = [
  "src/components/login/GuestLoginModal.vue",
  "src/components/profile/ProfilePasswordModal.vue",
  "src/components/register/RegisterPage.vue",
  "src/composables/useGameRoomState.js",
  "src/composables/useMallShop.js",
  "src/services/apiClient.js",
  "src/services/authApi.js",
  "src/services/gameActionApi.js",
  "src/services/socketClient.js",
  "src/stores/achievementStore.js",
  "src/stores/authStore.js",
  "src/stores/chatStore.js",
  "src/stores/currencyStore.js",
  "src/stores/friendStore.js",
  "src/stores/gameActionStore.js",
  "src/stores/gameStateStore.js",
  "src/stores/profileStore.js",
  "src/stores/roomInvitationStore.js",
  "src/stores/roomStore.js",
  "src/views/GachaView.vue",
  "src/views/ProfileEquipmentTestView.vue",
  "src/views/ProfileView.vue",
  "src/views/StyleStudioView.vue",
];

const frontendStaticPublicMessageFiles = [
  "src/components/gameRoom/JoinRoomModal.vue",
  "src/composables/useGameStageCardPlay.js",
  "src/services/roomApi.js",
];

const backendPublicErrorFiles = [
  "server/src/controllers/gachaController.js",
  "server/src/controllers/shopController.js",
  "server/src/services/achievementService.js",
  "server/src/services/authService.js",
  "server/src/services/cloudinaryService.js",
  "server/src/services/computerPlayerService.js",
  "server/src/services/currencyService.js",
  "server/src/services/drawService.js",
  "server/src/services/friendService.js",
  "server/src/services/gachaService.js",
  "server/src/services/playerService.js",
  "server/src/services/profileService.js",
  "server/src/services/roomService.js",
  "server/src/services/shopService.js",
  "server/src/services/topUpService.js",
  "server/src/socket/gameHandlers.js",
];

const staleEnglishPublicMessages = [
  "Add computer player failed",
  "Achievement has not been unlocked",
  "Achievement not found",
  "Computer username already exists",
  "Computer username is required",
  "Create Cloudinary signature failed",
  "Currency balance already reached max",
  "Deck is empty",
  "Failed to draw card",
  "Failed to fetch game logs",
  "Failed to fetch game result",
  "Failed to load owned cards",
  "Failed to play card",
  "Game session not found",
  "Get Cloudinary config failed",
  "Invalid ECPay CheckMacValue",
  "Invalid achievement code",
  "Invalid avatar ID",
  "Invalid player ID",
  "Invalid pool ID",
  "Keyword is required",
  "Missing environment variable",
  "Not this player's turn",
  "Player does not own the selected card skin",
  "Player not found",
  "Socket request failed",
  "Update card skin loadout failed",
  "Username already exists",
];

const staleTechnicalPublicMessages = [
  "API 請求失敗",
  "即時連線請求失敗",
  "建立圖片上傳簽章失敗",
  "取得圖片上傳設定失敗",
  "玩家尚未擁有選取的卡面",
  "牌庫已沒有卡牌",
  "取得房間狀態失敗。",
  "建立房間失敗。",
  "加入房間失敗。",
  "更新房間狀態失敗。",
  "開始遊戲失敗。",
  "建立訪客資料失敗。",
  "請先輸入房號。",
  "請先登入或建立訪客玩家。",
  "缺少房間代碼。",
  "還沒輪到你",
  "缺少登入驗證token",
  "此玩家已與你有封鎖關係",
];

const staleErrorStylePattern =
  /text-red-|text-rose-|#991B1B|#991b1b|#be123c|#BE123C|v-else-if="errorMessage"[^>]*text-\[var\(--brand-hover\)\]|v-if="errorMessage"[^>]*text-\[var\(--brand-hover\)\]|(?:login-error|is-error|__error|--error)[^{]*\{[^}]*color:\s*var\(--brand-hover\)/;

await assertFileIncludes("src/assets/styles/main.css", "--feedback-error: #b91c1c");

for (const path of frontendErrorDisplayFiles) {
  await assertFileIncludes(path, "--feedback-error");
  await assertFileDoesNotMatch(
    path,
    staleErrorStylePattern,
    "使用舊紅色 class 或 brand-hover 作為可見錯誤文字顏色",
  );
}

for (const path of frontendErrorSourceFiles) {
  await assertFileIncludes(path, "getDisplayErrorMessage");
  await assertFileDoesNotMatch(
    path,
    /error\.message \|\||error\?\.message \|\||error instanceof Error \? error\.message/,
    "直接顯示原始 Error.message 作為前端錯誤 fallback",
  );

  for (const message of staleEnglishPublicMessages) {
    await assertFileDoesNotMatch(
      path,
      new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `包含舊英文前端錯誤訊息 "${message}"`,
    );
  }

  for (const message of staleTechnicalPublicMessages) {
    await assertFileDoesNotMatch(
      path,
      new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `包含技術型前端錯誤訊息 "${message}"`,
    );
  }
}

for (const path of frontendStaticPublicMessageFiles) {
  for (const message of staleTechnicalPublicMessages) {
    await assertFileDoesNotMatch(
      path,
      new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `包含技術型前端錯誤訊息 "${message}"`,
    );
  }
}

for (const path of backendPublicErrorFiles) {
  for (const message of staleEnglishPublicMessages) {
    await assertFileDoesNotMatch(
      path,
      new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `回傳舊英文 public error "${message}"`,
    );
  }

  for (const message of staleTechnicalPublicMessages) {
    await assertFileDoesNotMatch(
      path,
      new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `回傳技術型 public error "${message}"`,
    );
  }
}

assert.equal(
  getDisplayErrorMessage(new Error("Username already exists"), "建立訪客資料失敗"),
  "暱稱已被使用",
);
assert.equal(
  getDisplayErrorMessage(new Error("Unexpected provider failure"), "第三方登入失敗"),
  "第三方登入失敗",
);
assert.equal(
  getDisplayErrorMessage({ data: { message: "找不到玩家資料" } }, "取得資料失敗"),
  "找不到玩家資料",
);

console.log("前端錯誤訊息中文化檢查通過");
