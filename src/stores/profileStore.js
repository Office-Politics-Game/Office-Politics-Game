import { defineStore } from "pinia";
import { getProfile, updateProfile, getProfileMatches } from "@/services/profileApi.js";
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
  return level * 400 + 200;
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
    bio: player.bio || UNSET_TEXT,
  };
}

function normalizeMatchHistoryItem(match) {
  return {
    id: match.id,
    roomId: match.roomId,
    result: match.result,
    winnerPlayerId: match.winnerPlayerId,
    winnerUsername: match.winnerUsername || UNSET_TEXT,
    startedAt: match.startedAt,
    endedAt: match.endedAt,
    participants: Array.isArray(match.participants)
      ? match.participants.map((participant) => ({
          playerId: participant.playerId,
          username: participant.username || UNSET_TEXT,
          avatarId: toNumber(participant.avatarId, DEFAULT_AVATAR_ID),
          roundWins: toNumber(participant.roundWins, 0),
          result: participant.result,
        }))
      : [],
  };
}

export const useProfileStore = defineStore("profile", {
  state: () => ({
    profile: null,
    matchHistory: [],
    isLoading: false,
    isUpdating: false,
    isMatchHistoryLoading: false,
    errorMessage: "",
    matchHistoryErrorMessage: "",
    loadedIdentityType: "anonymous",
  }),

  getters: {
    isMemberProfile: (state) => state.loadedIdentityType === "member",
    isGuestProfile: (state) => state.loadedIdentityType === "guest",
    hasProfile: (state) => Boolean(state.profile),
  },

  actions: {
    async loadMemberProfile() {
      this.isLoading = true;
      this.errorMessage = "";
      this.loadedIdentityType = "member";

      try {
        const data = await getProfile();
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

    async updateMemberProfile(payload) {
      this.isUpdating = true
      this.errorMessage = ""

      try {
        const data = await updateProfile(payload)
        this.profile = normalizeProfile(data.profile, "member")

        return this.profile
      } catch (error) {
        this.errorMessage = getErrorMessage(error, "個人資料更新失敗")
        throw error
      } finally {
        this.isUpdating = false
      }
    },

    async loadMatchHistory(limit = 20) {
      if (!this.isMemberProfile) {
        this.matchHistory = []
        return []
      }

      this.isMatchHistoryLoading = true
      this.matchHistoryErrorMessage = ""

      try {
        const data = await getProfileMatches({ limit })
        this.matchHistory = (data.matches || []).map(normalizeMatchHistoryItem)

        return this.matchHistory
      } catch (error) {
        this.matchHistory = []
        this.matchHistoryErrorMessage = getErrorMessage(error, "對戰紀錄載入失敗")
        throw error
      } finally {
        this.isMatchHistoryLoading = false
      }
    },

    loadGuestProfile(player) {
      this.isLoading = false;
      this.errorMessage = "";
      this.loadedIdentityType = "guest";
      this.profile = normalizeProfile(player, "guest");

      return this.profile;
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
