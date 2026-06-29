import { Server } from "socket.io"

function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN,
    },
  })

  io.on("connection", (socket) => {
    console.log("socket connected", socket.id)

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

export { initializeSocket }