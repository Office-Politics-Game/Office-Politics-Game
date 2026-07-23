import { defineStore } from "pinia";
import { normalizePlayerAvatar } from "@/utils/playerUtils.js";

export const usePlayerStore = defineStore("player", {
  state: () => ({
    currentPlayer: null,
  }),

  getters: {
    currentPlayerId: (state) =>
      state.currentPlayer?.id ?? state.currentPlayer?.playerId ?? null,
  },

  actions: {
    setCurrentPlayer(player) {
      this.currentPlayer = normalizePlayerAvatar(player);
    },

    setCurrentPlayerAvatar(avatarUrl, avatarId = null) {
      if (!this.currentPlayer) {
        return;
      }

      this.currentPlayer = {
        ...this.currentPlayer,
        ...(avatarId !== null && avatarId !== undefined ? { avatarId } : {}),
        avatarUrl: avatarUrl || this.currentPlayer.avatarUrl || "",
      };
    },

    resetPlayer() {
      this.currentPlayer = null;
    },
  },
});
