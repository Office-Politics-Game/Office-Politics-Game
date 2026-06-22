import pool from "../db/index.js";

// 建立玩家行動紀錄
async function addLog(roomId, playerId, actionType, actionDetail){
    const result = await pool.query(
        `
        INSERT INTO action_logs
        (room_id, player_id, action_type, action_detail)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [roomId, playerId, actionType, actionDetail]
    )
    return result.rows[0];
}

//取得遊戲行動紀錄
async function getLogs(roomId) {
    const result = await pool.query(
        `
        SELECT *
        FROM action_logs
        WHERE room_id = $1
        ORDER BY created_at ASC
        `,
        [roomId]
  );
    return result.rows;
}

export {addLog, getLogs};