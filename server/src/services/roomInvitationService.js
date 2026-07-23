import pool from "../db/index.js"

const ROOM_INVITATION_EXPIRES_MINUTES = 10

function createServiceError(message, statusCode = 400){
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function mapRoomInvitation(row){
  return {
    id: row.id,
    roomId: row.room_id,
    roomCode: row.room_code,
    inviterPlayerId: row.inviter_player_id,
    inviteePlayerId: row.invitee_player_id,
    status: row.status,
    expiresAt: row.expires_at,
    respondedAt: row.responded_at,
    createdAt: row.created_at,
    room: row.room_code
      ? {
        roomCode: row.room_code,
        status: row.room_status,
        playerCount: Number(row.player_count ?? 0),
      }
      : null,
    inviter: row.inviter_id
      ? {
        playerId: row.inviter_id,
        username: row.inviter_username,
        avatarId: row.inviter_avatar_id,
        level: row.inviter_level,
        isOnline: row.inviter_is_online,
      }
      : null,
  }
}

function getPlayerCount(row){
  return Number(row?.player_count ?? 0)
}

async function sendRoomInvitation({ roomCode, inviterPlayerId, inviteePlayerId }){
  if (inviterPlayerId === inviteePlayerId){
    throw createServiceError("不能邀請自己加入房間")
  }

  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const roomResult = await client.query(
      `SELECT id, room_code, host_player_id, status
       FROM game_rooms
       WHERE room_code = $1
       FOR UPDATE`,
      [roomCode]
    )

    if (roomResult.rows.length === 0){
      throw createServiceError("查無此房間", 404)
    }

    const room = roomResult.rows[0]

    if (Number(room.host_player_id) !== Number(inviterPlayerId)){
      throw createServiceError("只有房主可以邀請好友", 403)
    }

    if (room.status !== "waiting"){
      throw createServiceError("房間已開始，無法邀請好友", 409)
    }

    await client.query(
      `UPDATE room_invitations
       SET status = 'expired',
           responded_at = CURRENT_TIMESTAMP
       WHERE room_id = $1
         AND invitee_player_id = $2
         AND status = 'pending'
         AND expires_at <= CURRENT_TIMESTAMP`,
      [room.id, inviteePlayerId]
    )

    const roomPlayerResult = await client.query(
      `SELECT
         COUNT(*)::integer AS player_count,
         COALESCE(BOOL_OR(player_id = $2), false) AS invitee_in_room
       FROM game_room_players
       WHERE room_id = $1`,
      [room.id, inviteePlayerId]
    )
    const roomPlayerSummary = roomPlayerResult.rows[0] ?? {}

    if (getPlayerCount(roomPlayerSummary) >= 4){
      throw createServiceError("房間人數已滿", 409)
    }

    if (roomPlayerSummary.invitee_in_room){
      throw createServiceError("玩家已在房間內", 409)
    }

    const friendshipResult = await client.query(
      `SELECT id
       FROM friends
       WHERE status = 'accepted'
         AND LEAST(player_id, friend_id) = LEAST($1::integer, $2::integer)
         AND GREATEST(player_id, friend_id) = GREATEST($1::integer, $2::integer)`,
      [inviterPlayerId, inviteePlayerId]
    )

    if (friendshipResult.rows.length === 0){
      throw createServiceError("只能邀請好友加入房間", 403)
    }

    const existingInvitationResult = await client.query(
      `SELECT id
       FROM room_invitations
       WHERE room_id = $1
         AND invitee_player_id = $2
         AND status = 'pending'
         AND expires_at > CURRENT_TIMESTAMP`,
      [room.id, inviteePlayerId]
    )

    if (existingInvitationResult.rows.length > 0){
      throw createServiceError("已邀請此玩家加入房間", 409)
    }

    const invitationResult = await client.query(
      `INSERT INTO room_invitations
       (room_id, inviter_player_id, invitee_player_id, status, expires_at)
       VALUES (
         $1,
         $2,
         $3,
         'pending',
         CURRENT_TIMESTAMP + ($4::text || ' minutes')::interval
       )
       RETURNING *`,
      [
        room.id,
        inviterPlayerId,
        inviteePlayerId,
        ROOM_INVITATION_EXPIRES_MINUTES,
      ]
    )

    await client.query("COMMIT")

    return mapRoomInvitation({
      ...invitationResult.rows[0],
      room_code: room.room_code,
      room_status: room.status,
      player_count: getPlayerCount(roomPlayerSummary),
    })
  } catch (error){
    await client.query("ROLLBACK")

    if (error.code === "23505"){
      throw createServiceError("已邀請此玩家加入房間", 409)
    }

    throw error
  } finally {
    client.release()
  }
}

