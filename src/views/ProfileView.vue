<template>
  <ProfileShell
    v-if="profilePlayer"
    v-model:active-tab="activeTab"
    :player="profilePlayer"
    :tabs="tabs"
    :locked-tabs="lockedTabs"
    :background-image="bgPersonal"
    :exit-background-image="bgDashboard"
    :paper-image="paperBackground"
    :is-returning="isReturningToLobby"
    :can-edit="profileStore.isMemberProfile"
    @close="goLobby"
    @edit-avatar="openAvatarEditor"
  >
    <ProfileInfoPanel
      v-if="activeTab === 'profile'"
      :player="profilePlayer"
      :can-edit="profileStore.isMemberProfile"
      @edit="handleEditProfileField"
    />
    <ProfileMatchHistoryPanel
      v-else-if="activeTab === 'matches' && profileStore.isMemberProfile"
      :matches="profileStore.matchHistory"
      :is-loading="profileStore.isMatchHistoryLoading"
      :error-message="profileStore.matchHistoryErrorMessage"
      @reload="profileStore.loadMatchHistory().catch(() => {})"
    />
    <AchievementPanel
      v-else-if="activeTab === 'badges' && profileStore.isMemberProfile"
      :achievements="achievementStore.achievements"
      :is-loading="achievementStore.isLoading"
      :error-message="achievementStore.errorMessage"
      @retry="fetchAchievements"
    />
    <ProfileEmptyPanel
      v-else-if="isGuestLockedTab"
      :title="activeTabMeta.label"
      description="訪客可以查看基本資料；登入正式帳號後即可使用這個個人資料功能。"
      action-label="前往登入"
      :button-disabled="false"
      @action="goLogin"
    />
    <ProfileEmptyPanel
      v-else
      :title="activeTabMeta.label"
      :description="activeTabMeta.description"
    />
  </ProfileShell>
  <main
    v-else
    class="profile-page-state grid min-h-[100svh] w-screen place-items-center overflow-hidden bg-[var(--brand-navy)] bg-center bg-cover p-4"
    :class="{ 'is-returning': isReturningToLobby }"
    :style="{ backgroundImage: `url(${bgPersonal})` }"
  >
    <div
      class="profile-state-exit-layer pointer-events-none absolute inset-0 z-0 bg-center bg-cover opacity-0"
      :style="{ backgroundImage: `url(${bgDashboard})` }"
      aria-hidden="true"
    ></div>
    <section
      v-if="profileStore.isLoading || profileStore.errorMessage"
      class="profile-state-panel"
      :class="{ 'profile-state-panel--loading': profileStore.isLoading }"
    >
      <p v-if="statePanel.eyebrow" class="profile-state-panel__eyebrow">
        {{ statePanel.eyebrow }}
      </p>
      <span
        v-if="profileStore.isLoading"
        class="profile-state-panel__spinner"
        aria-hidden="true"
      ></span>
      <h1 v-if="!profileStore.isLoading" class="profile-state-panel__title">
        {{ statePanel.title }}
      </h1>
      <p v-if="!profileStore.isLoading" class="profile-state-panel__copy">
        {{ statePanel.description }}
      </p>
      <div v-if="showStateActions" class="profile-state-panel__actions">
        <button
          v-if="profileStore.errorMessage"
          type="button"
          class="btn-dark profile-state-panel__button"
          @click="initializeProfile"
        >
          重新載入
        </button>
        <button
          v-if="profileStore.errorMessage"
          type="button"
          class="btn-dark profile-state-panel__button"
          @click="goLogin"
        >
          前往登入
        </button>
        <button
          v-if="showGuestAction"
          type="button"
          class="btn-glass profile-state-panel__button"
          @click="goEntry"
        >
          訪客遊玩
        </button>
      </div>
    </section>
  </main>
  <ProfileEditModal
    v-if="editingField"
    :field="editingField"
    :initial-value="editingInitialValue"
    :is-saving="profileStore.isUpdating"
    :error-message="editErrorMessage"
    @close="closeProfileEditor"
    @save="saveProfileField"
  />
  <ProfileAvatarModal
    v-if="isAvatarEditorOpen"
    :selected-avatar-id="profilePlayer?.avatarId"
    :is-saving="profileStore.isUpdating"
    :error-message="editErrorMessage"
    @close="closeAvatarEditor"
    @save="saveAvatar"
  />
  <ProfilePasswordModal
    v-if="isPasswordEditorOpen"
    @close="closePasswordEditor"
  />
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import AchievementPanel from "@/components/profile/AchievementPanel.vue";
import ProfileAvatarModal from "@/components/profile/ProfileAvatarModal.vue";
import ProfileEditModal from "@/components/profile/ProfileEditModal.vue";
import ProfileEmptyPanel from "@/components/profile/ProfileEmptyPanel.vue";
import ProfileInfoPanel from "@/components/profile/ProfileInfoPanel.vue";
import ProfileMatchHistoryPanel from "@/components/profile/ProfileMatchHistoryPanel.vue";
import ProfilePasswordModal from "@/components/profile/ProfilePasswordModal.vue";
import ProfileShell from "@/components/profile/ProfileShell.vue";
import bgDashboard from "@/assets/images/bg-dashboard.webp";
import bgPersonal from "@/assets/images/bg-personal.webp";
import paperBackground from "@/assets/images/waiting-room.webp";
import { guestAvatars } from "@/constants/guestOptions.js";
import { useProfileInitializer } from "@/composables/useProfileInitializer.js";
import {
  getPlayerEquippedItems,
  getPlayerShopItems,
} from "@/services/shopApi.js";
import { useAchievementStore } from "@/stores/achievementStore.js";
import { useAuthStore } from "@/stores/authStore.js";
import { usePlayerStore } from "@/stores/playerStore.js";
import { useProfileStore } from "@/stores/profileStore.js";

