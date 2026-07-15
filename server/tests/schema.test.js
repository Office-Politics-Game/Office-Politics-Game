import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schemaSql = fs.readFileSync(
    path.join(__dirname, "../src/db/schema.sql"),
    "utf8"
)

describe("database schema", () => {
    test("defines achievement tables", () => {
        expect(schemaSql).toContain("CREATE TABLE achievements")
        expect(schemaSql).toContain("code VARCHAR(50) NOT NULL UNIQUE")
        expect(schemaSql).toContain("reward_currency VARCHAR(20)")
        expect(schemaSql).toContain("reward_amount INTEGER NOT NULL DEFAULT 0")
        expect(schemaSql).toContain("CREATE TABLE player_achievements")
        expect(schemaSql).toContain(
            "player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE"
        )
        expect(schemaSql).toContain(
            "achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE"
        )
        expect(schemaSql).toContain("UNIQUE (player_id, achievement_id)")
    })

    test("defines gacha tables", () => {
        expect(schemaSql).toContain("CREATE TABLE gacha_pools")
        expect(schemaSql).toContain("code VARCHAR(50) NOT NULL UNIQUE")
        expect(schemaSql).toContain("CREATE TABLE gacha_cards")
        expect(schemaSql).toContain("image_key VARCHAR(100)")
        expect(schemaSql).toContain("frame_key VARCHAR(100)")
        expect(schemaSql).toContain("image_url TEXT")
        expect(schemaSql).toContain("frame_url TEXT")
        expect(schemaSql).toContain("CREATE TABLE gacha_pool_cards")
        expect(schemaSql).toContain(
            "pool_id INTEGER NOT NULL REFERENCES gacha_pools(id) ON DELETE CASCADE"
        )
        expect(schemaSql).toContain(
            "gacha_card_id INTEGER NOT NULL REFERENCES gacha_cards(id) ON DELETE CASCADE"
        )
        expect(schemaSql).toContain("weight INTEGER NOT NULL CHECK (weight > 0)")
        expect(schemaSql).toContain("CREATE TABLE player_gacha_cards")
        expect(schemaSql).toContain("UNIQUE (player_id, gacha_card_id)")
        expect(schemaSql).toContain("CREATE TABLE gacha_draw_logs")
        expect(schemaSql).toContain("compensation_coins INTEGER NOT NULL DEFAULT 0")
        expect(schemaSql).toContain("VALUES ('role_cards', '樂高角色卡池')")
        expect(schemaSql).toContain("('card_001', '樂高實習生', 1")
    })
})
