import { defineStore } from "pinia"
import {
  register as registerApi,
  login as loginApi,
  verifyToken as verifyTokenApi,
  logout as logoutApi,
  forgotPassword as forgotPasswordApi,
  resetPassword as resetPasswordApi
} from "../services/authApi.js"
import { hydratePlayerAppearanceBundle } from "@/services/playerAppearanceService.js"
import { useAppearanceStore } from "@/stores/appearanceStore.js"

function getErrorMessage(error, fallbackMessage) {
  return error?.data?.message || error?.message || fallbackMessage
}

function resetAuthState(store) {
  store.currentPlayer = null
  store.isLoggedIn = false
  store.hasVerifiedToken = false
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    currentPlayer: null,
    isLoggedIn: false,
    isLoading: false,
    hasVerifiedToken: false,
    errorMessage: "",
  }),

  actions: {
    async register(payload) {
      this.isLoading = true
      this.errorMessage = ""

      try {
        return await registerApi(payload)
      } catch(error){
        this.errorMessage = getErrorMessage(error, "註冊失敗")
        throw error
      } finally{
        this.isLoading = false
      }
    },

    async login(payload) {
      this.isLoading = true
      this.errorMessage = ""
      const appearanceStore = useAppearanceStore()

      try {
        const data = await loginApi(payload)
        const { player: hydratedPlayer, appearance } =
          await hydratePlayerAppearanceBundle(data.player || null)

        this.currentPlayer = hydratedPlayer
        this.isLoggedIn = Boolean(hydratedPlayer)
        this.hasVerifiedToken = Boolean(hydratedPlayer)

        appearanceStore.applyAppearance({
          ...appearance,
          playerId: hydratedPlayer?.id ?? null
        })

        return data
      } catch (error) {
        resetAuthState(this)
        this.errorMessage = getErrorMessage(error, "登入失敗")
        appearanceStore.resetAppearance()
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async forgotPassword(payload) {
      this.isLoading = true
      this.errorMessage = ""

      try {
        return await forgotPasswordApi(payload)
      } catch (error) {
        this.errorMessage = getErrorMessage(error, "重設密碼信寄送失敗")
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async resetPassword(payload) {
      this.isLoading = true
      this.errorMessage = ""

      try {
        return await resetPasswordApi(payload)
      } catch (error) {
        this.errorMessage = getErrorMessage(error, "密碼重設失敗")
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async verifyToken() {
      const appearanceStore = useAppearanceStore()

      if (this.hasVerifiedToken && this.isLoggedIn && this.currentPlayer) {
        return true
      }

      this.isLoading = true
      this.errorMessage = ""

      try {
        const data = await verifyTokenApi()
        const { player: hydratedPlayer, appearance } =
          await hydratePlayerAppearanceBundle(data.player || null)

        if (!hydratedPlayer) {
          resetAuthState(this)
          appearanceStore.resetAppearance()
          return false
        }

        this.currentPlayer = hydratedPlayer
        this.isLoggedIn = true
        this.hasVerifiedToken = true

        appearanceStore.applyAppearance({
          ...appearance,
          playerId: hydratedPlayer?.id ?? null
        })

        return true
      } catch (error) {
        resetAuthState(this)
        this.errorMessage = getErrorMessage(error, "驗證登入狀態失敗")
        appearanceStore.resetAppearance()

        return false
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      const appearanceStore = useAppearanceStore()

      try {
        await logoutApi()
        resetAuthState(this)
        this.errorMessage = ""
        appearanceStore.resetAppearance()
        return true
      } catch (error) {
        this.errorMessage = getErrorMessage(error, "登出失敗")
        return false
      }
    },

    clearError() {
      this.errorMessage = ""
    },

    setCurrentPlayerAvatar(avatarUrl, avatarId = null) {
      if (!this.currentPlayer) {
        return
      }

      this.currentPlayer = {
        ...this.currentPlayer,
        ...(avatarId !== null && avatarId !== undefined ? { avatarId } : {}),
        avatarUrl: avatarUrl || this.currentPlayer.avatarUrl || "",
      }
    },
  },
})
