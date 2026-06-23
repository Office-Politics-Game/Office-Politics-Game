import { defineStore } from "pinia";

export const usePlayerStore = defineStore("player", {
  state: () => ({
    currentPlayer: {
      id: 1,
      username: "Player 1",
      avatarId: null,
    },
  }),

  getters: {
    currentPlayerId: (state) => state.currentPlayer?.id ?? null,
  },

  actions: {
    setCurrentPlayer(player) {
      this.currentPlayer = player;
    },

    resetPlayer() {
      this.currentPlayer = null;
    },
  },
});
