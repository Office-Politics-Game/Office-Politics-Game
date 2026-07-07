<template>
  <ProfileShell
    v-model:active-tab="activeTab"
    :player="profilePlayer"
    :tabs="tabs"
    :background-image="bgPersonal"
    :exit-background-image="bgDashboard"
    :paper-image="paperBackground"
    :is-returning="isReturningToLobby"
    @close="goLobby"
  >
    <ProfileInfoPanel v-if="activeTab === 'profile'" :player="profilePlayer" />
    <ProfileEmptyPanel
      v-else
      :title="activeTabMeta.label"
      :description="activeTabMeta.description"
    />
  </ProfileShell>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import ProfileEmptyPanel from "@/components/profile/ProfileEmptyPanel.vue";
import ProfileInfoPanel from "@/components/profile/ProfileInfoPanel.vue";
import ProfileShell from "@/components/profile/ProfileShell.vue";
import bgPersonal from "@/assets/images/bg-personal.webp";
import bgDashboard from "@/assets/images/bg-dashboard.webp";
import paperBackground from "@/assets/images/waiting-room.webp";
import { guestAvatars } from "@/constants/guestOptions.js";
import { useAuthStore } from "@/stores/authStore.js";
import { usePlayerStore } from "@/stores/playerStore.js";

const router = useRouter();
const authStore = useAuthStore();
const playerStore = usePlayerStore();
const activeTab = ref("profile");
const isReturningToLobby = ref(false);
const RETURN_ANIMATION_DURATION = 520;

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

const activeTabMeta = computed(
  () => tabs.find((tab) => tab.id === activeTab.value) ?? tabs[0],
);

const storedGuestPlayer = computed(() => {
  try {
    return JSON.parse(localStorage.getItem("guestPlayer") || "null");
  } catch {
    return null;
  }
});

const sourcePlayer = computed(
  () =>
    authStore.currentPlayer ||
    playerStore.currentPlayer ||
    storedGuestPlayer.value ||
    {},
);

const profilePlayer = computed(() => {
  const player = sourcePlayer.value;
  const level = toNumber(player.level, 12);
  const exp = toNumber(player.exp, 3250);
  const nextExp = getNextExp(level);
  const winCount = toNumber(player.winCount ?? player.win_count, 62);
  const loseCount = toNumber(player.loseCount ?? player.lose_count, 38);
  const totalGames = toNumber(player.totalGames ?? player.total_games, winCount + loseCount);
  const avatar = guestAvatars.find((item) => item.id === toNumber(player.avatarId ?? player.avatar_id, 1));
  const playerId = toNumber(player.id, 1);

  return {
    id: playerId,
    username: player.username || "CEO小陳",
    title: player.title || "職場操盤手",
    avatarUrl: avatar?.image ?? guestAvatars[0].image,
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
    createdAtDisplay: formatDate(player.createdAt ?? player.created_at),
    region: player.region || "台灣",
    bio: player.bio || "在辦公室，我就是規則。",
  };
});

function toNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getNextExp(level) {
  return Math.max(level * 400 + 200, 1000);
}

function getWinRate(winCount, totalGames) {
  if (!totalGames) {
    return 0;
  }

  return Math.round((winCount / totalGames) * 100);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value) {
  const date = value ? new Date(value) : new Date("2024-12-01T00:00:00+08:00");

  if (Number.isNaN(date.getTime())) {
    return "2024/12/01";
  }

  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
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
</script>
