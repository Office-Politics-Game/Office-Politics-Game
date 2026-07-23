import { io } from "socket.io-client"
import { getDisplayErrorMessage } from "@/utils/errorMessages.js"

const DEFAULT_ACK_TIMEOUT_MS = 5000
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "/"
let socket = null

function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
    })
  }

  return socket
}

function connectSocket() {
  const activeSocket = getSocket()

  if (!activeSocket.connected) {
    activeSocket.connect()
  }

  return activeSocket
}

function emitWithAck(eventName, payload, { timeout = DEFAULT_ACK_TIMEOUT_MS } = {}) {
  const activeSocket = connectSocket()

  return new Promise((resolve, reject) => {
    activeSocket.timeout(timeout).emit(eventName, payload, (error, response) => {
      if (error) {
        reject(error)
        return
      }

      if (response?.ok === false) {
        const responseError = new Error(
          getDisplayErrorMessage(response.error, "即時連線失敗，請稍後再試"),
        )
        responseError.data = response.error
        reject(responseError)
        return
      }

      resolve(response?.data ?? response)
    })
  })
}

function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect()
  }
}

export {
  SOCKET_URL,
  getSocket,
  connectSocket,
  emitWithAck,
  disconnectSocket,
}
