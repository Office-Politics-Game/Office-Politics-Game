import pool from "../db/index.js"

async function createGuest({ username, avatarId }) {
  const result = await pool.query(
    `INSERT INTO players (username, avatar_id)
     VALUES ($1, $2)
     RETURNING *`,
    [username, avatarId ?? null]
  )

  return result.rows[0]
}

export { createGuest }
