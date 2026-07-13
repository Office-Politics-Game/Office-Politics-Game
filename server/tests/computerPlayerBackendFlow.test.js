import { readFile } from "node:fs/promises"

async function readSource(path) {
    return readFile(new URL(`../${path}`, import.meta.url), "utf8")
}

describe("computer player backend flow wiring", () => {
    test("room service validates and persists backend computer players", async () => {
        const roomServiceSource = await readSource("src/services/roomService.js")

        expect(roomServiceSource).toMatch(/async function addComputerPlayer/)
        expect(roomServiceSource).toMatch(/room\.host_player_id !== Number\(hostPlayerId\)/)
        expect(roomServiceSource).toMatch(/room\.status !== "waiting"/)
        expect(roomServiceSource).toMatch(/roomPlayers\.length >= MAX_ROOM_PLAYERS/)
        expect(roomServiceSource).toMatch(/\(grp\.role = 'computer'\) AS is_computer/)
        expect(roomServiceSource).not.toMatch(/grp\.is_computer/)
        expect(roomServiceSource).toMatch(/isComputer/)
    })

    test("game socket emits action-bound states and guards duplicate ACKs", async () => {
        const gameHandlersSource = await readSource("src/socket/gameHandlers.js")

        expect(gameHandlersSource).toMatch(/emitGameStateAfterActionToPlayers/)
        expect(gameHandlersSource).toMatch(/afterActionId: actionId/)
        expect(gameHandlersSource).toMatch(/readyForComputerTurn/)
        expect(gameHandlersSource).toMatch(/\{ readyForComputerTurn: false \}/)
        expect(gameHandlersSource).toMatch(/\{ readyForComputerTurn: true \}/)
        expect(gameHandlersSource).toMatch(/game:ready-for-computer-turn/)
        expect(gameHandlersSource).toMatch(/activeComputerTurnRooms\.has\(roomCode\)/)
        expect(gameHandlersSource).toMatch(/activeComputerTurnRooms\.add\(roomCode\)/)
        expect(gameHandlersSource).toMatch(/activeComputerTurnRooms\.delete\(roomCode\)/)
        expect(gameHandlersSource).toMatch(/runComputerTurn\(\{ roomCode \}\)/)
    })

    test("game state keeps computer metadata public", async () => {
        const initialStateSource = await readSource("src/game/initialState.js")
        const gameStateSource = await readSource("src/services/gameStateService.js")

        expect(initialStateSource).toMatch(/isComputer: Boolean\(player\.is_computer\)/)
        expect(gameStateSource).toMatch(/isComputer: Boolean\(player\.isComputer\)/)
    })
})