const router = useRouter();
const authStore = useAuthStore();
const achievementStore = useAchievementStore();
const playerStore = usePlayerStore();
const profileStore = useProfileStore();
const { initializeProfile: initializeProfileData } = useProfileInitializer();

const RETURN_ANIMATION_DURATION = 700;

const activeTab = ref("profile");
const isReturningToLobby = ref(false);
const equippedAvatarUrl = ref("");
const hasResolvedEquippedAvatar = ref(false);
const editingField = ref(null);
const editingInitialValue = ref("");
const isAvatarEditorOpen = ref(false);
const editErrorMessage = ref("");
const isPasswordEditorOpen = ref(false);

const tabs = [
  {
    id: "profile",
    label: "個人資料",
    description: "查看玩家基本資料與目前戰績。",
  },
  {
    id: "matches",
    label: "對戰紀錄",
    description: "查看近期牌局與勝負結果。",
  },
  {
    id: "badges",
    label: "成就徽章",
    description: "查看你的辦公室生存里程碑。",
  },
];

const memberOnlyTabIds = ["matches", "badges"];

const sourcePlayer = computed(() => {
  if (profileStore.profile) {
    return profileStore.profile;
  }

  if (profileStore.isMemberProfile || profileStore.isLoading) {
    return null;
  }

  return authStore.currentPlayer || playerStore.currentPlayer || null;
});

function toNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-TW").format(toNumber(value, 0));
}

