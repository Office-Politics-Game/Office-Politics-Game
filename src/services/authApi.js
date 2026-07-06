import { apiClient } from "./apiClient.js";

const AUTH_API_PATH = "/auth";

function register(payload) {
  return apiClient.post(`${AUTH_API_PATH}/register`, payload);
}

function login(payload) {
  return apiClient.post(`${AUTH_API_PATH}/login`, payload);
}

function verifyToken(token) {
  return apiClient.get(`${AUTH_API_PATH}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export { register, login, verifyToken };
