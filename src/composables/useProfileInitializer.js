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
    if (!authStore.hasVerifiedToken) {
      const isVerified = await authStore.verifyToken();

      if (!isVerified) {
        profileStore.clearProfile("anonymous");
        return {
          status: "auth_failed",
          profile: null,
        };
      }
    }

    if (authStore.isLoggedIn) {
      const profile = await profileStore.loadMemberProfile();

      return {
        status: "member",
        profile,
      };
    }

    const guestPlayer = playerStore.currentPlayer || readStoredGuestPlayer();

    if (guestPlayer?.id) {
      if (!playerStore.currentPlayer) {
        playerStore.setCurrentPlayer(guestPlayer);
      }

      const profile = profileStore.loadGuestProfile(guestPlayer);

      return {
        status: "guest",
        profile,
      };
    }

    profileStore.clearProfile("anonymous");
    return {
      status: "anonymous",
      profile: null,
    };
  }

  return {
    initializeProfile,
  };
}
