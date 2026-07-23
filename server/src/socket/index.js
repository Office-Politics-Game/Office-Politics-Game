import { Server } from "socket.io"
import cookieParser from "cookie-parser"
import { getChatPlayerRoom, registerChatHandlers } from "./chatHandlers.js"
import { getFriendPlayerRoom, registerFriendHandlers } from "./friendHandlers.js"
import { registerRoomHandlers } from "./roomHandlers.js"
import { registerGameHandlers } from "./gameHandlers.js"

let activeSocketServer = null

function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    },
  })

  io.engine.use(cookieParser())

  activeSocketServer = io

  io.on("connection", (socket) => {
    console.log("socket connected", socket.id)

    registerRoomHandlers(io, socket)
    registerGameHandlers(io, socket)
    registerChatHandlers(socket)
    registerFriendHandlers(socket)

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

export {
  getChatPlayerRoom,
  getFriendPlayerRoom,
  getSocketServer,
  initializeSocket,
}
