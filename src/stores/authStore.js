import { defineStore } from "pinia";
import {
  register as registerApi,
  login as loginApi,
  verifyToken as verifyTokenApi,
} from "../services/authApi.js";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    currentPlayer: null,
    token: "",
    isLoggedIn: false,
    isLoading: false,
    errorMessage: "",
  }),

  actions: {
    async register(payload){
        this.isLoading = true;
        this.errorMessage = "";
        try{
            const data = await registerApi(payload)
            this.currentPlayer = data.player || null;
            this.token = data.token || "";
            this.isLoggedIn = Boolean(this.token);
            return data;
        } catch(error){
            this.errorMessage = 
                error instanceof Error ? error.message : "註冊失敗";
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
            this.errorMessage =
            error instanceof Error ? error.message : "登入失敗";
            throw error;
        } finally {
            this.isLoading = false;
        }
    },
    async verifyToken(){
        
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