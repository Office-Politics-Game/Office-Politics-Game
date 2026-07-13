import { pathToFileURL } from "node:url"
import pool from "./index.js"

const achievementSeeds = [
    {
        code: "first_friend",
        name: "社交新人",
        description: "第一次加好友",
        category: "social",
        rewardCurrency: null,
        rewardAmount: 0,
    },
    {
        code: "first_room_create",
        name: "主持新人",
        description: "第一次建立房間",
        category: "room",
        rewardCurrency: null,
        rewardAmount: 0,
    },
    {
        code: "first_game_win",
        name: "初次勝利",
        description: "第一次遊戲勝利",
        category: "game",
        rewardCurrency: null,
        rewardAmount: 0,
    },
    {
        code: "first_top_up",
        name: "資本進場",
        description: "第一次儲值",
        category: "payment",
        rewardCurrency: null,
        rewardAmount: 0,
    },
]

async function seedAchievements(client = pool) {
    for (const achievement of achievementSeeds) {
        await client.query(
            `INSERT INTO achievements
             (code, name, description, category, reward_currency, reward_amount)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (code) DO UPDATE
             SET name = EXCLUDED.name,
                 description = EXCLUDED.description,
                 category = EXCLUDED.category,
                 reward_currency = EXCLUDED.reward_currency,
                 reward_amount = EXCLUDED.reward_amount,
                 updated_at = CURRENT_TIMESTAMP`,
            [
                achievement.code,
                achievement.name,
                achievement.description,
                achievement.category,
                achievement.rewardCurrency,
                achievement.rewardAmount,
            ]
        )
    }
}

if (
    process.argv[1]
    && import.meta.url === pathToFileURL(process.argv[1]).href
) {
    seedAchievements()
        .then(() => {
            console.log("Seeded achievements")
        })
        .catch((error) => {
            console.error("Seed achievements failed", error)
            process.exitCode = 1
        })
        .finally(() => {
            pool.end()
        })
}

export { achievementSeeds, seedAchievements }
