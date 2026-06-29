import { apiClient } from "./apiClient.js";

async function createGuestPlayer({ username, avatarId }) {
  const data = await apiClient.post("/players/guest", { username, avatarId });

  return data.player;
}

export { createGuestPlayer };
