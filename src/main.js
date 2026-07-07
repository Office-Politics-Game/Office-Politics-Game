import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "@/stores/authStore.js";
import { usePlayerStore } from "@/stores/playerStore.js";
import "./assets/styles/main.css";

function restoreGuestPlayer(playerStore) {
  try {
    const savedPlayer = JSON.parse(localStorage.getItem("guestPlayer") || "null");

    if (savedPlayer?.id) {
      playerStore.setCurrentPlayer(savedPlayer);
      return;
    }
  } catch {
    localStorage.removeItem("guestPlayer");
  }

  playerStore.resetPlayer();
}

async function bootstrapApplication() {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);

  const authStore = useAuthStore(pinia);
  const playerStore = usePlayerStore(pinia);

  if (authStore.token) {
    const isVerified = await authStore.verifyToken();

    if (isVerified && authStore.currentPlayer) {
      playerStore.setCurrentPlayer(authStore.currentPlayer);
    } else {
      playerStore.resetPlayer();
    }
  } else {
    restoreGuestPlayer(playerStore);
  }

  app.use(router);
  await router.isReady();
  app.mount("#app");
}

bootstrapApplication();