function formatDate(value) {
  if (!value) {
    return "尚未設定";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "尚未設定";
  }

  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getNextExp(level) {
  const safeLevel = Math.max(1, toNumber(level, 1));
  return safeLevel * 400 + 200;
}

function getWinRate(winCount, totalGames) {
  const safeTotalGames = Math.max(0, toNumber(totalGames, 0));

  if (safeTotalGames === 0) {
    return 0;
  }

  return Math.round((toNumber(winCount, 0) / safeTotalGames) * 100);
}

const activeTabMeta = computed(
  () => tabs.find((tab) => tab.id === activeTab.value) ?? tabs[0],
);

const lockedTabs = computed(() =>
  profileStore.isGuestProfile ? memberOnlyTabIds : [],
);

const isGuestLockedTab = computed(
  () =>
    profileStore.isGuestProfile && memberOnlyTabIds.includes(activeTab.value),
);

const profilePlayer = computed(() => {
  if (profileStore.isMemberProfile && !profileStore.profile) {
    return null;
  }

  const player = sourcePlayer.value;

  if (!player) {
    return null;
  }

  const level = toNumber(player.level, 1);
  const exp = toNumber(player.exp, 0);
  const nextExp = getNextExp(level);
  const winCount = toNumber(player.winCount ?? player.win_count, 0);
  const loseCount = toNumber(player.loseCount ?? player.lose_count, 0);
  const totalGames = toNumber(
    player.totalGames ?? player.total_games,
    winCount + loseCount,
  );
  const avatarId = toNumber(player.avatarId ?? player.avatar_id, 1);
  const avatar = guestAvatars.find((item) => item.id === avatarId);
  const playerId = toNumber(player.id, 0);
  const fallbackAvatarUrl = avatar?.image ?? guestAvatars[0].image;
  const shouldWaitForEquippedAvatar =
    playerId > 0 && !player.avatarUrl && !hasResolvedEquippedAvatar.value;

  return {
    id: playerId,
    avatarId,
    username: player.username || "尚未設定",
    title: player.title || "尚未設定",
    avatarUrl: shouldWaitForEquippedAvatar
      ? ""
      : equippedAvatarUrl.value || player.avatarUrl || fallbackAvatarUrl,
    level,
    exp,
    nextExp,
    expPercent: Math.min(Math.round((exp / nextExp) * 100), 100),
    expDisplay: formatNumber(exp),
    nextExpDisplay: formatNumber(nextExp),
    winCount,
    loseCount,
    totalGames,
    winRate: getWinRate(winCount, totalGames),
    playerCode: `CEO_${String(playerId).padStart(4, "0")}`,
    createdAtDisplay: player.createdAtDisplay || formatDate(player.createdAt ?? player.created_at),
    bio: player.bio || "尚未設定",
  };
});

const profilePlayerId = computed(() => profilePlayer.value?.id ?? null);

const statePanel = computed(() => {
  if (profileStore.isLoading) {
    return {
      eyebrow: "",
      title: "資料載入中",
      description: "正在向伺服器取得你的個人資料。",
    };
  }

  if (profileStore.errorMessage) {
    return {
      eyebrow: "個人資料",
      title: "資料載入失敗",
      description: profileStore.errorMessage,
    };
  }

  return {
    eyebrow: "",
    title: "",
    description: "",
  };
});

const showStateActions = computed(() => Boolean(profileStore.errorMessage));

const showGuestAction = computed(
  () => profileStore.errorMessage && !authStore.isLoggedIn,
);

async function initializeProfile() {
  try {
    const result = await initializeProfileData();

    if (result?.status === "auth_failed") {
      router.replace({
        name: "Entry",
        query: { auth: "login" },
      });
      return;
    }

    if (result?.status === "anonymous") {
      router.replace({
        name: "Entry",
      });
    }
  } catch {
    activeTab.value = "profile";
  }
}

async function fetchAchievements() {
  if (
    activeTab.value !== "badges" ||
    !profileStore.isMemberProfile ||
    !profilePlayerId.value
  ) {
    achievementStore.resetAchievements();
    return;
  }

  await achievementStore
    .fetchPlayerAchievements(profilePlayerId.value)
    .catch(() => {});
}

function handleEditProfileField(item) {
  if (!profileStore.isMemberProfile) {
    goLogin();
    return;
  }

  if (item.id === "password") {
    openPasswordEditor();
    return;
  }

  if (!["username", "bio"].includes(item.id)) {
    return;
  }

  editingField.value = item;
  editingInitialValue.value =
    item.id === "bio" ? profilePlayer.value.bio : profilePlayer.value.username;
  editErrorMessage.value = "";
}

function closeProfileEditor() {
  editingField.value = null;
  editingInitialValue.value = "";
  editErrorMessage.value = "";
}

async function saveProfileField(value) {
  if (!editingField.value) {
    return;
  }

  try {
    const updatedProfile = await profileStore.updateMemberProfile({
      [editingField.value.id]: value,
    });

    authStore.currentPlayer = {
      ...authStore.currentPlayer,
      ...updatedProfile,
    };

    closeProfileEditor();
  } catch (error) {
    editErrorMessage.value =
      error?.data?.message || error?.message || "個人資料更新失敗";
  }
}

function openAvatarEditor() {
  if (!profileStore.isMemberProfile) {
    goLogin();
    return;
  }

  isAvatarEditorOpen.value = true;
  editErrorMessage.value = "";
}

function closeAvatarEditor() {
  isAvatarEditorOpen.value = false;
  editErrorMessage.value = "";
}

async function saveAvatar(avatarId) {
  try {
    const updatedProfile = await profileStore.updateMemberProfile({ avatarId });

    authStore.currentPlayer = {
      ...authStore.currentPlayer,
      ...updatedProfile,
    };

    if (updatedProfile?.avatarUrl || updatedProfile?.avatarId) {
      authStore.setCurrentPlayerAvatar(
        updatedProfile.avatarUrl,
        updatedProfile.avatarId,
      );
    }

    closeAvatarEditor();
  } catch (error) {
    editErrorMessage.value =
      error?.data?.message || error?.message || "頭像更新失敗";
  }
}

function openPasswordEditor() {
  isPasswordEditorOpen.value = true;
}

function closePasswordEditor() {
  isPasswordEditorOpen.value = false;
}

function goLogin() {
  router.push({
    name: "Entry",
    query: { auth: "login" },
  });
}

function goEntry() {
  router.push({
    name: "Entry",
  });
}

function goLobby() {
  if (isReturningToLobby.value) {
    return;
  }

  isReturningToLobby.value = true;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    router.push("/lobby");
    return;
  }

  window.setTimeout(() => {
    router.push("/lobby");
  }, RETURN_ANIMATION_DURATION);
}

