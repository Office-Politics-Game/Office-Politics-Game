import { defineStore } from "pinia";
import {
  createGuestPlayer as createGuestPlayerApi,
  getRoomState,
} from "../services/gameStateApi";

export const useGameStateStore = defineStore("gameState", {
  state: () => ({
    room: null,
    gameState: null,
    currentPlayer: null,
    currentPlayerId: null,
    currentTurnPlayerId: null,
    guestPlayer: null,
    isLoading: false,
    errorMessage: "",
  }),

  actions: {
    async createGuestPlayer(payload) {
      this.isLoading = true;
      this.errorMessage = "";

      try {
        const data = await createGuestPlayerApi(payload);

        this.guestPlayer = data.player;
        this.currentPlayer = data.player;
        this.currentPlayerId = data.player?.id || null;

        return data;
      } catch (error) {
        this.errorMessage =
          error instanceof Error ? error.message : "建立訪客玩家失敗";
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchRoomState(roomCode, payload) {
      this.isLoading = true;
      this.errorMessage = "";

      try {
        const data = await getRoomState(roomCode, payload);

        this.room = data.room || null;
        this.gameState = data.state || data.gameState || null;
        this.currentPlayer = data.currentPlayer || null;
        this.currentPlayerId =
          data.currentPlayer?.playerId ||
          data.currentPlayer?.id ||
          payload?.playerId ||
          null;
        this.currentTurnPlayerId = this.gameState?.currentTurnPlayerId || null;

        return data;
      } catch (error) {
        this.errorMessage =
          error instanceof Error ? error.message : "取得房間遊戲狀態失敗";
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    clearError() {
      this.errorMessage = "";
    },

    resetGameState() {
      this.room = null;
      this.gameState = null;
      this.currentPlayer = null;
      this.currentPlayerId = null;
      this.currentTurnPlayerId = null;
      this.guestPlayer = null;
      this.isLoading = false;
      this.errorMessage = "";
    },
  },
});
