import { Server } from "socket.io"
import { getChatPlayerRoom, registerChatHandlers } from "./chatHandlers.js"
import { registerRoomHandlers } from "./roomHandlers.js"
import { registerGameHandlers } from "./gameHandlers.js"

let activeSocketServer = null

function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN,
    },
  })

  activeSocketServer = io

  io.on("connection", (socket) => {
    console.log("socket connected", socket.id)

    registerRoomHandlers(io, socket)
    registerGameHandlers(io, socket)
    registerChatHandlers(socket)

    socket.on("socket:ping", (payload, callback) => {
        if (typeof callback === "function") {
            callback({
                ok: true,
                data: {
                    socketId: socket.id,
                    payload,
                },
            })
        }
    })

    socket.on("disconnect", () => {
      console.log("socket disconnected", socket.id)
    })
  })

  return io
}

function getSocketServer() {
  return activeSocketServer
}

export { getChatPlayerRoom, getSocketServer, initializeSocket }
