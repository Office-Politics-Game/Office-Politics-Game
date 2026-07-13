import { defineStore } from "pinia"
import { getPlayerAchievements } from "@/services/achievementApi.js"

function getErrorMessage(error, fallbackMessage) {
  return error?.data?.message || error?.message || fallbackMessage
}

export const useAchievementStore = defineStore("achievement", {
  state: () => ({
    achievements: [],
    isLoading: false,
    errorMessage: "",
  }),

  actions: {
    async fetchPlayerAchievements(playerId) {
      this.isLoading = true
      this.errorMessage = ""

      try {
        const data = await getPlayerAchievements(playerId)

        this.achievements = data.achievements ?? []

        return data
      } catch (error) {
        this.errorMessage = getErrorMessage(error, "取得成就失敗")
        throw error
      } finally {
        this.isLoading = false
      }
    },

    clearError() {
      this.errorMessage = ""
    },

    resetAchievements() {
      this.achievements = []
      this.isLoading = false
      this.errorMessage = ""
    },
  },
})
