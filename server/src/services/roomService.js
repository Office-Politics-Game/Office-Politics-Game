import pool from "../db/index.js"
import { createInitialState } from "../game/initialState.js"
import {
  appendUnlockedAchievements,
  unlockAchievement,
} from "./achievementService.js"

const MAX_ROOM_PLAYERS = 4
const MIN_READY_PLAYERS_TO_START = 3
const COMPUTER_USERNAME_MAX_LENGTH = 50
const MAX_COMPUTER_USERNAME_INSERT_ATTEMPTS = 8

function createServiceError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function parsePositiveInteger(value, fieldName) {
  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw createServiceError(`${fieldName} 必須是正整數`)
  }

  return parsedValue
}

function normalizeComputerUsername(username) {
  const normalizedUsername = String(username ?? "").trim()

  if (!normalizedUsername) {
    throw createServiceError("請輸入電腦玩家名稱")
  }

  return normalizedUsername.slice(0, COMPUTER_USERNAME_MAX_LENGTH)
}

function createComputerAccountToken() {
  return `computer-player-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`
}

function createComputerUsernameCandidate(baseUsername, attempt) {
  if (attempt === 0) {
    return baseUsername
  }

  const suffix = `-${Math.random().toString(36).slice(2, 6)}`
  const allowedBaseLength = Math.max(
    1,
    COMPUTER_USERNAME_MAX_LENGTH - suffix.length,
  )

  return `${baseUsername.slice(0, allowedBaseLength)}${suffix}`
}

function normalizeCardSkinOverrides(overrides) {
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
    return {}
  }

  return overrides
}

async function attachCardSkinOverrideUrls(rows = [], db = pool) {
  const allOverrideIds = Array.from(
    new Set(
      rows
        .flatMap((row) =>
          Object.values(normalizeCardSkinOverrides(row.card_skin_overrides)).map((itemId) =>
            Number(itemId),
          ),
        )
        .filter((itemId) => Number.isInteger(itemId) && itemId > 0),
    ),
  )

  if (allOverrideIds.length === 0) {
    return rows.map((row) => ({
      ...row,
      card_skin_override_urls: {},
    }))
  }

  const overrideItemResult = await db.query(
    `SELECT id, image_url
     FROM shop_items
     WHERE id = ANY($1::int[])`,
    [allOverrideIds],
  )

  const overrideImageById = Object.fromEntries(
    overrideItemResult.rows.map((row) => [Number(row.id), row.image_url || ""]),
  )

  return rows.map((row) => ({
    ...row,
    card_skin_override_urls: Object.fromEntries(
      Object.entries(normalizeCardSkinOverrides(row.card_skin_overrides))
        .map(([slotKey, itemId]) => [slotKey, overrideImageById[Number(itemId)] || ""])
        .filter(([, imageUrl]) => Boolean(imageUrl)),
    ),
  }))
}

function mapRoomPlayer(player) {
  const isComputer = Boolean(player.is_computer) || player.role === "computer"

  return {
    playerId: player.player_id,
    username: player.username,
    title: player.title || "",
    avatarId: player.avatar_id,
    avatarUrl: player.avatar_url || "",
    cardSkinUrl: player.card_skin_url || "",
    cardSkinOverrides:
      player.card_skin_override_urls ??
      normalizeCardSkinOverrides(player.card_skin_overrides),
    role: player.role,
    seatOrder: player.seat_order,
    isReady: isComputer ? true : player.is_ready,
    isAlive: player.is_alive,
    isComputer,
    level: player.level,
  }
}

async function findOrCreateComputerPlayer(client, preferredUsername, index) {
  const baseUsername = normalizeComputerUsername(preferredUsername)
  const avatarId = (Number(index) % MAX_ROOM_PLAYERS) + 1

  for (
    let attempt = 0;
    attempt < MAX_COMPUTER_USERNAME_INSERT_ATTEMPTS;
    attempt += 1
  ) {
    const username = createComputerUsernameCandidate(baseUsername, attempt)
    const account = createComputerAccountToken()

    const playerResult = await client.query(
      `INSERT INTO players (username, account, avatar_id, is_online)
       VALUES ($1, $2, $3, false)
       ON CONFLICT DO NOTHING
       RETURNING id, username, avatar_id`,
      [username, account, avatarId],
    )

    if (playerResult.rows.length > 0) {
      return playerResult.rows[0]
    }
  }

  throw createServiceError("電腦玩家名稱已存在", 409)
}

