import { computed } from "vue";
import { useAuthStore } from "@/stores/authStore.js";
import { usePlayerStore } from "@/stores/playerStore.js";

export function useCurrentPlayerId() {
  const authStore = useAuthStore();
  const playerStore = usePlayerStore();

  const currentPlayerId = computed(
    () => authStore.currentPlayer?.id ?? playerStore.currentPlayerId ?? null,
  );

  return {
    currentPlayerId,
  };
}
