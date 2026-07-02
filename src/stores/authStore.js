import { defineStore } from "pinia"
import {
  register as registerApi,
  login as loginApi,
  verifyToken as verifyTokenApi,
} from "../services/authApi.js"

const AUTH_TOKEN_STORAGE_KEY = "gameAuthToken"

function getErrorMessage(error, fallbackMessage) {
  return error?.data?.message || error?.message || fallbackMessage
}

function saveAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
}

function removeAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    currentPlayer: null,
    token: localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "",
    isLoggedIn: false,
    isLoading: false,
    hasVerifiedToken: false,
    errorMessage: ""
  }),

  actions: {
    async register(payload) {
      this.isLoading = true
      this.errorMessage = ""

      try {
        const data = await registerApi(payload)

        return data
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

      try {
        const data = await loginApi(payload)
        const token = data.token || ""

        this.currentPlayer = data.player || null
        this.token = token
        this.isLoggedIn = Boolean(token)
        this.hasVerifiedToken = Boolean(token)

        if (token) {
          saveAuthToken(token)
        } else {
          removeAuthToken()
        }

        return data
      } catch (error) {
        this.currentPlayer = null
        this.token = ""
        this.isLoggedIn = false
        this.hasVerifiedToken = false
        this.errorMessage = getErrorMessage(error, "登入失敗")
        removeAuthToken()

        throw error
      } finally {
        this.isLoading = false
      }
    },

    async verifyToken() {
      if (this.hasVerifiedToken && this.isLoggedIn && this.currentPlayer) {
        return true
      }

      if (!this.token) {
        this.currentPlayer = null
        this.isLoggedIn = false
        this.hasVerifiedToken = false
        removeAuthToken()

        return false
      }

      this.isLoading = true
      this.errorMessage = ""

      try {
        const data = await verifyTokenApi(this.token)

        this.currentPlayer = data.player || null
        this.isLoggedIn = true
        this.hasVerifiedToken = true

        return true
      } catch (error) {
        this.currentPlayer = null
        this.token = ""
        this.isLoggedIn = false
        this.hasVerifiedToken = false
        this.errorMessage = getErrorMessage(error, "登入驗證失敗")
        removeAuthToken()

        return false
      } finally {
        this.isLoading = false
      }
    },

    logout() {
      this.currentPlayer = null
      this.token = ""
      this.isLoggedIn = false
      this.hasVerifiedToken = false
      this.errorMessage = ""
      removeAuthToken()
    },

    clearError() {
      this.errorMessage = ""
    }
  }
})
