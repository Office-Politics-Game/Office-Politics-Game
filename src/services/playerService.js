import { apiClient } from "./apiClient.js";

async function createGuestPlayer({ username, avatarId }) {
  const data = await apiClient.post("/players/guest", { username, avatarId });

  return data.player;
}

function searchPlayers({ keyword, playerId }) {
  return apiClient.get("/players/search", {
    params: { keyword, playerId },
  });
}

export { createGuestPlayer, searchPlayers };
