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
    @close="goLobby"
  >
    <ProfileInfoPanel
      v-if="activeTab === 'profile'"
      :player="profilePlayer"
      :can-edit="profileStore.isMemberProfile"
      @edit="handleEditProfileField"
    />
    <AchievementPanel
      v-else-if="activeTab === 'badges' && profileStore.isMemberProfile"
      :achievements="achievementStore.achievements"
      :is-loading="achievementStore.isLoading"
      :error-message="achievementStore.errorMessage"
      @retry="fetchAchievements"
      @use-title="handleUseAchievementTitle"
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
      class="profile-state-exit-layer absolute inset-0 z-0 bg-center bg-cover opacity-0"
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
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import AchievementPanel from "@/components/profile/AchievementPanel.vue";
import ProfileEmptyPanel from "@/components/profile/ProfileEmptyPanel.vue";
import ProfileInfoPanel from "@/components/profile/ProfileInfoPanel.vue";
import ProfileShell from "@/components/profile/ProfileShell.vue";
import bgPersonal from "@/assets/images/bg-personal.webp";
import bgDashboard from "@/assets/images/bg-dashboard.webp";
import paperBackground from "@/assets/images/waiting-room.webp";
import { useProfileInitializer } from "@/composables/useProfileInitializer.js";
import { useAuthStore } from "@/stores/authStore.js";
import { useAchievementStore } from "@/stores/achievementStore.js";
import { usePlayerStore } from "@/stores/playerStore.js";
import { useProfileStore } from "@/stores/profileStore.js";

const router = useRouter();
const authStore = useAuthStore();
const achievementStore = useAchievementStore();
const playerStore = usePlayerStore();
const profileStore = useProfileStore();
const { initializeProfile: initializeProfileData } = useProfileInitializer();
const activeTab = ref("profile");
const isReturningToLobby = ref(false);
const RETURN_ANIMATION_DURATION = 700;

const tabs = [
  {
    id: "profile",
    label: "個人資料",
    description: "查看玩家基本資料與目前戰績。",
  },
  {
    id: "matches",
    label: "對戰紀錄",
    description: "完整對戰紀錄正在整理中，之後會顯示近期牌局與勝負結果。",
  },
  {
    id: "badges",
    label: "成就徽章",
    description: "成就牆即將開放，未來會展示你的辦公室生存里程碑。",
  },
  {
    id: "collection",
    label: "造型收藏",
    description: "收藏櫃正在佈置中，之後可查看已取得的頭像、牌背與桌面造型。",
  },
];

const memberOnlyTabIds = ["matches", "badges", "collection"];

const activeTabMeta = computed(
  () => tabs.find((tab) => tab.id === activeTab.value) ?? tabs[0],
);

const profilePlayer = computed(() => profileStore.profile);
const profilePlayerId = computed(() => profilePlayer.value?.id ?? null);
const lockedTabs = computed(() =>
  profileStore.isGuestProfile ? memberOnlyTabIds : [],
);
const isGuestLockedTab = computed(
  () =>
    profileStore.isGuestProfile && memberOnlyTabIds.includes(activeTab.value),
);

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
      return;
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

function handleEditProfileField() {
  if (!profileStore.isMemberProfile) {
    goLogin();
    return;
  }

  window.alert("個人資料編輯尚未開放。");
}

function handleUseAchievementTitle(achievement) {
  profileStore.setProfileTitle(achievement?.name);
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

onMounted(() => {
  if (profileStore.hasProfile || profileStore.errorMessage) {
    return;
  }

  initializeProfile();
});

watch(
  () => [
    authStore.token,
    authStore.isLoggedIn,
    playerStore.currentPlayer?.id,
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
  min-height: 48px;
  min-width: 144px;
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
  .profile-page-state.is-returning .profile-state-exit-layer {
    animation: none;
  }

  .profile-state-panel__spinner {
    animation: none;
  }
}
</style>
