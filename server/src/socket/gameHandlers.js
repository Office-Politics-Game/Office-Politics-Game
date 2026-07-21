import { getState, getPublicState } from "../services/gameStateService.js"
import { drawCardAction, playCardAction } from "../services/gameActionService.js"
import { runAutomatedTurn, runComputerTurn } from "../services/computerPlayerService.js"
import { createCardEffectAnimationResultForViewer } from "../services/cardEffectAnimationService.js"

const activeComputerTurnRooms = new Set()
const skippingComputerFinishRooms = new Set()

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
    const payload = createGameActionPayload(roomCode, action)
    target.emit("game:action", payload)
    return payload
}

function getPlayerId(player) {
    return Number(player?.playerId ?? player?.id)
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
            animationResult: createCardEffectAnimationResultForViewer(
                action.animationResult,
                viewerPlayerId,
                action.playerId,
            ),
        })
    })
}

async function emitGameStateAfterActionToPlayers(
    io,
    roomCode,
    state,
    actionId,
    { readyForComputerTurn = true } = {}
) {
    const players = Array.isArray(state.players) ? state.players : []

    await Promise.all(players.map(async (player) => {
        const gameState = {
            status: state.phase,
            currentTurnPlayerId: state.currentTurnPlayerId,
            afterActionId: actionId,
            readyForComputerTurn,
            state: getPublicState(state, Number(player.playerId)),
        }

        io.to(`game:${roomCode}:player:${player.playerId}`).emit("game:state", gameState)
    }))
}

function emitDrawCardActionToPlayers(io, roomCode, state, action, drawnCard = null) {
    const actionPayload = createGameActionPayload(roomCode, action)
    const playerRoom = `game:${roomCode}:player:${action.playerId}`

    io.to(playerRoom).emit("game:action", {
        ...actionPayload,
        drawnCard,
    })
    io.to(`game:${roomCode}`).except(playerRoom).emit("game:action", actionPayload)

    return actionPayload
}

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

async function waitForActiveComputerTurn(roomCode) {
    for (let attempts = 0; attempts < 40 && activeComputerTurnRooms.has(roomCode); attempts += 1) {
        await wait(50)
    }
}

function getActionDetail(actionLog) {
    if (!actionLog?.action_detail) {
        return {}
    }

    try {
        return JSON.parse(actionLog.action_detail)
    } catch {
        return {}
    }
}

async function emitComputerTurnResult(io, roomCode, result) {
    if (!result?.didRun || skippingComputerFinishRooms.has(roomCode)) {
        return
    }

    if (result.drawResult) {
        const drawAction = emitDrawCardActionToPlayers(io, roomCode, result.drawResult.state, {
            type: "draw-card",
            playerId: Number(result.playerId),
        })

        await emitGameStateAfterActionToPlayers(
            io,
            roomCode,
            result.drawResult.state,
            drawAction.id,
            { readyForComputerTurn: false }
        )
    }

    if (result.playResult) {
        const actionDetail = getActionDetail(result.playResult.actionLog)
        const playActionId = result.playResult.actionLog?.id
            ? `play-card:${result.playResult.actionLog.id}`
            : createActionId("play-card")
        const playAction = {
            id: playActionId,
            type: "play-card",
            playerId: Number(result.playerId),
            targetPlayerId: actionDetail.targetPlayerId
                ? Number(actionDetail.targetPlayerId)
                : null,
            discardedCard: result.playResult.discardedCard,
            animationResult: result.playResult.animationResult,
            showdownResult: result.playResult.showdownResult,
        }

        emitPlayCardActionToPlayers(io, roomCode, result.playResult.state, playAction)

        await emitGameStateAfterActionToPlayers(
            io,
            roomCode,
            result.playResult.state,
            playActionId,
            { readyForComputerTurn: true }
        )
    }
}

