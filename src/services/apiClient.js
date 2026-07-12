import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function normalizeApiError(error) {
  const responseData = error?.response?.data ?? null;
  const status = error?.response?.status ?? null;
  const message =
    responseData?.message ||
    responseData?.error ||
    (error?.request
      ? "無法連線到伺服器，請檢查網路後再試。"
      : error?.message) ||
    "API 請求失敗，請稍後再試。";

  const normalizedError = new Error(message);
  normalizedError.status = status;
  normalizedError.data = responseData;

  return normalizedError;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

function emitUnlockedAchievements(data) {
  const unlockedAchievements = data?.unlockedAchievements;

  if (
    typeof window === "undefined" ||
    !Array.isArray(unlockedAchievements) ||
    unlockedAchievements.length === 0
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("achievement:unlocked", {
      detail: { achievements: unlockedAchievements },
    }),
  );
}

apiClient.interceptors.response.use(
  (response) => {
    emitUnlockedAchievements(response.data);
    return response.data;
  },
  (error) => Promise.reject(normalizeApiError(error)),
);

export { apiClient, API_BASE_URL };
