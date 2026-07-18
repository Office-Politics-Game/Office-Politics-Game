import { defineStore } from "pinia"
import {
  drawCard as drawCardApi,
  getGameLogs,
  getGameResult,
  playCard as playCardApi,
} from "@/services/gameActionApi"

function getActionErrorMessage(error, fallbackMessage) {
  return error instanceof Error ? error.message : fallbackMessage
}

function getNextGameState(data) {
  return data?.state ?? data?.gameState ?? null
}

function getNextTurnPlayerId(data, gameState) {
  return gameState?.currentTurnPlayerId ?? data?.currentTurnPlayerId ?? null
}

export const useGameActionStore = defineStore("gameAction", {
  state: () => ({
    gameState: null,
    currentTurnPlayerId: null,
    drawnCard: null,
    playResult: null,
    logs: [],
    result: null,
    isLoading: false,
    errorMessage: "",
  }),

  actions: {
    async drawCard(roomCode, payload = {}) {
      this.isLoading = true
      this.errorMessage = ""

      try {
        const data = await drawCardApi(roomCode, payload)
        const nextGameState = getNextGameState(data)

        this.drawnCard = data?.drawnCard ?? data?.card ?? null
        this.gameState = nextGameState
        this.currentTurnPlayerId = getNextTurnPlayerId(data, nextGameState)

        return data
      } catch (error) {
        this.errorMessage = getActionErrorMessage(error, "Failed to draw card")
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async playCard(roomCode, payload = {}) {
      this.isLoading = true
      this.errorMessage = ""

      try {
        const data = await playCardApi(roomCode, payload)
        const nextGameState = getNextGameState(data)

        this.playResult = data?.result ?? data?.playResult ?? data ?? null
        this.gameState = nextGameState
        this.currentTurnPlayerId = getNextTurnPlayerId(data, nextGameState)

        return data
      } catch (error) {
        this.errorMessage = getActionErrorMessage(error, "Failed to play card")
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchGameLogs(roomCode, payload = {}) {
      this.isLoading = true
      this.errorMessage = ""

      try {
        const data = await getGameLogs(roomCode, payload)

        this.logs = Array.isArray(data) ? data : data?.logs ?? []

        return data
      } catch (error) {
        this.errorMessage = getActionErrorMessage(error, "Failed to fetch game logs")
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchGameResult(roomCode, payload = {}) {
      this.isLoading = true
      this.errorMessage = ""
      this.result = null

      try {
        const data = await getGameResult(roomCode, payload)

        this.result = data?.result ?? data ?? null

        return data
      } catch (error) {
        this.errorMessage = getActionErrorMessage(error, "Failed to fetch game result")
        throw error
      } finally {
        this.isLoading = false
      }
    },

    clearError() {
      this.errorMessage = ""
    },

    resetGameActionState() {
      this.gameState = null
      this.currentTurnPlayerId = null
      this.drawnCard = null
      this.playResult = null
      this.logs = []
      this.result = null
      this.isLoading = false
      this.errorMessage = ""
    },
  },
})
