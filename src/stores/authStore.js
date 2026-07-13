import { defineStore } from "pinia";
import {
  register as registerApi,
  login as loginApi,
  verifyToken as verifyTokenApi,
} from "../services/authApi.js";
import { hydratePlayerAppearanceBundle } from "@/services/playerAppearanceService.js";
import { useAppearanceStore } from "@/stores/appearanceStore.js";
import {
  forgotPassword as forgotPasswordApi,
  resetPassword as resetPasswordApi
} from "../services/authApi.js"

const AUTH_TOKEN_STORAGE_KEY = "gameAuthToken";

function getErrorMessage(error, fallbackMessage) {
  return error?.data?.message || error?.message || fallbackMessage;
}

function saveAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

function removeAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    currentPlayer: null,
    token: localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "",
    isLoggedIn: false,
    isLoading: false,
    hasVerifiedToken: false,
    errorMessage: "",
  }),

  actions: {
    async register(payload) {
      this.isLoading = true;
      this.errorMessage = "";

      try {
        const data = await registerApi(payload);
        return data;
      } catch (error) {
        this.errorMessage = getErrorMessage(error, "註冊失敗");
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async login(payload) {
      this.isLoading = true;
      this.errorMessage = "";
      const appearanceStore = useAppearanceStore();

      try {
        const data = await loginApi(payload);
        const token = data.token || "";
        const { player: hydratedPlayer, appearance } =
          await hydratePlayerAppearanceBundle(data.player || null);

        this.currentPlayer = hydratedPlayer;
        this.token = token;
        this.isLoggedIn = Boolean(token);
        this.hasVerifiedToken = Boolean(token);
        appearanceStore.applyAppearance({
          ...appearance,
          playerId: hydratedPlayer?.id ?? null,
        });

        if (token) {
          saveAuthToken(token);
        } else {
          removeAuthToken();
        }

        return data;
      } catch (error) {
        this.currentPlayer = null;
        this.token = "";
        this.isLoggedIn = false;
        this.hasVerifiedToken = false;
        this.errorMessage = getErrorMessage(error, "登入失敗");
        appearanceStore.resetAppearance();
        removeAuthToken();

        throw error;
      } finally {
        this.isLoading = false;
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
      const appearanceStore = useAppearanceStore();

      if (this.hasVerifiedToken && this.isLoggedIn && this.currentPlayer) {
        return true;
      }

      if (!this.token) {
        this.currentPlayer = null;
        this.isLoggedIn = false;
        this.hasVerifiedToken = false;
        appearanceStore.resetAppearance();
        removeAuthToken();
        return false;
      }

      this.isLoading = true;
      this.errorMessage = "";

      try {
        const data = await verifyTokenApi(this.token);
        const { player: hydratedPlayer, appearance } =
          await hydratePlayerAppearanceBundle(data.player || null);

        this.currentPlayer = hydratedPlayer;
        this.isLoggedIn = true;
        this.hasVerifiedToken = true;
        appearanceStore.applyAppearance({
          ...appearance,
          playerId: hydratedPlayer?.id ?? null,
        });

        return true;
      } catch (error) {
        this.currentPlayer = null;
        this.token = "";
        this.isLoggedIn = false;
        this.hasVerifiedToken = false;
        this.errorMessage = getErrorMessage(error, "驗證登入狀態失敗");
        appearanceStore.resetAppearance();
        removeAuthToken();

        return false;
      } finally {
        this.isLoading = false;
      }
    },

    logout() {
      const appearanceStore = useAppearanceStore();

      this.currentPlayer = null;
      this.token = "";
      this.isLoggedIn = false;
      this.hasVerifiedToken = false;
      this.errorMessage = "";
      appearanceStore.resetAppearance();
      removeAuthToken();
    },

    clearError() {
      this.errorMessage = "";
    },

    setCurrentPlayerAvatar(avatarUrl, avatarId = null) {
      if (!this.currentPlayer) {
        return;
      }

      this.currentPlayer = {
        ...this.currentPlayer,
        ...(avatarId !== null && avatarId !== undefined ? { avatarId } : {}),
        avatarUrl: avatarUrl || this.currentPlayer.avatarUrl || "",
      };
    },
  },
});
