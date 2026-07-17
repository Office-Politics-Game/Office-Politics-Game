import {
    addComputerPlayer,
    getRoomState,
    joinRoom,
    kickPlayer,
    updateReady,
    startGame,
} from "../services/roomService.js"

function normalizeRoomCode(roomCode) {
    return typeof roomCode === "string" ? roomCode.trim().toUpperCase() : roomCode
}

function emitRoomState(io, eventName, roomState) {
    io.emit(eventName, roomState)
}

function registerRoomHandlers(io, socket) {
    socket.on("room:subscribe", async (payload, callback) => {
        try {
            const { roomCode, playerId } = payload
            const normalizedRoomCode = normalizeRoomCode(roomCode)

            console.log("room:subscribe", normalizedRoomCode, playerId)

            socket.join(normalizedRoomCode)

            const roomState = await getRoomState({ roomCode: normalizedRoomCode })

            emitRoomState(io, "room:state", roomState)

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
        const normalizedRoomCode = normalizeRoomCode(roomCode)

        socket.leave(normalizedRoomCode)

        if (typeof callback === "function") {
            callback({
                ok: true,
                data: {
                    roomCode: normalizedRoomCode,
                },
            })
        }
    })

    socket.on("room:join", async (payload, callback) => {
        try {
            const { roomCode, playerId } = payload
            const normalizedRoomCode = normalizeRoomCode(roomCode)

            await joinRoom({
                roomCode: normalizedRoomCode,
                playerId,
            })

            socket.join(normalizedRoomCode)

            const roomState = await getRoomState({ roomCode: normalizedRoomCode })

            emitRoomState(io, "room:state", roomState)

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

    socket.on("room:set-ready", async (payload, callback) => {
        try {
            const { roomCode, playerId, isReady } = payload
            const normalizedRoomCode = normalizeRoomCode(roomCode)

            await updateReady({
                roomCode: normalizedRoomCode,
                playerId,
                isReady,
            })

            const roomState = await getRoomState({ roomCode: normalizedRoomCode })

            emitRoomState(io, "room:state", roomState)

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

    socket.on("room:add-computer", async (payload, callback) => {
        try {
            const { roomCode, hostPlayerId, username } = payload
            const normalizedRoomCode = normalizeRoomCode(roomCode)

            const roomState = await addComputerPlayer({
                roomCode: normalizedRoomCode,
                hostPlayerId,
                username,
            })

            emitRoomState(io, "room:state", roomState)

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

    socket.on("room:remove-player", async (payload, callback) => {
        try {
            const { roomCode, requesterPlayerId, targetPlayerId } = payload
            const normalizedRoomCode = normalizeRoomCode(roomCode)

            const roomState = await kickPlayer({
                roomCode: normalizedRoomCode,
                requesterPlayerId,
                targetPlayerId,
            })

            emitRoomState(io, "room:state", roomState)

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
            const normalizedRoomCode = normalizeRoomCode(roomCode)

            await startGame({
                roomCode: normalizedRoomCode,
                playerId,
            })

            const roomState = await getRoomState({ roomCode: normalizedRoomCode })

            emitRoomState(io, "room:game-started", roomState)
            emitRoomState(io, "room:state", roomState)

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
