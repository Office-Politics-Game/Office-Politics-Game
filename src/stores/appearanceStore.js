import { defineStore } from "pinia";
import { getEquippedAppearance } from "@/services/playerAppearanceService.js";

function createDefaultAppearanceState() {
  return {
    playerId: null,
    avatarUrl: "",
    cardSkinUrl: "",
    cardSkinOverrides: {},
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
      this.cardSkinOverrides = appearance.cardSkinOverrides || {};
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
        this.cardSkinOverrides = {};
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

    setCardSkinLoadout({ baseUrl = "", overrides = {} } = {}) {
      this.cardSkinUrl = baseUrl || "";
      this.cardSkinOverrides = overrides || {};
      this.isHydrated = true;
    },
  },
});