function canSimulateComputerFinish(state, viewerPlayerId) {
    const players = Array.isArray(state?.players) ? state.players : []
    const humans = players.filter((player) => !player.isComputer)
    const computers = players.filter((player) => player.isComputer)
    const viewer = players.find((player) => {
        return Number(player.playerId) === Number(viewerPlayerId)
    })

    return (
        state?.phase === "playing" &&
        humans.length === 1 &&
        computers.length === 3 &&
        Boolean(viewer?.isEliminated)
    )
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

            const drawAction = emitDrawCardActionToPlayers(io, roomCode, result.state, {
                type: "draw-card",
                playerId: Number(playerId),
            }, result.drawnCard)

            await emitGameStateAfterActionToPlayers(
                io,
                roomCode,
                result.state,
                drawAction.id,
                { readyForComputerTurn: false }
            )

            if (typeof callback === "function") {
                callback({
                    ok: true,
                        data: {
                            drawnCard: result.drawnCard,
                            state: gameState.state,
                            afterActionId: drawAction.id,
                            readyForComputerTurn: false,
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

            const playActionId = result.actionLog?.id
                ? `play-card:${result.actionLog.id}`
                : createActionId("play-card")
            const playAction = {
                id: playActionId,
                type: "play-card",
                playerId: Number(playerId),
                targetPlayerId: targetPlayerId ? Number(targetPlayerId) : null,
                discardedCard: result.discardedCard,
                animationResult: result.animationResult,
                showdownResult: result.showdownResult,
            }

            emitPlayCardActionToPlayers(io, roomCode, result.state, playAction)

            await emitGameStateAfterActionToPlayers(
                io,
                roomCode,
                result.state,
                playActionId,
                { readyForComputerTurn: true }
            )

            if (typeof callback === "function") {
                callback({
                    ok: true,
                    data: {
                        result: result.result,
                        animationResult: createCardEffectAnimationResultForViewer(
                            result.animationResult,
                            playerId,
                            playerId,
                        ),
                        showdownResult: result.showdownResult,
                        discardedCard: result.discardedCard,
                        actionLog: result.actionLog,
                        state: gameState.state,
                        afterActionId: playActionId,
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

    socket.on("game:ready-for-computer-turn", async (payload, callback) => {
        const roomCode = payload?.roomCode

        try {
            const { playerId, reason } = payload

            if (!["action-complete", "round-start"].includes(reason)) {
                throw new Error("Invalid computer turn readiness reason")
            }

            await getState({
                roomCode,
                viewerPlayerId: Number(playerId),
            })

            if (activeComputerTurnRooms.has(roomCode)) {
                if (typeof callback === "function") {
                    callback({
                        ok: true,
                        data: {
                            roomCode,
                            skipped: true,
                            reason: "active",
                        },
                    })
                }
                return
            }

            activeComputerTurnRooms.add(roomCode)

            try {
                const result = await runComputerTurn({ roomCode })
                await emitComputerTurnResult(io, roomCode, result)

                if (typeof callback === "function") {
                    callback({
                        ok: true,
                        data: {
                            roomCode,
                            didRun: Boolean(result?.didRun),
                        },
                    })
                }
            } finally {
                activeComputerTurnRooms.delete(roomCode)
            }
        } catch (error) {
            activeComputerTurnRooms.delete(roomCode)

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

    socket.on("game:auto-play-timeout", async (payload, callback) => {
        const roomCode = payload?.roomCode

        try {
            const { playerId, turnPlayerId } = payload

            await getState({
                roomCode,
                viewerPlayerId: Number(playerId),
            })

            if (activeComputerTurnRooms.has(roomCode)) {
                if (typeof callback === "function") {
                    callback({ ok: true, data: { roomCode, skipped: true } })
                }
                return
            }

            activeComputerTurnRooms.add(roomCode)

            try {
                const result = await runAutomatedTurn({
                    roomCode,
                    playerId: Number(turnPlayerId),
                })
                await emitComputerTurnResult(io, roomCode, result)

                if (typeof callback === "function") {
                    callback({
                        ok: true,
                        data: {
                            roomCode,
                            didRun: Boolean(result?.didRun),
                        },
                    })
                }
            } finally {
                activeComputerTurnRooms.delete(roomCode)
            }
        } catch (error) {
            activeComputerTurnRooms.delete(roomCode)

            if (typeof callback === "function") {
                callback({
                    ok: false,
                    error: { message: error.message },
                })
            }
        }
    })

    socket.on("game:simulate-computer-finish", async (payload, callback) => {
        const roomCode = payload?.roomCode

        try {
            const { playerId } = payload
            skippingComputerFinishRooms.add(roomCode)
            await waitForActiveComputerTurn(roomCode)
            activeComputerTurnRooms.add(roomCode)

            const currentState = await getState({
                roomCode,
                viewerPlayerId: Number(playerId),
            })

            if (!canSimulateComputerFinish(currentState.state, playerId)) {
                throw new Error("Only eliminated players in a one-human computer room can skip ahead")
            }

            const startRoundNumber = Number(currentState.state.roundNumber || 1)
            let result = { state: currentState.state }
            let roundEndState = null

            for (let turns = 0; turns < 80 && result.state?.phase === "playing"; turns += 1) {
                result = await runAutomatedTurn({ roomCode })
                roundEndState = result.roundEndState ?? result.playResult?.roundEndState ?? roundEndState

                if (
                    !result.didRun ||
                    (!result.playResult && result.reason !== "advanced-eliminated-turn") ||
                    Number(result.state?.roundNumber || 1) !== startRoundNumber
                ) {
                    break
                }
            }

            if (typeof callback === "function") {
                callback({
                    ok: true,
                    data: {
                        roomCode,
                        roundWinnerPlayerId: roundEndState?.roundWinnerPlayerId ?? null,
                        settlementState: roundEndState
                            ? getPublicState(roundEndState, Number(playerId))
                            : null,
                        state: getPublicState(result.state, Number(playerId)),
                    },
                })
            }
        } catch (error) {
            if (typeof callback === "function") {
                callback({
                    ok: false,
                    error: { message: error.message },
                })
            }
        } finally {
            activeComputerTurnRooms.delete(roomCode)
            skippingComputerFinishRooms.delete(roomCode)
        }
    })
}

export { registerGameHandlers }
