import { defineStore } from "pinia";
import { getEquippedAppearance } from "@/services/playerAppearanceService.js";

function createDefaultAppearanceState() {
  return {
    playerId: null,
    avatarUrl: "",
    cardSkinUrl: "",
    cardBackUrl: "",
    boardSkinUrl: "",
    isHydrated: false,
  };
}

export const useAppearanceStore = defineStore("appearance", {
  state: () => createDefaultAppearanceState(),

  actions: {
    applyAppearance(appearance = {}) {
      this.playerId = appearance.playerId ?? this.playerId ?? null;
      this.avatarUrl = appearance.avatarUrl || "";
      this.cardSkinUrl = appearance.cardSkinUrl || "";
      this.cardBackUrl = appearance.cardBackUrl || "";
      this.boardSkinUrl = appearance.boardSkinUrl || "";
      this.isHydrated = true;
    },

    async hydrateForPlayer(playerId) {
      const numericPlayerId = Number(playerId);

      if (!Number.isInteger(numericPlayerId) || numericPlayerId <= 0) {
        this.resetAppearance();
        return createDefaultAppearanceState();
      }

      const appearance = await getEquippedAppearance(numericPlayerId);
      this.applyAppearance({
        ...appearance,
        playerId: numericPlayerId,
      });

      return appearance;
    },

    setAppearanceByCategory(categoryId, previewImage) {
      const nextUrl = previewImage || "";

      if (categoryId === "avatar") {
        this.avatarUrl = nextUrl;
      }

      if (categoryId === "card_skin") {
        this.cardSkinUrl = nextUrl;
      }

      if (categoryId === "card_back") {
        this.cardBackUrl = nextUrl;
      }

      if (categoryId === "board_skin") {
        this.boardSkinUrl = nextUrl;
      }

      this.isHydrated = true;
    },

    resetAppearance() {
      Object.assign(this, createDefaultAppearanceState());
    },
  },
});
