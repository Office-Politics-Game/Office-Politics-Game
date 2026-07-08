import { apiClient } from "./apiClient.js";

const AUTH_API_PATH = "/auth";

function register(payload) {
  return apiClient.post(`${AUTH_API_PATH}/register`, payload);
}

function login(payload) {
  return apiClient.post(`${AUTH_API_PATH}/login`, payload);
}

function verifyToken(token) {
  return apiClient.get(`${AUTH_API_PATH}/verify`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function forgotPassword(payload) {
  return apiClient.post(`${AUTH_API_PATH}/forgot-password`, payload);
}

function resetPassword(payload) {
  return apiClient.post(`${AUTH_API_PATH}/reset-password`, payload);
}

export { register, login, verifyToken, forgotPassword, resetPassword };
