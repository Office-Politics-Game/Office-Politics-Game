import { io } from "socket.io-client"

let socket = null

function getSocket() {
  if (!socket) {
    socket = io("/", {
      autoConnect: false,
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

function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect()
  }
}

export {
  getSocket,
  connectSocket,
  disconnectSocket,
}