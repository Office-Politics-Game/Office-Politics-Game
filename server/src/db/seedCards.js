import pool from "./index.js";

const cards = [
    ["執行長", 8, 1, "role", "迫使丟棄此牌時，你直接淘汰。"],
    ["資深顧問", 7, 1, "role", "若同時持有 人資主管 或 專案經理 必須強制打出。"],
    ["人資主管", 6, 1, "role", "與一名玩家秘密交換手牌。"],
    ["專案經理", 5, 2, "role", "指定一名玩家棄牌重抽。"],
    ["職場老鳥", 4, 2, "role", "直到下個回合前，免疫所有卡牌效果。"],
    ["部門主管", 3, 2, "role", "與一名玩家秘密比大小，點數小者淘汰。"],
    ["打掃阿姨", 2, 2, "role", "秘密觀看一名玩家的手牌。"],
    ["實習生", 1, 5, "role", "猜測一名玩家的手牌，猜中則對方淘汰。"],
];

async function seedCards() {
    try {
        await pool.query("DELETE FROM cards");
        for (const card of cards) {
            await pool.query(
                `INSERT INTO cards (name, rank, quantity, type, description)
                VALUES ($1, $2, $3, $4, $5)`,
                card
            );
        }
        console.log("卡片 seed 完成")
    } catch (error) {
        console.error("卡牌 seed 失敗", error)
    } finally {
        await pool.end();
    }
}
seedCards();
