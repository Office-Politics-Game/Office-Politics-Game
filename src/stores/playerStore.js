import { defineStore } from "pinia";
import { normalizePlayerAvatar } from "@/utils/playerUtils.js";

export const usePlayerStore = defineStore("player", {
  state: () => ({
    currentPlayer: null,
  }),

  getters: {
    currentPlayerId: (state) => state.currentPlayer?.id ?? null,
  },

  actions: {
    setCurrentPlayer(player) {
      this.currentPlayer = normalizePlayerAvatar(player);
    },

    setCurrentPlayerAvatar(avatarUrl) {
      if (!this.currentPlayer) {
        return;
      }

      this.currentPlayer = {
        ...this.currentPlayer,
        avatarUrl: avatarUrl || this.currentPlayer.avatarUrl || "",
      };
    },

    resetPlayer() {
      this.currentPlayer = null;
    },
  },
});