async function getPendingRoomInvitations({ playerId }){
  const result = await pool.query(
    `SELECT
       ri.id,
       ri.room_id,
       ri.inviter_player_id,
       ri.invitee_player_id,
       ri.status,
       ri.expires_at,
       ri.responded_at,
       ri.created_at,
       gr.room_code,
       gr.status AS room_status,
       inviter.id AS inviter_id,
       inviter.username AS inviter_username,
       inviter.avatar_id AS inviter_avatar_id,
       inviter.level AS inviter_level,
       inviter.is_online AS inviter_is_online,
       (
         SELECT COUNT(*)::integer
         FROM game_room_players grp
         WHERE grp.room_id = ri.room_id
       ) AS player_count
     FROM room_invitations ri
     JOIN game_rooms gr ON gr.id = ri.room_id
     JOIN players inviter ON inviter.id = ri.inviter_player_id
     JOIN game_room_players host_member
       ON host_member.room_id = gr.id
      AND host_member.player_id = gr.host_player_id
      AND host_member.role = 'host'
      AND host_member.is_computer = false
     WHERE ri.invitee_player_id = $1
       AND ri.status = 'pending'
       AND ri.expires_at > CURRENT_TIMESTAMP
       AND gr.status = 'waiting'
       AND (
         SELECT COUNT(*)
         FROM game_room_players room_member
         WHERE room_member.room_id = gr.id
       ) < 4
     ORDER BY ri.created_at DESC`,
    [playerId]
  )

  return result.rows.map(mapRoomInvitation)
}

async function acceptRoomInvitation({ invitationId, playerId }){
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const invitationResult = await client.query(
      `SELECT
         ri.*,
         gr.room_code,
         gr.status AS room_status,
         (ri.expires_at <= CURRENT_TIMESTAMP) AS is_expired
       FROM room_invitations ri
       JOIN game_rooms gr ON gr.id = ri.room_id
       WHERE ri.id = $1
         AND ri.invitee_player_id = $2
       FOR UPDATE`,
      [invitationId, playerId]
    )

    if (invitationResult.rows.length === 0){
      throw createServiceError("找不到可接受的房間邀請", 404)
    }

    const invitation = invitationResult.rows[0]

    if (invitation.status !== "pending"){
      throw createServiceError("房間邀請已處理", 409)
    }

    if (invitation.is_expired){
      throw createServiceError("房間邀請已過期", 410)
    }

    if (invitation.room_status !== "waiting"){
      throw createServiceError("房間已開始，無法加入", 409)
    }

    const roomPlayerResult = await client.query(
      `SELECT
         COUNT(*)::integer AS player_count,
         COALESCE(BOOL_OR(grp.player_id = $2), false) AS player_in_room,
         EXISTS (
           SELECT 1
           FROM game_rooms gr
           JOIN game_room_players host_member
             ON host_member.room_id = gr.id
            AND host_member.player_id = gr.host_player_id
            AND host_member.role = 'host'
            AND host_member.is_computer = false
           WHERE gr.id = $1
             AND gr.status = 'waiting'
         ) AS has_valid_host
       FROM game_room_players grp
       WHERE grp.room_id = $1`,
      [invitation.room_id, playerId]
    )
    const roomPlayerSummary = roomPlayerResult.rows[0] ?? {}
    const playerCount = getPlayerCount(roomPlayerSummary)

    if (!roomPlayerSummary.has_valid_host){
      throw createServiceError("房間沒有有效房主，無法加入", 409)
    }

    if (roomPlayerSummary.player_in_room){
      throw createServiceError("玩家已在房間內", 409)
    }

    if (playerCount >= 4){
      throw createServiceError("房間人數已滿", 409)
    }

    await client.query(
      `INSERT INTO game_room_players
       (room_id, player_id, role, seat_order, is_ready)
       VALUES ($1, $2, 'player', $3, false)`,
      [invitation.room_id, playerId, playerCount + 1]
    )

    const acceptedResult = await client.query(
      `UPDATE room_invitations
       SET status = 'accepted',
           responded_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [invitationId]
    )

    await client.query("COMMIT")

    return {
      invitation: mapRoomInvitation({
        ...acceptedResult.rows[0],
        room_code: invitation.room_code,
        room_status: invitation.room_status,
        player_count: playerCount + 1,
      }),
      room: {
        roomCode: invitation.room_code,
      },
    }
  } catch (error){
    await client.query("ROLLBACK")

    if (error.code === "23505"){
      throw createServiceError("玩家已在房間內", 409)
    }

    throw error
  } finally {
    client.release()
  }
}

async function rejectRoomInvitation({ invitationId, playerId }){
  const result = await pool.query(
    `UPDATE room_invitations
     SET status = 'rejected',
         responded_at = CURRENT_TIMESTAMP
     WHERE id = $1
       AND invitee_player_id = $2
       AND status = 'pending'
       AND expires_at > CURRENT_TIMESTAMP
     RETURNING *`,
    [invitationId, playerId]
  )

  if (result.rows.length === 0){
    throw createServiceError("找不到可拒絕的房間邀請", 404)
  }

  return mapRoomInvitation(result.rows[0])
}

export {
  acceptRoomInvitation,
  getPendingRoomInvitations,
  rejectRoomInvitation,
  sendRoomInvitation,
}
