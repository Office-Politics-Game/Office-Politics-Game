import express from "express"
import pool from "../db/index.js"
import { createInitialGameState } from "../game/InitialState.js"

const router = express.Router();

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

router.post('/', async (req,res)=>{
  const client = await pool.connect()

  try {
    const { hostPlayerId } = req.body

    if (!hostPlayerId){
      return res.status(400).json({ message: "房主ID不存在" })
    }

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
    res.status(201).json({ room })
  } catch(error) {
    await client.query("ROLLBACK")
    return res.status(500).json({ message: "建立房間失敗" , error: error.message })
  } finally {
    client.release()
  }
})

router.post('/:roomCode/join', async (req,res)=>{
  const { roomCode } = req.params
  const { playerId } = req.body

  if (!playerId){
    return res.status(400).json({ message: "缺少玩家ID" })
  }

  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const roomResult = await client.query(
      `SELECT * FROM game_rooms WHERE room_code = $1 FOR UPDATE`,
      [roomCode]
    )

    if (roomResult.rows.length === 0){
      await client.query("ROLLBACK")
      return res.status(404).json({ message: "加入房間失敗" })
    }

    const room = roomResult.rows[0]

    if (room.status !== 'waiting'){
      await client.query("ROLLBACK")
      return res.status(400).json({ message: "該房間遊戲中，無法加入房間" })
    }

    const countResult = await client.query(
      `SELECT COUNT(*) FROM game_room_players WHERE room_id = $1`,
      [room.id]
    )

    const playerCount = Number(countResult.rows[0].count)

    if (playerCount >=4){
      await client.query("ROLLBACK")
      return res.status(400).json({ message: "房間人數已滿" })
    }

    await client.query(
      `INSERT INTO game_room_players
      (room_id, player_id, role, seat_order, is_ready)
      VALUES ($1, $2, 'player', $3, false)
      RETURNING *`,
      [room.id, playerId, playerCount + 1]
    )

    await client.query("COMMIT")
    res.status(201).json({ message: "成功加入房間" })
  } catch(error) {
    await client.query("ROLLBACK")
    return res.status(500).json({ message: "加入房間失敗" , error: error.message })
  } finally {
    client.release()
  }
})

router.patch('/:roomCode/state', async (req,res)=>{
  try {
    const { roomCode } = req.params
    const { playerId, isReady } =req.body

    if (!playerId || typeof isReady !== 'boolean'){
      return res.status(400).json({ message: "缺少玩家ID或玩家尚未完成準備" })
    }

    const roomResult = await pool.query(
      `SELECT * FROM game_rooms WHERE room_code = $1`,
      [roomCode]
    )

    if (roomResult.rows.length === 0){
      return res.status(404).json({ message: "查無此房間" })
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
      return res.status(404).json({ message: "玩家不在該房間中，無法變更狀態" })
    }

    res.status(200).json({ message : "玩家已完成準備狀態" })
  } catch(error) {
    return res.status(500).json({ message: "玩家準備狀態變更失敗", error: error.message })
  }
})

router.post('/:roomCode/start', async (req,res)=>{
  const client = await pool.connect()

  try {
    const { roomCode } = req.params
    const { playerId } = req.body

    if (!playerId){
      return res.status(400).json({ message: "缺少玩家ID" })
    }

    await client.query("BEGIN")

    const roomResult = await client.query(
      `SELECT * FROM game_rooms WHERE room_code = $1 FOR UPDATE`,
      [roomCode]
    )

    if (roomResult.rows.length === 0){
      await client.query("ROLLBACK")
      return res.status(404).json({ message: "查無此房間" })
    }

    const room = roomResult.rows[0]

    if (room.host_player_id !== Number(playerId)){
      await client.query("ROLLBACK")
      return res.status(403).json({ message: "該玩家不是房主，無法開始遊戲" })
    }

    if (room.status !== 'waiting'){
      await client.query("ROLLBACK")
      return res.status(400).json({ message: "遊戲已開始" })
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
      await client.query("ROLLBACK")
      return res.status(400).json({ message: "玩家人數不足4位" })
    }

    const allReady = players.every((player)=>{
      return player.is_ready
    })

    if (!allReady){
      await client.query("ROLLBACK")
      return res.status(400).json({ message: "仍有玩家狀態處於準備中" })
    }

    const matchResult = await client.query(
      `INSERT INTO matches (room_id)
       VALUES ($1)
       RETURNING *`,
      [room.id]
    )

    const match = matchResult.rows[0]

    const state = createInitialGameState(players)

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
    res.status(201).json({ message: "開始遊戲" })
  } catch(error) {
    await client.query("ROLLBACK")
    return res.status(500).json({ message: "開始遊戲失敗", error: error.message })
  } finally {
    client.release()
  }
})

export { router }