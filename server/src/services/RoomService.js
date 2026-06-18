import pool from "../db/index.js"
import { createInitialState } from "../game/InitialState.js"

function createServiceError(message, statusCode = 400){
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function generateRoomCode(){
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

async function createRoom({ hostPlayerId }){
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const roomCode = generateRoomCode()
    const roomResult = await client.query(
      `INSERT INTO game_rooms (room_code, host_player_id, status)
       VALUES ($1, $2, 'waiting')
       RETURNING *`,
      [roomCode, hostPlayerId]
    )

    const room = roomResult.rows[0]

    await client.query(
      `INSERT INTO game_room_players
       (room_id, player_id, role, seat_order, is_ready)
       VALUES ($1, $2, 'host', 1, true)`,
      [room.id, hostPlayerId]
    )

    await client.query("COMMIT")
    return { room }
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

async function joinRoom({ roomCode, playerId }){
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const roomResult = await client.query(
      `SELECT * FROM game_rooms WHERE room_code = $1 FOR UPDATE`,
      [roomCode]
    )

    if (roomResult.rows.length === 0){
      throw createServiceError("加入房間失敗", 404)
    }

    const room = roomResult.rows[0]

    if (room.status !== "waiting"){
      throw createServiceError("該房間遊戲中，無法加入房間")
    }

    const countResult = await client.query(
      `SELECT COUNT(*) FROM game_room_players WHERE room_id = $1`,
      [room.id]
    )

    const playerCount = Number(countResult.rows[0].count)

    if (playerCount >= 4){
      throw createServiceError("房間人數已滿")
    }

    await client.query(
      `INSERT INTO game_room_players
       (room_id, player_id, role, seat_order, is_ready)
       VALUES ($1, $2, 'player', $3, false)
       RETURNING *`,
      [room.id, playerId, playerCount + 1]
    )

    await client.query("COMMIT")
  } catch (error){
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

async function updateReady({ roomCode, playerId, isReady }) {
  const roomResult = await pool.query(
    `SELECT * FROM game_rooms WHERE room_code = $1`,
    [roomCode]
  )

  if (roomResult.rows.length === 0){
    throw createServiceError("查無此房間", 404)
  }

  const room = roomResult.rows[0]

  const result = await pool.query(
    `UPDATE game_room_players
     SET is_ready = $1
     WHERE room_id = $2 AND player_id = $3
     RETURNING *`,
    [isReady, room.id, playerId]
  )

  if (result.rows.length === 0){
    throw createServiceError("玩家不在該房間中，無法變更狀態", 404)
  }
}

async function startGame({ roomCode, playerId }){
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const roomResult = await client.query(
      `SELECT * FROM game_rooms WHERE room_code = $1 FOR UPDATE`,
      [roomCode]
    )

    if (roomResult.rows.length === 0){
      throw createServiceError("查無此房間", 404)
    }

    const room = roomResult.rows[0]

    if (room.host_player_id !== Number(playerId)){
      throw createServiceError("該玩家不是房主，無法開始遊戲", 403)
    }

    if (room.status !== "waiting"){
      throw createServiceError("遊戲已開始")
    }

    const playerResult = await client.query(
      `SELECT grp.player_id, grp.seat_order, grp.is_ready, p.username
       FROM game_room_players grp
       JOIN players p ON p.id = grp.player_id
       WHERE grp.room_id = $1
       ORDER BY grp.seat_order ASC`,
      [room.id]
    )

    const players = playerResult.rows

    if (players.length !== 4){
      throw createServiceError("玩家人數不足4位")
    }

    const allReady = players.every((player)=>{
      return player.is_ready
    })

    if (!allReady){
      throw createServiceError("仍有玩家狀態處於準備中")
    }

    const matchResult = await client.query(
      `INSERT INTO matches (room_id)
       VALUES ($1)
       RETURNING *`,
      [room.id]
    )

    const match = matchResult.rows[0]
    const state = createInitialState(players)

    await client.query(
      `INSERT INTO game_sessions
       (room_id, match_id, status, current_turn_player_id, state_json)
       VALUES ($1, $2, 'playing', $3, $4)
       RETURNING *`,
      [room.id, match.id, state.currentTurnPlayerId, state]
    )

    await client.query(
      `UPDATE game_rooms
       SET status = 'playing'
       WHERE id = $1`,
      [room.id]
    )

    await client.query("COMMIT")
  } catch (error){
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export {
  createRoom,
  joinRoom,
  updateReady,
  startGame,
}
