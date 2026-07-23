import pool from "../db/index.js"
import {
  appendUnlockedAchievements,
  unlockAchievement,
} from "./achievementService.js"

function createServiceError(message, statusCode = 400){
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function mapFriendship(row){
  return {
    id: row.id,
    playerId: row.player_id,
    friendId: row.friend_id,
    status: row.status,
    createdAt: row.created_at,
  }
}

function mapReceivedRequest(row){
  return {
    id: row.id,
    playerId: row.player_id,
    friendId: row.friend_id,
    status: row.status,
    createdAt: row.created_at,
    requester: {
      playerId: row.requester_id,
      username: row.requester_username,
      avatarId: row.requester_avatar_id,
      level: row.requester_level,
      isOnline: row.requester_is_online,
    },
  }
}

function mapSentRequest(row){
  return {
    id: row.id,
    playerId: row.player_id,
    friendId: row.friend_id,
    status: row.status,
    createdAt: row.created_at,
    receiver: {
      playerId: row.receiver_id,
      username: row.receiver_username,
      avatarId: row.receiver_avatar_id,
      level: row.receiver_level,
      isOnline: row.receiver_is_online,
    },
  }
}

function mapFriend(row){
  return {
    friendshipId: row.friendship_id,
    playerId: row.friend_player_id,
    username: row.username,
    avatarId: row.avatar_id,
    level: row.level,
    isOnline: row.is_online,
    createdAt: row.created_at,
  }
}

function mapBlockedPlayer(row){
  return {
    blockId: row.block_id,
    playerId: row.blocked_player_id,
    username: row.username,
    avatarId: row.avatar_id,
    level: row.level,
    isOnline: row.is_online,
    createdAt: row.created_at,
  }
}

async function ensurePlayersExist(playerId, targetPlayerId){
  const result = await pool.query(
    `SELECT id
     FROM players
     WHERE id IN ($1, $2)`,
    [playerId, targetPlayerId]
  )

  if (result.rows.length !== 2){
    throw createServiceError("找不到玩家資料", 404)
  }
}

async function findExistingFriendship(playerId, targetPlayerId){
  const result = await pool.query(
    `SELECT *
     FROM friends
     WHERE LEAST(player_id, friend_id) = LEAST($1::integer, $2::integer)
       AND GREATEST(player_id, friend_id) = GREATEST($1::integer, $2::integer)`,
    [playerId, targetPlayerId]
  )

  return result.rows[0] ?? null
}

async function sendFriendRequest({ playerId, targetPlayerId }){
  if (playerId === targetPlayerId){
    throw createServiceError("不能邀請自己成為好友")
  }

  await ensurePlayersExist(playerId, targetPlayerId)

  const existingFriendship = await findExistingFriendship(playerId, targetPlayerId)

  if (existingFriendship?.status === "accepted"){
    throw createServiceError("已經是好友", 409)
  }

  if (existingFriendship?.status === "pending"){
    throw createServiceError("好友邀請已存在", 409)
  }

  if (existingFriendship?.status === "blocked"){
    throw createServiceError("無法送出好友邀請", 403)
  }

  let result

  try {
    result = await pool.query(
      `INSERT INTO friends (player_id, friend_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [playerId, targetPlayerId]
    )
  } catch (error){
    if (error.code === "23505"){
      throw createServiceError("好友邀請已存在", 409)
    }

    throw error
  }

  return mapFriendship(result.rows[0])
}

async function removeFriend({ friendshipId, playerId }){
  const result = await pool.query(
    `DELETE FROM friends
     WHERE id = $1
       AND status = 'accepted'
       AND (player_id = $2 OR friend_id = $2)
     RETURNING *`,
    [friendshipId, playerId]
  )

  if (result.rows.length === 0){
    throw createServiceError("找不到可解除的好友關係", 404)
  }

  return mapFriendship(result.rows[0])
}

async function blockPlayer({ playerId, targetPlayerId }){
  if (playerId === targetPlayerId){
    throw createServiceError("不能封鎖自己")
  }

  await ensurePlayersExist(playerId, targetPlayerId)

  const existingFriendship = await findExistingFriendship(playerId, targetPlayerId)

  if (existingFriendship?.status === "blocked"){
    if (
      existingFriendship.player_id === playerId &&
      existingFriendship.friend_id === targetPlayerId
    ){
      throw createServiceError("已封鎖此玩家", 409)
    }

    throw createServiceError("已存在封鎖關係", 403)
  }

  const result = existingFriendship
    ? await pool.query(
      `UPDATE friends
       SET player_id = $1,
           friend_id = $2,
           status = 'blocked'
       WHERE id = $3
       RETURNING *`,
      [playerId, targetPlayerId, existingFriendship.id]
    )
    : await pool.query(
      `INSERT INTO friends (player_id, friend_id, status)
       VALUES ($1, $2, 'blocked')
       RETURNING *`,
      [playerId, targetPlayerId]
    )

  return mapFriendship(result.rows[0])
}

async function getReceivedFriendRequests({ playerId }){
  const result = await pool.query(
    `SELECT
       f.id,
       f.player_id,
       f.friend_id,
       f.status,
       f.created_at,
       p.id AS requester_id,
       p.username AS requester_username,
       p.avatar_id AS requester_avatar_id,
       p.level AS requester_level,
       p.is_online AS requester_is_online
     FROM friends f
     JOIN players p ON p.id = f.player_id
     WHERE f.friend_id = $1
       AND f.status = 'pending'
     ORDER BY f.created_at DESC`,
    [playerId]
  )

  return result.rows.map(mapReceivedRequest)
}

async function getSentFriendRequests({ playerId }){
  const result = await pool.query(
    `SELECT
       f.id,
       f.player_id,
       f.friend_id,
       f.status,
       f.created_at,
       p.id AS receiver_id,
       p.username AS receiver_username,
       p.avatar_id AS receiver_avatar_id,
       p.level AS receiver_level,
       p.is_online AS receiver_is_online
     FROM friends f
     JOIN players p ON p.id = f.friend_id
     WHERE f.player_id = $1
       AND f.status = 'pending'
     ORDER BY f.created_at DESC`,
    [playerId]
  )

  return result.rows.map(mapSentRequest)
}

async function acceptFriendRequest({ requestId, playerId }){
  const result = await pool.query(
    `UPDATE friends
     SET status = 'accepted'
     WHERE id = $1
       AND friend_id = $2
       AND status = 'pending'
     RETURNING *`,
    [requestId, playerId]
  )

  if (result.rows.length === 0){
    throw createServiceError("找不到可接受的好友邀請", 404)
  }

  const friendship = mapFriendship(result.rows[0])
  const unlockedAchievement = await unlockAchievement(playerId, "first_friend")

  return appendUnlockedAchievements(friendship, [unlockedAchievement])
}

async function rejectFriendRequest({ requestId, playerId }){
  const result = await pool.query(
    `DELETE FROM friends
     WHERE id = $1
       AND friend_id = $2
       AND status = 'pending'
     RETURNING *`,
    [requestId, playerId]
  )

  if (result.rows.length === 0){
    throw createServiceError("找不到可拒絕的好友邀請", 404)
  }

  return mapFriendship(result.rows[0])
}

async function getFriends({ playerId }){
  const result = await pool.query(
    `SELECT
       f.id AS friendship_id,
       f.created_at,
       p.id AS friend_player_id,
       p.username,
       p.avatar_id,
       p.level,
       p.is_online
     FROM friends f
     JOIN players p
       ON p.id = CASE
         WHEN f.player_id = $1 THEN f.friend_id
         ELSE f.player_id
       END
     WHERE f.status = 'accepted'
       AND (f.player_id = $1 OR f.friend_id = $1)
     ORDER BY p.is_online DESC, p.username ASC`,
    [playerId]
  )

  return result.rows.map(mapFriend)
}

async function getBlockedPlayers({ playerId }){
  const result = await pool.query(
    `SELECT
       f.id AS block_id,
       f.created_at,
       p.id AS blocked_player_id,
       p.username,
       p.avatar_id,
       p.level,
       p.is_online
     FROM friends f
     JOIN players p ON p.id = f.friend_id
     WHERE f.player_id = $1
       AND f.status = 'blocked'
     ORDER BY f.created_at DESC`,
    [playerId]
  )

  return result.rows.map(mapBlockedPlayer)
}

async function unblockPlayer({ blockId, playerId }){
  const result = await pool.query(
    `DELETE FROM friends
     WHERE id = $1
       AND player_id = $2
       AND status = 'blocked'
     RETURNING *`,
    [blockId, playerId]
  )

  if (result.rows.length === 0){
    throw createServiceError("找不到可取消封鎖的玩家", 404)
  }

  return mapFriendship(result.rows[0])
}

export {
  acceptFriendRequest,
  blockPlayer,
  getBlockedPlayers,
  getFriends,
  getReceivedFriendRequests,
  getSentFriendRequests,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
  unblockPlayer,
}
