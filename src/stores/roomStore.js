import { defineStore } from "pinia";
import {
  createRoom as createRoomRequest,
  joinRoom as joinRoomRequest,
  getRoomState as getRoomStateRequest,
  getRoomGameState as getRoomGameStateRequest,
  updateRoomState as updateRoomStateRequest,
  startRoom as startRoomRequest,
} from "@/services/roomApi.js";

const ROOM_CODE_STORAGE_KEY = "activeRoomCode";

function getErrorMessage(error, fallbackMessage) {
  return error?.data?.message || error?.message || fallbackMessage;
}

function getStoredRoomCode() {
  if (typeof sessionStorage === "undefined") {
    return "";
  }

  return sessionStorage.getItem(ROOM_CODE_STORAGE_KEY) || "";
}

function saveRoomCode(roomCode) {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  if (roomCode) {
    sessionStorage.setItem(ROOM_CODE_STORAGE_KEY, roomCode);
    return;
  }

  sessionStorage.removeItem(ROOM_CODE_STORAGE_KEY);
}

export const useRoomStore = defineStore("room", {
  state: () => ({
    room: null,
    roomCode: getStoredRoomCode(),
    players: [],
    gameState: null,
    isLoading: false,
    errorMessage: "",
  }),

  getters: {
    readyPlayerCount: (state) =>
      state.players.filter((player) => player.isReady).length,
    isRoomReadyToStart: (state) =>
      state.players.length === 4 &&
      state.players.every((player) => player.isReady),
  },

  actions: {
    applyRoomState(payload) {
      if (payload?.room) {
        this.room = payload.room;
        this.roomCode = payload.room.roomCode || payload.room.room_code || "";
        saveRoomCode(this.roomCode);
      }

      if (Array.isArray(payload?.players)) {
        this.players = payload.players;
      }
    },

    clearError() {
      this.errorMessage = "";
    },

    resetRoom() {
      this.room = null;
      this.roomCode = "";
      this.players = [];
      this.gameState = null;
      this.isLoading = false;
      this.errorMessage = "";
      saveRoomCode("");
    },

    async fetchRoomState(roomCode = this.roomCode) {
      if (!roomCode) {
        return null;
      }

      try {
        const roomState = await getRoomStateRequest(roomCode);
        this.applyRoomState(roomState);
        return roomState;
      } catch (error) {
        this.errorMessage = getErrorMessage(error, "取得房間狀態失敗。");
        throw error;
      }
    },

    async createRoom(payload) {
      this.isLoading = true;
      this.clearError();

      try {
        const response = await createRoomRequest(payload);
        this.room = response?.room ?? null;
        this.roomCode = response?.room?.roomCode || response?.room?.room_code || "";
        saveRoomCode(this.roomCode);
        this.gameState = null;

        if (this.roomCode) {
          await this.fetchRoomState(this.roomCode);
        }

        return response;
      } catch (error) {
        this.errorMessage = getErrorMessage(error, "建立房間失敗。");
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async joinRoom(roomCode, payload) {
      this.isLoading = true;
      this.clearError();

      try {
        const response = await joinRoomRequest(roomCode, payload);
        this.roomCode = roomCode;
        saveRoomCode(this.roomCode);
        this.gameState = null;
        await this.fetchRoomState(roomCode);
        return response;
      } catch (error) {
        this.errorMessage = getErrorMessage(error, "加入房間失敗。");
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateRoomState(roomCode, payload) {
      this.isLoading = true;
      this.clearError();

      try {
        const response = await updateRoomStateRequest(roomCode, payload);
        this.roomCode = roomCode;
        saveRoomCode(this.roomCode);
        await this.fetchRoomState(roomCode);
        return response;
      } catch (error) {
        this.errorMessage = getErrorMessage(error, "更新房間狀態失敗。");
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async startRoom(roomCode, payload) {
      this.isLoading = true;
      this.clearError();

      try {
        const response = await startRoomRequest(roomCode, payload);
        this.roomCode = roomCode;
        saveRoomCode(this.roomCode);
        await this.fetchRoomState(roomCode);
        this.gameState = await getRoomGameStateRequest(
          roomCode,
          payload?.playerId,
        );
        return response;
      } catch (error) {
        this.errorMessage = getErrorMessage(error, "開始遊戲失敗。");
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
