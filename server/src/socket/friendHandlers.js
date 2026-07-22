import { verifyToken } from "../services/authService.js"
import { AUTH_COOKIE_NAME } from "../constants/auth.js"

const friendOperationQueues = new WeakMap()

function getFriendPlayerRoom(playerId) {
  return `friend:player:${playerId}`
}

function sendAcknowledgement(callback, payload) {
  if (typeof callback === "function") {
    callback(payload)
  }
}

function beginFriendOperation(socket) {
  const generation = (socket.data.friendOperationGeneration ?? 0) + 1
  socket.data.friendOperationGeneration = generation
  return generation
}

function isCurrentFriendOperation(socket, generation) {
  return socket.data.friendOperationGeneration === generation
}

function enqueueFriendOperation(socket, operation) {
  const previousOperation = friendOperationQueues.get(socket) ?? Promise.resolve()
  const currentOperation = previousOperation.catch(() => {}).then(operation)

  friendOperationQueues.set(socket, currentOperation)

  return currentOperation.finally(() => {
    if (friendOperationQueues.get(socket) === currentOperation) {
      friendOperationQueues.delete(socket)
    }
  })
}

function getSocketAuthToken(socket) {
  return socket.request?.cookies?.[AUTH_COOKIE_NAME] || ""
}

function sendCancelledSubscription(callback) {
  sendAcknowledgement(callback, {
    ok: false,
    error: { message: "好友訂閱已取消" },
  })
}

function registerFriendHandlers(socket) {
  socket.on("friend:subscribe", (_payload = {}, callback) => {
    const generation = beginFriendOperation(socket)

    return enqueueFriendOperation(socket, async () => {
      try {
        const player = await verifyToken(getSocketAuthToken(socket))

        if (!isCurrentFriendOperation(socket, generation)) {
          sendCancelledSubscription(callback)
          return
        }

        const playerId = Number(player?.id)

        if (!Number.isInteger(playerId) || playerId <= 0) {
          throw new Error("找不到玩家資料")
        }

        const previousPlayerId = socket.data.friendPlayerId

        if (previousPlayerId && previousPlayerId !== playerId) {
          await socket.leave(getFriendPlayerRoom(previousPlayerId))
        }

        if (!isCurrentFriendOperation(socket, generation)) {
          sendCancelledSubscription(callback)
          return
        }

        const playerRoom = getFriendPlayerRoom(playerId)
        await socket.join(playerRoom)

        if (!isCurrentFriendOperation(socket, generation)) {
          await socket.leave(playerRoom)
          sendCancelledSubscription(callback)
          return
        }

        socket.data.friendPlayerId = playerId

        sendAcknowledgement(callback, {
          ok: true,
          data: { playerId },
        })
      } catch (error) {
        if (!isCurrentFriendOperation(socket, generation)) {
          sendCancelledSubscription(callback)
          return
        }

        sendAcknowledgement(callback, {
          ok: false,
          error: {
            message: error.message || "好友訂閱失敗",
          },
        })
      }
    })
  })

  socket.on("friend:unsubscribe", (_payload = {}, callback) => {
    beginFriendOperation(socket)

    return enqueueFriendOperation(socket, async () => {
      const playerId = socket.data.friendPlayerId ?? null

      try {
        if (playerId) {
          await socket.leave(getFriendPlayerRoom(playerId))
          delete socket.data.friendPlayerId
        }

        sendAcknowledgement(callback, {
          ok: true,
          data: { playerId },
        })
      } catch (error) {
        sendAcknowledgement(callback, {
          ok: false,
          error: {
            message: error.message || "取消好友訂閱失敗",
          },
        })
      }
    })
  })
}

export { getFriendPlayerRoom, registerFriendHandlers }
