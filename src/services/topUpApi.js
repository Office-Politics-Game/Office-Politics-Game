import { apiClient } from "./apiClient.js";

const TOP_UP_API_PATH = "/top-ups";

function getTopUpPackages() {
  return apiClient.get(`${TOP_UP_API_PATH}/packages`);
}

function createTopUpOrder({ playerId, packageId }) {
  return apiClient.post(`${TOP_UP_API_PATH}/orders`, {
    playerId,
    packageId,
  });
}

function createEcpayCheckout(orderId) {
  return apiClient.post(`${TOP_UP_API_PATH}/orders/${orderId}/ecpay-checkout`);
}

export { getTopUpPackages, createTopUpOrder, createEcpayCheckout };