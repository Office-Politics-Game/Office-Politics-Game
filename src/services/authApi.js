import { apiClient } from "./apiClient.js";

const AUTH_API_PATH = "/auth";

function register(payload) {
  return apiClient.post(`${AUTH_API_PATH}/register`, payload);
}

function login(payload) {
  return apiClient.post(`${AUTH_API_PATH}/login`, payload);
}

function verifyToken() {
  return apiClient.get(`${AUTH_API_PATH}/verify`);
}

function logout() {
  return apiClient.post(`${AUTH_API_PATH}/logout`);
}

function forgotPassword(payload) {
  return apiClient.post(`${AUTH_API_PATH}/forgot-password`, payload);
}

function resetPassword(payload) {
  return apiClient.post(`${AUTH_API_PATH}/reset-password`, payload);
}

export { register, login, verifyToken, logout, forgotPassword, resetPassword };
