import { getRoomState, updateReady, startGame } from "../services/roomService.js"

function registerRoomHandlers(io, socket) {
    socket.on("room:subscribe", async (payload, callback) => {
        try {
            const { roomCode, playerId } = payload

            console.log("room:subscribe", roomCode, playerId)

            socket.join(roomCode)

            const roomState = await getRoomState({ roomCode })

            io.to(roomCode).emit("room:state", roomState)

            if (typeof callback === "function") {
                callback({
                    ok: true,
                    data: roomState,
                })
            }
        } catch (error) {
            if (typeof callback === "function") {
                callback({
                    ok: false,
                    error: {
                        message: error.message,
                    },
                })
            }
        }
    })

    socket.on("room:unsubscribe", (payload, callback) => {
        const { roomCode } = payload

        socket.leave(roomCode)

        if (typeof callback === "function") {
            callback({
                ok: true,
                data: {
                    roomCode,
                },
            })
        }
    })

    socket.on("room:set-ready", async (payload, callback) => {
        try {
            const { roomCode, playerId, isReady } = payload

            await updateReady({
                roomCode,
                playerId,
                isReady,
            })

            const roomState = await getRoomState({ roomCode })

            io.to(roomCode).emit("room:state", roomState)

            if (typeof callback === "function") {
                callback({
                    ok: true,
                    data: roomState,
                })
            }
        } catch (error) {
            if (typeof callback === "function") {
                callback({
                    ok: false,
                    error: {
                        message: error.message,
                    },
                })
            }
        }
    })

    socket.on("room:start", async (payload, callback) => {
        try {
            const { roomCode, playerId } = payload

            await startGame({
                roomCode,
                playerId,
            })

            const roomState = await getRoomState({ roomCode })

            io.to(roomCode).emit("room:game-started", roomState)
            io.to(roomCode).emit("room:state", roomState)

            if (typeof callback === "function") {
                callback({
                    ok: true,
                    data: roomState,
                })
            }
        } catch (error) {
            if (typeof callback === "function") {
                callback({
                    ok: false,
                    error: {
                        message: error.message,
                    },
                })
            }
        }
    })
}

export { registerRoomHandlers }
