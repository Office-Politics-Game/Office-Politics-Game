import { defineStore } from "pinia"
import { createGuestPlayer as createGuestPlayerApi, getRoomState } from "../services/gameStateApi"

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
        clearError() {
            this.errorMessage = ""
        },

        resetGameState() {
            this.room = null
            this.gameState = null
            this.currentPlayer = null
            this.currentPlayerId = null
            this.currentTurnPlayerId = null
            this.guestPlayer = null
            this.isLoading = false
            this.errorMessage = ""
        },
    },
})