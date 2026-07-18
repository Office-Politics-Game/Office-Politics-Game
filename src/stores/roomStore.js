import { defineStore } from "pinia";
import {
  createRoom as createRoomRequest,
  joinRoom as joinRoomRequest,
  getRoomState as getRoomStateRequest,
  getRoomGameState as getRoomGameStateRequest,
  updateRoomState as updateRoomStateRequest,
  addComputerPlayer as addComputerPlayerRequest,
  removePlayer as removePlayerRequest,
  startRoom as startRoomRequest,
} from "@/services/roomApi.js";
import { connectSocket, emitWithAck } from "@/services/socketClient.js";

const ROOM_CODE_STORAGE_KEY = "activeRoomCode";
const MAX_ROOM_PLAYERS = 4;
const MIN_READY_PLAYERS_TO_START = 3;
let activeRoomStore = null;
let subscribedRoomCode = "";
let subscribedPlayerId = null;

function getRoomCodeFromPayload(payload) {
  return payload?.room?.roomCode || payload?.room?.room_code || "";
}

function isCurrentRoomPayload(payload) {
  const payloadRoomCode = getRoomCodeFromPayload(payload);
  const currentRoomCode = subscribedRoomCode || activeRoomStore?.roomCode || "";

  if (!payloadRoomCode || !currentRoomCode) {
    return false;
  }

  return payloadRoomCode.toUpperCase() === currentRoomCode.toUpperCase();
}

function handleSocketRoomState(payload) {
  if (!isCurrentRoomPayload(payload)) {
    return;
  }

  activeRoomStore?.applyRoomState(payload);
}

function handleSocketRoomStarted(payload) {
  if (!isCurrentRoomPayload(payload)) {
    return;
  }

  activeRoomStore?.applyRoomState(payload);
}

function handleSocketPlayerTitleUpdated(payload) {
  if (!activeRoomStore || payload?.playerId === undefined || payload?.playerId === null) {
    return;
  }

  const playerId = String(payload.playerId);
  const hasRoomPlayer = activeRoomStore.players.some(
    (player) => String(player.playerId) === playerId,
  );

  if (!hasRoomPlayer) {
    return;
  }

  activeRoomStore.players = activeRoomStore.players.map((player) =>
    String(player.playerId) === playerId
      ? { ...player, title: String(payload.title || "") }
      : player,
  );
}

function handleSocketConnect() {
  if (!activeRoomStore || !subscribedRoomCode || !subscribedPlayerId) {
    return;
  }

  activeRoomStore
    .subscribeToRoom({
      roomCode: subscribedRoomCode,
      playerId: subscribedPlayerId,
      force: true,
    })
    .catch(() => null);
}

