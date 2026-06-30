import { getState } from "../services/gameStateService.js"
import { drawCardAction, playCardAction } from "../services/gameActionService.js"

async function emitGameStateToPlayers(io, roomCode, state) {
    const players = Array.isArray(state.players) ? state.players : []

    await Promise.all(players.map(async (player) => {
        const gameState = await getState({
            roomCode,
            viewerPlayerId: Number(player.playerId),
        })

        io.to(`game:${roomCode}:player:${player.playerId}`).emit("game:state", gameState)
    }))
}

function registerGameHandlers(io, socket) {
    socket.on("game:subscribe", async (payload, callback) => {
        try {
            const { roomCode, playerId } = payload

            await getState({
                roomCode,
                viewerPlayerId: Number(playerId),
            })

            socket.join(`game:${roomCode}`)
            socket.join(`game:${roomCode}:player:${playerId}`)

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

    socket.on("game:draw-card", async (payload, callback) => {
        try {
            const { roomCode, playerId } = payload

            const result = await drawCardAction({
                roomCode,
                playerId: Number(playerId),
            })

            const gameState = await getState({
                roomCode,
                viewerPlayerId: Number(playerId),
            })

            await emitGameStateToPlayers(io, roomCode, result.state)

            if (typeof callback === "function") {
                callback({
                    ok: true,
                    data: {
                        drawnCard: result.drawnCard,
                        state: gameState,
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

    socket.on("game:play-card", async (payload, callback) => {
        try {
            const {
                roomCode,
                playerId,
                cardId,
                targetPlayerId,
                guessedCardName,
            } = payload

            const result = await playCardAction({
                roomCode,
                playerId: Number(playerId),
                cardId,
                targetPlayerId,
                guessedCardName,
            })

            const gameState = await getState({
                roomCode,
                viewerPlayerId: Number(playerId),
            })

            await emitGameStateToPlayers(io, roomCode, result.state)

            if (typeof callback === "function") {
                callback({
                    ok: true,
                    data: {
                        result: result.result,
                        animationResult: result.animationResult,
                        discardedCard: result.discardedCard,
                        actionLog: result.actionLog,
                        state: gameState,
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
}

export { registerGameHandlers }