watch(
  () => sourcePlayer.value?.id,
  async (playerId) => {
    equippedAvatarUrl.value = "";
    hasResolvedEquippedAvatar.value = false;

    const numericPlayerId = Number(playerId);

    if (!Number.isInteger(numericPlayerId) || numericPlayerId <= 0) {
      hasResolvedEquippedAvatar.value = true;
      return;
    }

    try {
      const [playerItemsResponse, equippedResponse] = await Promise.all([
        getPlayerShopItems(numericPlayerId),
        getPlayerEquippedItems(numericPlayerId),
      ]);

      const avatarItemId = equippedResponse?.equipped?.avatarItemId;
      const avatarInventoryEntry = (playerItemsResponse?.items || []).find(
        (entry) =>
          entry?.item?.type === "avatar" &&
          Number(entry?.item?.id) === Number(avatarItemId),
      );

      equippedAvatarUrl.value = avatarInventoryEntry?.item?.imageUrl || "";
    } catch {
      equippedAvatarUrl.value = "";
    } finally {
      hasResolvedEquippedAvatar.value = true;
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (profileStore.hasProfile || profileStore.errorMessage) {
    return;
  }

  initializeProfile();
});

watch(
  () => [
    authStore.isLoggedIn,
    playerStore.currentPlayer?.id,
    authStore.hasVerifiedToken,
    authStore.currentPlayer?.id,
  ],
  () => {
    initializeProfile();
  },
);

watch(
  () => [
    activeTab.value,
    profilePlayerId.value,
    profileStore.isMemberProfile,
  ],
  () => {
    fetchAchievements();
  },
  { immediate: true },
);

watch(
  () => [activeTab.value, profileStore.isMemberProfile],
  ([tab, isMemberProfile]) => {
    if (tab === "matches" && isMemberProfile) {
      profileStore.loadMatchHistory().catch(() => {});
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.profile-page-state::before {
  position: fixed;
  inset: 0;
  content: "";
  background:
    linear-gradient(
      90deg,
      rgba(0, 19, 50, 0.24),
      rgba(0, 19, 50, 0.06),
      rgba(0, 19, 50, 0.26)
    ),
    rgba(0, 0, 0, 0.12);
  pointer-events: none;
}

.profile-state-panel {
  position: relative;
  z-index: 1;
  width: min(520px, calc(100vw - 32px));
  border: 1px solid rgba(134, 179, 224, 0.38);
  background: rgba(255, 255, 255, 0.88);
  padding: 28px 24px;
  text-align: center;
  box-shadow: var(--shadow);
  backdrop-filter: blur(16px);
}

.profile-state-panel--loading {
  width: auto;
  min-width: 0;
  border-color: transparent;
  background: transparent;
  padding: 0;
  box-shadow: none;
  backdrop-filter: none;
}

.profile-state-panel__eyebrow {
  margin: 0;
  color: var(--brand-disabled);
  font-size: var(--text-xs);
  font-weight: 900;
  letter-spacing: 0.12em;
}

.profile-state-panel__title {
  margin: 12px 0 0;
  color: var(--brand-navy);
  font-size: var(--text-xl);
  font-weight: 900;
  line-height: 1.2;
}

.profile-state-panel__spinner {
  display: grid;
  width: 56px;
  height: 56px;
  margin: 0 auto;
  place-items: center;
  background:
    radial-gradient(
      circle,
      rgba(255, 255, 255, 0.95) 0 18%,
      transparent 19% 34%,
      rgba(255, 255, 255, 0.72) 35% 43%,
      transparent 44% 100%
    ) center / 100% 100%,
    conic-gradient(
      from 0deg,
      var(--brand-hover),
      rgba(134, 179, 224, 0.2),
      var(--brand-active)
    );
  border-radius: 999px;
  box-shadow: 0 12px 32px rgba(0, 19, 50, 0.2);
  animation: profileStateSpin 0.95s linear infinite;
}

.profile-state-panel__copy {
  margin: 12px auto 0;
  max-width: 420px;
  color: var(--gray-500);
  font-size: var(--text-sm);
  font-weight: 700;
  line-height: 1.7;
}

.profile-state-panel__actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
}

.profile-state-panel__button {
  min-width: 144px;
  min-height: 48px;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.profile-state-panel__button:hover {
  transform: translateY(-1px);
}

.profile-page-state.is-returning .profile-state-exit-layer {
  animation: dashboardReveal 700ms ease both;
}

@keyframes dashboardReveal {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes profileStateSpin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 760px) {
  .profile-state-panel__actions {
    flex-direction: column;
  }

  .profile-state-panel__button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .profile-page-state.is-returning .profile-state-exit-layer,
  .profile-state-panel__spinner {
    animation: none;
  }
}
</style>
