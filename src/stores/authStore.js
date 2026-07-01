import { defineStore } from "pinia";
import {
  register as registerApi,
  login as loginApi,
  verifyToken as verifyTokenApi,
} from "../services/authApi.js";

function getErrorMessage(error, fallbackMessage) {
  return error?.data?.message || error?.message || fallbackMessage;
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    currentPlayer: null,
    token: "",
    isLoggedIn: false,
    isLoading: false,
    errorMessage: "",
  }),

  actions: {
    async register(payload) {
      this.isLoading = true;
      this.errorMessage = "";

      try {
        const data = await registerApi(payload);

        return data
      } catch(error){
        this.errorMessage = getErrorMessage(error, "註冊失敗")
        throw error;
      } finally{
        this.isLoading = false;
      }
    },

    async login(payload) {
      this.isLoading = true;
      this.errorMessage = "";

      try {
        const data = await loginApi(payload);

        this.currentPlayer = data.player || null;
        this.token = data.token || "";
        this.isLoggedIn = Boolean(this.token);

        return data;
      } catch (error) {
        this.errorMessage = getErrorMessage(error, "登入失敗");
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async verifyToken() {
      if (!this.token) {
        this.isLoggedIn = false;
        return false;
      }

      this.isLoading = true;
      this.errorMessage = "";

      try {
        const data = await verifyTokenApi(this.token);
        this.currentPlayer = data.player || null;
        this.isLoggedIn = true;
        return true;
      } catch (error) {
        this.currentPlayer = null;
        this.token = "";
        this.isLoggedIn = false;
        this.errorMessage = getErrorMessage(error, "登入驗證失敗");
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    logout() {
      this.currentPlayer = null;
      this.token = "";
      this.isLoggedIn = false;
      this.errorMessage = "";
    },

    clearError() {
      this.errorMessage = "";
    },
  },
});
