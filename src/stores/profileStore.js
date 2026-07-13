import { defineStore } from "pinia";
import { getProfile } from "@/services/profileApi.js";
import { guestAvatars } from "@/constants/guestOptions.js";

const UNSET_TEXT = "尚未設定";
const DEFAULT_AVATAR_ID = 1;

function getErrorMessage(error, fallbackMessage) {
  return error?.data?.message || error?.message || fallbackMessage;
}

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
  if (!value) {
    return "尚未記錄";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "尚未記錄";
  }

  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function normalizeProfile(player, identityType) {
  if (!player?.id) {
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
  const avatarId = toNumber(
    player.avatarId ?? player.avatar_id,
    DEFAULT_AVATAR_ID,
  );
  const avatar =
    guestAvatars.find((item) => item.id === avatarId) ?? guestAvatars[0];
  const playerId = toNumber(player.id, 0);

  return {
    id: playerId,
    identityType,
    username: player.username || UNSET_TEXT,
    title: player.title || UNSET_TEXT,
    avatarId,
    avatarUrl: avatar.image,
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
    region: player.region || UNSET_TEXT,
    bio: player.bio || UNSET_TEXT,
  };
}

export const useProfileStore = defineStore("profile", {
  state: () => ({
    profile: null,
    isLoading: false,
    errorMessage: "",
    loadedIdentityType: "anonymous",
  }),

  getters: {
    isMemberProfile: (state) => state.loadedIdentityType === "member",
    isGuestProfile: (state) => state.loadedIdentityType === "guest",
    hasProfile: (state) => Boolean(state.profile),
  },

  actions: {
    async loadMemberProfile(token) {
      if (!token) {
        this.clearProfile("anonymous");
        this.errorMessage = "請先登入";
        return null;
      }

      this.isLoading = true;
      this.errorMessage = "";
      this.loadedIdentityType = "member";

      try {
        const data = await getProfile(token);
        this.profile = normalizeProfile(data.profile, "member");

        return this.profile;
      } catch (error) {
        this.profile = null;
        this.errorMessage = getErrorMessage(error, "個人資料載入失敗");
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    loadGuestProfile(player) {
      this.isLoading = false;
      this.errorMessage = "";
      this.loadedIdentityType = "guest";
      this.profile = normalizeProfile(player, "guest");

      return this.profile;
    },

    setProfileTitle(title) {
      if (!this.profile) {
        return;
      }

      this.profile.title = title || UNSET_TEXT;
    },

    clearProfile(identityType = "anonymous") {
      this.profile = null;
      this.isLoading = false;
      this.errorMessage = "";
      this.loadedIdentityType = identityType;
    },

    clearError() {
      this.errorMessage = "";
    },
  },
});
