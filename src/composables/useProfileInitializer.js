import { useAuthStore } from "@/stores/authStore.js";
import { usePlayerStore } from "@/stores/playerStore.js";
import { useProfileStore } from "@/stores/profileStore.js";

function readStoredGuestPlayer() {
  try {
    return JSON.parse(localStorage.getItem("guestPlayer") || "null");
  } catch {
    localStorage.removeItem("guestPlayer");
    return null;
  }
}

export function useProfileInitializer() {
  const authStore = useAuthStore();
  const playerStore = usePlayerStore();
  const profileStore = useProfileStore();

  async function initializeProfile() {
    if (authStore.token && !authStore.hasVerifiedToken) {
      await authStore.verifyToken();
    }

    if (authStore.isLoggedIn && authStore.token) {
      return profileStore.loadMemberProfile(authStore.token);
    }

    const guestPlayer = playerStore.currentPlayer || readStoredGuestPlayer();

    if (guestPlayer?.id) {
      if (!playerStore.currentPlayer) {
        playerStore.setCurrentPlayer(guestPlayer);
      }

      return profileStore.loadGuestProfile(guestPlayer);
    }

    profileStore.clearProfile("anonymous");
    return null;
  }

  return {
    initializeProfile,
  };
}
