import { readFile } from "node:fs/promises"

async function readSource(path) {
    return readFile(new URL(`../${path}`, import.meta.url), "utf8")
}

describe("showdown action delivery contract", () => {
    test("game action service returns the showdown snapshot from finishTurn", async () => {
        const source = await readSource("src/services/gameActionService.js")

        expect(source).toMatch(/const \{ showdownResult \} = finishTurn\(state, numericPlayerId\)/)
        expect(source).toMatch(/return \{[\s\S]*showdownResult,[\s\S]*publicState/)
    })

    test("HTTP play-card response exposes the optional showdown snapshot", async () => {
        const source = await readSource("src/controllers/actionController.js")
        const playHandler = source.slice(
            source.indexOf("async function handlePlayCard"),
            source.indexOf("async function handleDrawCard"),
        )

        expect(playHandler).toMatch(/showdownResult: result\.showdownResult/)
        expect(playHandler).toMatch(/state: result\.publicState/)
    })

    test("socket play-card action and acknowledgement share action-bound showdown data", async () => {
        const source = await readSource("src/socket/gameHandlers.js")
        const playHandler = source.slice(source.indexOf('socket.on("game:play-card"'))

        expect(playHandler).toMatch(/showdownResult: result\.showdownResult/)
        expect(playHandler).toMatch(/afterActionId: playActionId/)
        expect(playHandler).toMatch(/showdownResult: result\.showdownResult[\s\S]*afterActionId: playActionId/)
        expect(source).toMatch(/showdownResult: result\.playResult\.showdownResult/)
    })

    test("draw and play acknowledgements expose public state without a nested getState wrapper", async () => {
        const source = await readSource("src/socket/gameHandlers.js")
        const drawHandler = source.slice(
            source.indexOf('socket.on("game:draw-card"'),
            source.indexOf('socket.on("game:play-card"'),
        )
        const playHandler = source.slice(
            source.indexOf('socket.on("game:play-card"'),
            source.indexOf('socket.on("game:ready-for-computer-turn"'),
        )

        expect(drawHandler).toMatch(/state: gameState\.state/)
        expect(playHandler).toMatch(/state: gameState\.state/)
        expect(drawHandler).not.toMatch(/state: gameState,/) 
        expect(playHandler).not.toMatch(/state: gameState,/) 
    })

    test("draw acknowledgement is bound to the draw animation and cannot advance the turn early", async () => {
        const source = await readSource("src/socket/gameHandlers.js")
        const drawHandler = source.slice(
            source.indexOf('socket.on("game:draw-card"'),
            source.indexOf('socket.on("game:play-card"'),
        )

        expect(drawHandler).toMatch(/afterActionId: drawAction\.id/)
        expect(drawHandler).toMatch(/readyForComputerTurn: false/)
        expect(drawHandler).toMatch(/state: gameState\.state[\s\S]*afterActionId: drawAction\.id[\s\S]*readyForComputerTurn: false/)
    })
})
