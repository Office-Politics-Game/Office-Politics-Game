import axios from "axios";

function normalizeApiError(error) {
  const responseData = error?.response?.data ?? null;
  const status = error?.response?.status ?? null;
  const message =
    responseData?.message ||
    responseData?.error ||
    (error?.request
      ? "Unable to connect to the server. Please check your network and try again."
      : error?.message) ||
    "Request failed.";

  const normalizedError = new Error(message);
  normalizedError.status = status;
  normalizedError.data = responseData;

  return normalizedError;
}

const apiClient = axios.create({
  baseURL: "/api",
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(normalizeApiError(error)),
);

export { apiClient };