function getNextSeatOrder(players) {
  const occupiedSeats = new Set(players.map((player) => Number(player.seat_order)))

  for (let seatOrder = 1; seatOrder <= MAX_ROOM_PLAYERS; seatOrder += 1) {
    if (!occupiedSeats.has(seatOrder)) {
      return seatOrder
    }
  }

  return players.length + 1
}

async function createRoom({ hostPlayerId }) {
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const roomCode = generateRoomCode()
    const roomResult = await client.query(
      `INSERT INTO game_rooms (room_code, host_player_id, status)
       VALUES ($1, $2, 'waiting')
       RETURNING *`,
      [roomCode, hostPlayerId],
    )

    const room = roomResult.rows[0]

    await client.query(
      `INSERT INTO game_room_players
       (room_id, player_id, role, seat_order, is_ready)
       VALUES ($1, $2, 'host', 1, true)`,
      [room.id, hostPlayerId],
    )

    await client.query("COMMIT")

    const unlockedAchievement = await unlockAchievement(
      hostPlayerId,
      "first_room_create"
    )

    return appendUnlockedAchievements({ room }, [unlockedAchievement])
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

async function joinRoom({ roomCode, playerId }) {
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const roomResult = await client.query(
      `SELECT * FROM game_rooms WHERE room_code = $1 FOR UPDATE`,
      [roomCode],
    )

    if (roomResult.rows.length === 0) {
      throw createServiceError("查無此房間", 404)
    }

    const room = roomResult.rows[0]

    if (room.status !== "waiting") {
      throw createServiceError("房間正在遊戲中，無法加入")
    }

    const countResult = await client.query(
      `SELECT COUNT(*) FROM game_room_players WHERE room_id = $1`,
      [room.id],
    )

    const playerCount = Number(countResult.rows[0].count)

    if (playerCount >= MAX_ROOM_PLAYERS) {
      throw createServiceError("房間人數已滿")
    }

    await client.query(
      `INSERT INTO game_room_players
       (room_id, player_id, role, seat_order, is_ready)
       VALUES ($1, $2, 'player', $3, false)
       RETURNING *`,
      [room.id, playerId, playerCount + 1],
    )

    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

async function updateReady({ roomCode, playerId, isReady }) {
  const roomResult = await pool.query(
    `SELECT * FROM game_rooms WHERE room_code = $1`,
    [roomCode],
  )

  if (roomResult.rows.length === 0) {
    throw createServiceError("查無此房間", 404)
  }

  const room = roomResult.rows[0]

  const result = await pool.query(
    `UPDATE game_room_players
     SET is_ready = $1
     WHERE room_id = $2 AND player_id = $3
     RETURNING *`,
    [isReady, room.id, playerId],
  )

  if (result.rows.length === 0) {
    throw createServiceError("玩家不在該房間中", 404)
  }
}

async function getRoomState({ roomCode }) {
  const roomResult = await pool.query(
    `SELECT id, room_code, host_player_id, status
     FROM game_rooms
     WHERE room_code = $1`,
    [roomCode],
  )

  if (roomResult.rows.length === 0) {
    throw createServiceError("查無此房間", 404)
  }

  const room = roomResult.rows[0]
  let playerResult

  try {
    playerResult = await pool.query(
      `SELECT
         grp.player_id,
         p.username,
         p.title,
         p.avatar_id,
         avatar_item.image_url AS avatar_url,
         card_skin_item.image_url AS card_skin_url,
         p.level,
         pei.card_skin_overrides,
         grp.role,
         grp.seat_order,
         grp.is_ready,
         grp.is_alive,
         (grp.is_computer OR grp.role = 'computer') AS is_computer
       FROM game_room_players grp
       JOIN players p ON p.id = grp.player_id
       LEFT JOIN player_equipped_items pei ON pei.player_id = p.id
       LEFT JOIN shop_items avatar_item
         ON avatar_item.id = pei.avatar_item_id
        AND avatar_item.type = 'avatar'
       LEFT JOIN shop_items card_skin_item
         ON card_skin_item.id = pei.card_skin_item_id
        AND card_skin_item.type = 'card_skin'
       WHERE grp.room_id = $1
       ORDER BY grp.seat_order ASC`,
      [room.id],
    )
  } catch {
    playerResult = await pool.query(
      `SELECT
         grp.player_id,
         p.username,
         p.title,
         p.avatar_id,
         avatar_item.image_url AS avatar_url,
         card_skin_item.image_url AS card_skin_url,
         p.level,
         grp.role,
         grp.seat_order,
         grp.is_ready,
         grp.is_alive,
         (grp.is_computer OR grp.role = 'computer') AS is_computer
       FROM game_room_players grp
       JOIN players p ON p.id = grp.player_id
       LEFT JOIN player_equipped_items pei ON pei.player_id = p.id
       LEFT JOIN shop_items avatar_item
         ON avatar_item.id = pei.avatar_item_id
        AND avatar_item.type = 'avatar'
       LEFT JOIN shop_items card_skin_item
         ON card_skin_item.id = pei.card_skin_item_id
        AND card_skin_item.type = 'card_skin'
       WHERE grp.room_id = $1
       ORDER BY grp.seat_order ASC`,
      [room.id],
    )
  }

  const playerRows = await attachCardSkinOverrideUrls(playerResult.rows)

  return {
    room: {
      id: room.id,
      roomCode: room.room_code,
      hostPlayerId: room.host_player_id,
      status: room.status,
    },
    players: playerRows.map(mapRoomPlayer),
  }
}

async function addComputerPlayer({ roomCode, hostPlayerId, username }) {
  const normalizedUsername = normalizeComputerUsername(username)
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const roomResult = await client.query(
      `SELECT * FROM game_rooms WHERE room_code = $1 FOR UPDATE`,
      [roomCode],
    )

    if (roomResult.rows.length === 0) {
      throw createServiceError("查無此房間", 404)
    }

    const room = roomResult.rows[0]

    if (room.host_player_id !== Number(hostPlayerId)) {
      throw createServiceError("只有房主可以加入電腦玩家", 403)
    }

    if (room.status !== "waiting") {
      throw createServiceError("只能在遊戲開始前加入電腦玩家")
    }

    const playerResult = await client.query(
      `SELECT
         grp.player_id,
         grp.seat_order,
         (grp.is_computer OR grp.role = 'computer') AS is_computer
       FROM game_room_players grp
       WHERE grp.room_id = $1
       ORDER BY grp.seat_order ASC`,
      [room.id],
    )
    const roomPlayers = playerResult.rows

    if (roomPlayers.length >= MAX_ROOM_PLAYERS) {
      throw createServiceError("房間人數已滿")
    }

    const computerIndex = roomPlayers.filter((player) => player.is_computer).length
    const computerPlayer = await findOrCreateComputerPlayer(
      client,
      normalizedUsername,
      computerIndex,
    )
    const alreadyInRoom = roomPlayers.some((player) => {
      return Number(player.player_id) === Number(computerPlayer.id)
    })

    if (alreadyInRoom) {
      throw createServiceError("電腦玩家已在房間中")
    }

    const seatOrder = getNextSeatOrder(roomPlayers)

    await client.query(
      `INSERT INTO game_room_players
       (room_id, player_id, role, seat_order, is_ready, is_computer)
       VALUES ($1, $2, 'computer', $3, true, true)
       RETURNING *`,
      [room.id, computerPlayer.id, seatOrder],
    )

    await client.query("COMMIT")
    return getRoomState({ roomCode })
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

async function kickPlayer({ roomCode, requesterPlayerId, targetPlayerId }) {
  const numericRequesterPlayerId = parsePositiveInteger(
    requesterPlayerId,
    "requesterPlayerId",
  )
  const numericTargetPlayerId = parsePositiveInteger(
    targetPlayerId,
    "targetPlayerId",
  )

  if (numericRequesterPlayerId === numericTargetPlayerId) {
    throw createServiceError("房主不能將自己移出房間", 400)
  }

  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const roomResult = await client.query(
      `SELECT id, room_code, host_player_id, status
       FROM game_rooms
       WHERE room_code = $1
       FOR UPDATE`,
      [roomCode],
    )

    if (roomResult.rows.length === 0) {
      throw createServiceError("查無此房間", 404)
    }

    const room = roomResult.rows[0]
    const memberResult = await client.query(
      `SELECT
         player_id,
         role,
         seat_order,
         (is_computer OR role = 'computer') AS is_computer
       FROM game_room_players
       WHERE room_id = $1
       ORDER BY seat_order ASC
       FOR UPDATE`,
      [room.id],
    )
    const requester = memberResult.rows.find(
      (member) => Number(member.player_id) === numericRequesterPlayerId,
    )
    const target = memberResult.rows.find(
      (member) => Number(member.player_id) === numericTargetPlayerId,
    )

    if (!requester) {
      throw createServiceError("操作者不在該房間中", 404)
    }

    if (Number(room.host_player_id) !== numericRequesterPlayerId || requester.role !== "host") {
      throw createServiceError("只有房主可以移出玩家", 403)
    }

    if (!target) {
      throw createServiceError("目標玩家不在該房間中", 404)
    }

    if (target.role === "host" || Number(target.player_id) === Number(room.host_player_id)) {
      throw createServiceError("不能將房主移出房間", 400)
    }

    if (room.status !== "waiting") {
      throw createServiceError("遊戲已開始，無法移出玩家", 409)
    }

    await client.query(
      `DELETE FROM game_room_players
       WHERE room_id = $1 AND player_id = $2`,
      [room.id, numericTargetPlayerId],
    )

    const remainingMembers = memberResult.rows.filter(
      (member) => Number(member.player_id) !== numericTargetPlayerId,
    )

    for (const [index, member] of remainingMembers.entries()) {
      await client.query(
        `UPDATE game_room_players
         SET seat_order = $1
         WHERE room_id = $2 AND player_id = $3`,
        [index + 1, room.id, member.player_id],
      )
    }

    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }

  return getRoomState({ roomCode })
}

async function leaveRoom({ roomCode, playerId }) {
  const numericPlayerId = parsePositiveInteger(playerId, "playerId")
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const roomResult = await client.query(
      `SELECT id, room_code, host_player_id, status
       FROM game_rooms
       WHERE room_code = $1
       FOR UPDATE`,
      [roomCode],
    )

    if (roomResult.rows.length === 0) {
      throw createServiceError("查無此房間", 404)
    }

    const room = roomResult.rows[0]

    if (room.status !== "waiting") {
      throw createServiceError("遊戲已開始，無法離開等待房", 409)
    }

    const memberResult = await client.query(
      `SELECT
         player_id,
         role,
         seat_order,
         (is_computer OR role = 'computer') AS is_computer
       FROM game_room_players
       WHERE room_id = $1
       ORDER BY seat_order ASC
       FOR UPDATE`,
      [room.id],
    )
    const departingMember = memberResult.rows.find(
      (member) => Number(member.player_id) === numericPlayerId,
    )

    if (!departingMember) {
      throw createServiceError("玩家不在該房間中", 404)
    }

    const isDepartingHost =
      Number(room.host_player_id) === numericPlayerId || departingMember.role === "host"
    const remainingMembers = memberResult.rows.filter(
      (member) => Number(member.player_id) !== numericPlayerId,
    )
    const nextHost = isDepartingHost
      ? remainingMembers.find((member) => !member.is_computer)
      : null

    if (isDepartingHost && !nextHost) {
      await client.query(
        `DELETE FROM game_room_players
         WHERE room_id = $1`,
        [room.id],
      )
      await client.query(
        `DELETE FROM game_rooms
         WHERE id = $1`,
        [room.id],
      )
      await client.query("COMMIT")

      return {
        dissolved: true,
        roomCode: room.room_code,
      }
    }

    await client.query(
      `DELETE FROM game_room_players
       WHERE room_id = $1 AND player_id = $2`,
      [room.id, numericPlayerId],
    )

    if (nextHost) {
      await client.query(
        `UPDATE game_rooms
         SET host_player_id = $1
         WHERE id = $2`,
        [nextHost.player_id, room.id],
      )
      await client.query(
        `UPDATE game_room_players
         SET role = CASE WHEN player_id = $1 THEN 'host'
                         WHEN role = 'host' THEN 'player'
                         ELSE role END
         WHERE room_id = $2`,
        [nextHost.player_id, room.id],
      )
    }

    for (const [index, member] of remainingMembers.entries()) {
      await client.query(
        `UPDATE game_room_players
         SET seat_order = $1
         WHERE room_id = $2 AND player_id = $3`,
        [index + 1, room.id, member.player_id],
      )
    }

    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }

  return {
    dissolved: false,
    roomState: await getRoomState({ roomCode }),
  }
}

async function startGame({ roomCode, playerId }) {
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const roomResult = await client.query(
      `SELECT * FROM game_rooms WHERE room_code = $1 FOR UPDATE`,
      [roomCode],
    )

    if (roomResult.rows.length === 0) {
      throw createServiceError("查無此房間", 404)
    }

    const room = roomResult.rows[0]

    if (room.host_player_id !== Number(playerId)) {
      throw createServiceError("只有房主可以開始遊戲", 403)
    }

    if (room.status !== "waiting") {
      throw createServiceError("遊戲已開始")
    }

    let playerResult

    try {
      playerResult = await client.query(
        `SELECT
           grp.player_id,
           grp.seat_order,
           grp.is_ready,
           (grp.is_computer OR grp.role = 'computer') AS is_computer,
           p.username,
           p.title,
           p.avatar_id,
           avatar_item.image_url AS avatar_url,
           card_skin_item.image_url AS card_skin_url,
           p.level,
           pei.card_skin_overrides
         FROM game_room_players grp
         JOIN players p ON p.id = grp.player_id
         LEFT JOIN player_equipped_items pei ON pei.player_id = p.id
         LEFT JOIN shop_items avatar_item
           ON avatar_item.id = pei.avatar_item_id
          AND avatar_item.type = 'avatar'
         LEFT JOIN shop_items card_skin_item
           ON card_skin_item.id = pei.card_skin_item_id
          AND card_skin_item.type = 'card_skin'
         WHERE grp.room_id = $1
         ORDER BY grp.seat_order ASC`,
        [room.id],
      )
    } catch {
      playerResult = await client.query(
        `SELECT
           grp.player_id,
           grp.seat_order,
           grp.is_ready,
           (grp.is_computer OR grp.role = 'computer') AS is_computer,
           p.username,
           p.title,
           p.avatar_id,
           avatar_item.image_url AS avatar_url,
           card_skin_item.image_url AS card_skin_url,
           p.level
         FROM game_room_players grp
         JOIN players p ON p.id = grp.player_id
         LEFT JOIN player_equipped_items pei ON pei.player_id = p.id
         LEFT JOIN shop_items avatar_item
           ON avatar_item.id = pei.avatar_item_id
          AND avatar_item.type = 'avatar'
         LEFT JOIN shop_items card_skin_item
           ON card_skin_item.id = pei.card_skin_item_id
          AND card_skin_item.type = 'card_skin'
         WHERE grp.room_id = $1
         ORDER BY grp.seat_order ASC`,
        [room.id],
      )
    }

    const players = await attachCardSkinOverrideUrls(playerResult.rows, client)

    if (players.length !== MAX_ROOM_PLAYERS) {
      throw createServiceError("玩家人數需滿 4 人")
    }

    const readyPlayerCount = players.filter(
      (player) => player.role !== "host" && player.is_ready,
    ).length

    if (readyPlayerCount < MIN_READY_PLAYERS_TO_START) {
      throw createServiceError("至少需要 3 名玩家打卡才可開始遊戲")
    }

    const matchResult = await client.query(
      `INSERT INTO matches (room_id)
       VALUES ($1)
       RETURNING *`,
      [room.id],
    )

    const match = matchResult.rows[0]
    const state = createInitialState(players)

    await client.query(
      `INSERT INTO game_sessions
       (room_id, match_id, status, current_turn_player_id, state_json)
       VALUES ($1, $2, 'playing', $3, $4)
       RETURNING *`,
      [room.id, match.id, state.currentTurnPlayerId, state],
    )

    await client.query(
      `UPDATE game_rooms
       SET status = 'playing'
       WHERE id = $1`,
      [room.id],
    )

    await client.query(
      `UPDATE room_invitations
       SET status = 'expired',
           responded_at = CURRENT_TIMESTAMP
       WHERE room_id = $1
         AND status = 'pending'`,
      [room.id],
    )

    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export {
  createRoom,
  joinRoom,
  addComputerPlayer,
  updateReady,
  getRoomState,
  kickPlayer,
  leaveRoom,
  startGame,
}
