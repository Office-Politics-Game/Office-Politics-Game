import { getState } from "../services/gameStateService.js"

function registerGameHandlers(io, socket) {
    socket.on("game:subscribe", async (payload, callback) => {
        try {
            const { roomCode, playerId } = payload

            socket.join(`game:${roomCode}`)

            if (typeof callback === "function") {
                callback({
                    ok: true,
                    data: {
                        roomCode,
                        playerId,
                    },
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
    socket.on("game:request-state", async (payload, callback) => {
        try {
            const { roomCode, playerId } = payload

            const gameState = await getState({
                roomCode,
                viewerPlayerId: Number(playerId),
            })

            if (typeof callback === "function") {
                callback({
                    ok: true,
                    data: gameState,
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

export { registerGameHandlers }