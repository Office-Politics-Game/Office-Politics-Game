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
})
