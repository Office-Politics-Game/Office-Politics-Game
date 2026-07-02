import { defineStore } from "pinia";
import { getPlayerCurrency } from "../services/currencyApi.js";

function getErrorMessage(error, fallbackMessage) {
  return error?.data?.message || error?.message || fallbackMessage;
}

export const useCurrencyStore = defineStore("currency", {
  state: () => ({
    coins: 0,
    gems: 0,
    tickets: 0,
    isLoading: false,
    errorMessage: "",
  }),

  actions: {
    async fetchPlayerCurrency(playerId) {
      this.isLoading = true;
      this.errorMessage = "";

      try {
        const data = await getPlayerCurrency(playerId);

        this.coins = data.currency?.coins ?? 0;
        this.gems = data.currency?.gems ?? 0;
        this.tickets = data.currency?.tickets ?? 0;

        return data;
      } catch (error) {
        this.errorMessage = getErrorMessage(error, "取得遊戲幣失敗");
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    clearError() {
      this.errorMessage = "";
    },

    resetCurrency() {
      this.coins = 0;
      this.gems = 0;
      this.tickets = 0;
      this.isLoading = false;
      this.errorMessage = "";
    },
  },
});