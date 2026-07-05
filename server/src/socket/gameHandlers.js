import { getState } from "../services/gameStateService.js"
import { drawCardAction, playCardAction } from "../services/gameActionService.js"

function createActionId(type) {
    return `${type}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`
}

function createGameActionPayload(roomCode, action) {
    return {
        ...action,
        id: action.id ?? createActionId(action.type),
        roomCode,
        createdAt: action.createdAt ?? new Date().toISOString(),
    }
}

function emitGameAction(target, roomCode, action) {
    target.emit("game:action", createGameActionPayload(roomCode, action))
}

function getPlayerId(player) {
    return Number(player?.playerId ?? player?.id)
}

function createAnimationResultForViewer(animationResult, viewerPlayerId, sourcePlayerId) {
    if (animationResult?.type !== "cleaner") {
        return animationResult
    }

    const numericViewerPlayerId = Number(viewerPlayerId)
    const numericSourcePlayerId = Number(sourcePlayerId)

    if (numericViewerPlayerId === numericSourcePlayerId) {
        return {
            ...animationResult,
            viewerPlayerId: numericSourcePlayerId,
            revealCard: true,
        }
    }

    return {
        type: "cleaner",
        targetPlayerId: animationResult.targetPlayerId,
        viewerPlayerId: numericSourcePlayerId,
        revealCard: false,
    }
}

function emitPlayCardActionToPlayers(io, roomCode, state, action) {
    const players = Array.isArray(state?.players) ? state.players : []

    players.forEach((player) => {
        const viewerPlayerId = getPlayerId(player)

        if (!viewerPlayerId) {
            return
        }

        emitGameAction(io.to(`game:${roomCode}:player:${viewerPlayerId}`), roomCode, {
            ...action,
            animationResult: createAnimationResultForViewer(
                action.animationResult,
                viewerPlayerId,
                action.playerId,
            ),
        })
    })
}

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

            const drawAction = createGameActionPayload(roomCode, {
                type: "draw-card",
                playerId: Number(playerId),
            })
            const playerRoom = `game:${roomCode}:player:${playerId}`

            io.to(playerRoom).emit("game:action", {
                ...drawAction,
                drawnCard: result.drawnCard,
            })
            io.to(`game:${roomCode}`).except(playerRoom).emit("game:action", drawAction)

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

            emitPlayCardActionToPlayers(io, roomCode, result.state, {
                id: result.actionLog?.id ? `play-card:${result.actionLog.id}` : undefined,
                type: "play-card",
                playerId: Number(playerId),
                targetPlayerId: targetPlayerId ? Number(targetPlayerId) : null,
                discardedCard: result.discardedCard,
                animationResult: result.animationResult,
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
