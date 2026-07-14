import { apiClient } from "./apiClient.js";

const PROFILE_API_PATH = "/profile";

function getProfile() {
  return apiClient.get(PROFILE_API_PATH)
}

function updateProfile(payload) {
  return apiClient.patch(PROFILE_API_PATH, payload)
}

function getProfileMatches(params = {}) {
  return apiClient.get(`${PROFILE_API_PATH}/matches`, { params });
}

export { getProfile, updateProfile, getProfileMatches };
