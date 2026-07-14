import { selectInitialTurnPlayerId } from "../src/game/initialState.js"

function createPlayers(computerFlags){
    return computerFlags.map((isComputer, index)=>({
        playerId: index + 1,
        isComputer,
    }))
}

describe("初始回合先手", ()=>{
    test("一名真人與三名電腦時固定由真人先手", ()=>{
        const players = createPlayers([true, true, false, true])

        expect(selectInitialTurnPlayerId(players, ()=> 0)).toBe(3)
    })

    test("非教學玩家組合沿用隨機索引", ()=>{
        const players = createPlayers([false, false, true, true])

        expect(selectInitialTurnPlayerId(players, ()=> 0.75)).toBe(4)
    })
})
