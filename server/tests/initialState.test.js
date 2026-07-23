import { createInitialState, selectInitialTurnPlayerId } from "../src/game/initialState.js"

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

describe("player profile data", ()=>{
    test("initial game state keeps player levels", ()=>{
        const players = createPlayers([false, true, true, true]).map((player, index)=>({
            ...player,
            player_id: index + 1,
            username: `Player ${index + 1}`,
            level: index + 5,
            seat_order: index + 1,
            is_computer: player.isComputer,
        }))

        expect(createInitialState(players).players[0].level).toBe(5)
    })
})