function bindRoomSocketListeners(store) {
  activeRoomStore = store;
  const socket = connectSocket();
  socket.off("room:state", handleSocketRoomState);
  socket.off("room:game-started", handleSocketRoomStarted);
  socket.off("player:title-updated", handleSocketPlayerTitleUpdated);
  socket.off("connect", handleSocketConnect);
  socket.on("room:state", handleSocketRoomState);
  socket.on("room:game-started", handleSocketRoomStarted);
  socket.on("player:title-updated", handleSocketPlayerTitleUpdated);
  socket.on("connect", handleSocketConnect);
}

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
      state.players.filter((player) => player.role !== "host" && player.isReady).length,
    isRoomReadyToStart: (state) =>
      state.players.length === MAX_ROOM_PLAYERS &&
      state.players.filter((player) => player.role !== "host" && player.isReady).length >=
        MIN_READY_PLAYERS_TO_START,
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
      subscribedRoomCode = "";
      subscribedPlayerId = null;
      saveRoomCode("");
    },

    async subscribeToRoom({
      roomCode = this.roomCode,
      playerId = subscribedPlayerId,
      force = false,
    } = {}) {
      if (!roomCode || !playerId) {
        return null;
      }

      const normalizedRoomCode = roomCode.trim().toUpperCase();
      const normalizedPlayerId = String(playerId);

      bindRoomSocketListeners(this);

      if (
        !force &&
        subscribedRoomCode === normalizedRoomCode &&
        String(subscribedPlayerId ?? "") === normalizedPlayerId
      ) {
        return null;
      }

      if (subscribedRoomCode && subscribedRoomCode !== normalizedRoomCode) {
        await emitWithAck("room:unsubscribe", {
          roomCode: subscribedRoomCode,
        }).catch(() => null);
      }

      const roomState = await emitWithAck("room:subscribe", {
        roomCode: normalizedRoomCode,
        playerId: normalizedPlayerId,
      });

      subscribedRoomCode = normalizedRoomCode;
      subscribedPlayerId = normalizedPlayerId;
      this.applyRoomState(roomState);

      return roomState;
    },

    async unsubscribeFromRoom(roomCode = subscribedRoomCode) {
      if (!roomCode) {
        return;
      }

      await emitWithAck("room:unsubscribe", {
        roomCode,
      }).catch(() => null);

      if (subscribedRoomCode === roomCode) {
        subscribedRoomCode = "";
        subscribedPlayerId = null;
      }
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
          await this.subscribeToRoom({
            roomCode: this.roomCode,
            playerId: payload?.hostPlayerId,
            force: true,
          }).catch(() => null);
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
        bindRoomSocketListeners(this);
        const normalizedRoomCode = roomCode.trim().toUpperCase();
        const normalizedPlayerId = String(payload?.playerId ?? "");
        const response = await emitWithAck("room:join", {
          roomCode: normalizedRoomCode,
          playerId: normalizedPlayerId,
        }).catch(async () => {
          const fallbackResponse = await joinRoomRequest(normalizedRoomCode, payload);
          const nextRoomState = fallbackResponse?.roomState ?? null;
          if (nextRoomState?.room) {
            this.applyRoomState(nextRoomState);
            return nextRoomState;
          }

          await this.fetchRoomState(normalizedRoomCode);
          return fallbackResponse;
        });
        this.roomCode = normalizedRoomCode;
        saveRoomCode(this.roomCode);
        this.gameState = null;

        if (response?.room) {
          this.applyRoomState(response);
        } else {
          await this.fetchRoomState(normalizedRoomCode);
        }

        await this.subscribeToRoom({
          roomCode: normalizedRoomCode,
          playerId: payload?.playerId,
          force: true,
        }).catch(() => null);
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
        const response = await emitWithAck("room:set-ready", {
          roomCode,
          ...payload,
        }).catch(async () => {
          const fallbackResponse = await updateRoomStateRequest(roomCode, payload);
          await this.fetchRoomState(roomCode);
          return fallbackResponse;
        });
        this.roomCode = roomCode;
        saveRoomCode(this.roomCode);
        if (response?.room) {
          this.applyRoomState(response);
        }
        return response;
      } catch (error) {
        this.errorMessage = getErrorMessage(error, "更新房間狀態失敗。");
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async addComputerPlayer(roomCode, payload) {
      this.isLoading = true;
      this.clearError();

      try {
        const response = await emitWithAck("room:add-computer", {
          roomCode,
          ...payload,
        }).catch(async () => {
          const fallbackResponse = await addComputerPlayerRequest(roomCode, payload);
          await this.fetchRoomState(roomCode);
          return fallbackResponse;
        });
        this.roomCode = roomCode;
        saveRoomCode(this.roomCode);
        if (response?.room) {
          this.applyRoomState(response);
        }
        return response;
      } catch (error) {
        this.errorMessage = getErrorMessage(error, "Add computer player failed");
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async removePlayer(roomCode, payload) {
      this.isLoading = true;
      this.clearError();

      try {
        const response = await emitWithAck("room:remove-player", {
          roomCode,
          ...payload,
        }).catch(async () => {
          const fallbackResponse = await removePlayerRequest(
            roomCode,
            payload?.targetPlayerId,
            {
              requesterPlayerId: payload?.requesterPlayerId,
            },
          );
          const nextRoomState = fallbackResponse?.roomState ?? fallbackResponse;
          if (nextRoomState?.room) {
            this.applyRoomState(nextRoomState);
          } else {
            await this.fetchRoomState(roomCode);
          }
          return nextRoomState;
        });

        this.roomCode = roomCode;
        saveRoomCode(this.roomCode);
        if (response?.room) {
          this.applyRoomState(response);
        }
        return response;
      } catch (error) {
        this.errorMessage = getErrorMessage(error, "移出玩家失敗");
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async startRoom(roomCode, payload) {
      this.isLoading = true;
      this.clearError();

      try {
        const response = await emitWithAck("room:start", {
          roomCode,
          ...payload,
        }).catch(async () => {
          const fallbackResponse = await startRoomRequest(roomCode, payload);
          await this.fetchRoomState(roomCode);
          return fallbackResponse;
        });
        this.roomCode = roomCode;
        saveRoomCode(this.roomCode);
        if (response?.room) {
          this.applyRoomState(response);
        }
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
