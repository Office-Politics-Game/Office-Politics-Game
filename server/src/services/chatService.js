import pool from "../db/index.js"

function createServiceError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function toPositiveInteger(value) {
  const numberValue = Number(value)

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null
  }

  return numberValue
}

function normalizeMessageContent(content) {
  return String(content ?? "").trim()
}

function mapDirectMessage(row) {
  return {
    id: row.id,
    senderPlayerId: row.sender_player_id,
    receiverPlayerId: row.receiver_player_id,
    content: row.content,
    createdAt: row.created_at,
  }
}

async function ensurePlayersExist(playerId, friendId) {
  const result = await pool.query(
    `SELECT id
     FROM players
     WHERE id IN ($1, $2)`,
    [playerId, friendId],
  )

  if (result.rows.length !== 2) {
    throw createServiceError("找不到玩家資料", 404)
  }
}

async function findFriendship(playerId, friendId) {
  const result = await pool.query(
    `SELECT id, status
     FROM friends
     WHERE LEAST(player_id, friend_id) = LEAST($1::integer, $2::integer)
       AND GREATEST(player_id, friend_id) = GREATEST($1::integer, $2::integer)
     LIMIT 1`,
    [playerId, friendId],
  )

  return result.rows[0] ?? null
}

async function ensureDirectChatAllowed(
  playerId,
  friendId,
  {
    nonFriendMessage = "只能和好友傳送訊息",
    blockedMessage = "無法傳送訊息給此玩家",
  } = {},
) {
  if (playerId === friendId) {
    throw createServiceError("不能傳送訊息給自己")
  }

  await ensurePlayersExist(playerId, friendId)

  const friendship = await findFriendship(playerId, friendId)

  if (friendship?.status === "blocked") {
    throw createServiceError(blockedMessage, 403)
  }

  if (friendship?.status !== "accepted") {
    throw createServiceError(nonFriendMessage, 403)
  }
}

async function sendDirectMessage({ playerId, friendId, content }) {
  const numericPlayerId = toPositiveInteger(playerId)
  const numericFriendId = toPositiveInteger(friendId)

  if (!numericPlayerId || !numericFriendId) {
    throw createServiceError("缺少玩家ID或聊天對象ID")
  }

  const normalizedContent = normalizeMessageContent(content)

  if (!normalizedContent) {
    throw createServiceError("訊息內容不可為空")
  }

  await ensureDirectChatAllowed(numericPlayerId, numericFriendId)

  const result = await pool.query(
    `INSERT INTO direct_messages (sender_player_id, receiver_player_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, sender_player_id, receiver_player_id, content, created_at`,
    [numericPlayerId, numericFriendId, normalizedContent],
  )

  return mapDirectMessage(result.rows[0])
}

async function getDirectMessages({ playerId, friendId }) {
  const numericPlayerId = toPositiveInteger(playerId)
  const numericFriendId = toPositiveInteger(friendId)

  if (!numericPlayerId || !numericFriendId) {
    throw createServiceError("缺少玩家ID或聊天對象ID")
  }

  await ensureDirectChatAllowed(numericPlayerId, numericFriendId, {
    nonFriendMessage: "只能讀取好友聊天紀錄",
    blockedMessage: "無法讀取此聊天紀錄",
  })

  const result = await pool.query(
    `SELECT id, sender_player_id, receiver_player_id, content, created_at
     FROM direct_messages
     WHERE (
       sender_player_id = $1
       AND receiver_player_id = $2
     )
       OR (
         sender_player_id = $2
         AND receiver_player_id = $1
       )
     ORDER BY created_at ASC, id ASC`,
    [numericPlayerId, numericFriendId],
  )

  return result.rows.map(mapDirectMessage)
}

export {
  getDirectMessages,
  sendDirectMessage,
}
