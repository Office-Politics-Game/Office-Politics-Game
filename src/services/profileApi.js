import { apiClient } from "./apiClient.js";

const PROFILE_API_PATH = "/profile";

function getProfile(token) {
  return apiClient.get(PROFILE_API_PATH, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export { getProfile };
