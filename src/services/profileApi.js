import { apiClient } from "./apiClient.js";

const PROFILE_API_PATH = "/profile";

function getProfile() {
  return apiClient.get(PROFILE_API_PATH);
}

function updateProfile(payload) {
  return apiClient.patch(PROFILE_API_PATH, payload);
}

function setProfileTitle(achievementCode) {
  return apiClient.patch(`${PROFILE_API_PATH}/title`, { achievementCode });
}

function getProfileMatches(params = {}) {
  return apiClient.get(`${PROFILE_API_PATH}/matches`, { params });
}

export { getProfile, getProfileMatches, setProfileTitle, updateProfile };
