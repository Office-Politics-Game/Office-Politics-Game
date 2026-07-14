import { verifyToken } from "../services/authService.js"

const chatOperationQueues = new WeakMap()

function getChatPlayerRoom(playerId) {
  return `chat:player:${playerId}`
}

function sendAcknowledgement(callback, payload) {
  if (typeof callback === "function") {
    callback(payload)
  }
}

function beginChatOperation(socket) {
  const generation = (socket.data.chatOperationGeneration ?? 0) + 1
  socket.data.chatOperationGeneration = generation
  return generation
}

function isCurrentChatOperation(socket, generation) {
  return socket.data.chatOperationGeneration === generation
}

function enqueueChatOperation(socket, operation) {
  const previousOperation = chatOperationQueues.get(socket) ?? Promise.resolve()
  const currentOperation = previousOperation.catch(() => {}).then(operation)

  chatOperationQueues.set(socket, currentOperation)

  return currentOperation.finally(() => {
    if (chatOperationQueues.get(socket) === currentOperation) {
      chatOperationQueues.delete(socket)
    }
  })
}

function sendCancelledSubscription(callback) {
  sendAcknowledgement(callback, {
    ok: false,
    error: { message: "聊天訂閱已取消" },
  })
}

function registerChatHandlers(socket) {
  socket.on("chat:subscribe", (payload = {}, callback) => {
    const generation = beginChatOperation(socket)

    return enqueueChatOperation(socket, async () => {
      try {
        const player = await verifyToken(payload.token)

        if (!isCurrentChatOperation(socket, generation)) {
          sendCancelledSubscription(callback)
          return
        }

        const playerId = Number(player?.id)

        if (!Number.isInteger(playerId) || playerId <= 0) {
          throw new Error("找不到玩家資料")
        }

        const previousPlayerId = socket.data.chatPlayerId

        if (previousPlayerId && previousPlayerId !== playerId) {
          await socket.leave(getChatPlayerRoom(previousPlayerId))
        }

        if (!isCurrentChatOperation(socket, generation)) {
          sendCancelledSubscription(callback)
          return
        }

        const playerRoom = getChatPlayerRoom(playerId)
        await socket.join(playerRoom)

        if (!isCurrentChatOperation(socket, generation)) {
          await socket.leave(playerRoom)
          sendCancelledSubscription(callback)
          return
        }

        socket.data.chatPlayerId = playerId

        sendAcknowledgement(callback, {
          ok: true,
          data: { playerId },
        })
      } catch (error) {
        if (!isCurrentChatOperation(socket, generation)) {
          sendCancelledSubscription(callback)
          return
        }

        sendAcknowledgement(callback, {
          ok: false,
          error: {
            message: error.message || "聊天訂閱失敗",
          },
        })
      }
    })
  })

  socket.on("chat:unsubscribe", (_payload = {}, callback) => {
    beginChatOperation(socket)

    return enqueueChatOperation(socket, async () => {
      const playerId = socket.data.chatPlayerId ?? null

      try {
        if (playerId) {
          await socket.leave(getChatPlayerRoom(playerId))
          delete socket.data.chatPlayerId
        }

        sendAcknowledgement(callback, {
          ok: true,
          data: { playerId },
        })
      } catch (error) {
        sendAcknowledgement(callback, {
          ok: false,
          error: {
            message: error.message || "取消聊天訂閱失敗",
          },
        })
      }
    })
  })
}

export { getChatPlayerRoom, registerChatHandlers }
