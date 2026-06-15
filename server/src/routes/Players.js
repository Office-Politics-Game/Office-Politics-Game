import express from 'express'
import pool from '../db/index'

const router = express.Router()

router.post('/guset', async (res,req)=>{
    try {
        const { username, avatarId } = req.body

        if (!username) {
            return res.status(400).json({ message : "請輸入用戶名稱" })
        }

        const result = await pool.query(
            `INSERT INTO players (username, avatar_id)
            VALUES ($1, $2)
            RETURNING *`,
            [username, avatarId ?? null]
        )

        res.status(201).json({ player : result.rows[0] })
    } catch (error) {
        res.status(500).json({ error : error.message })
    }
})

export { router }