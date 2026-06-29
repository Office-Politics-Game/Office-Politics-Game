import { checkTurn, checkPlayer, checkCard, checkTarget, checkProtected, checkAdvisorRule } from "../src/services/ruleCheckService.js"

//假資料
function createState() {
  return {
    currentTurnPlayerId: 1,
    players: [
      {
        playerId: 1,
        hand: [
          { id: 7, name: "Adviser" },
          { id: 8, name: "CEO" },
        ],
        isEliminated: false,
        isProtected: false,
      },
      {
        playerId: 2,
        hand: [{ id: 1, name: "Intern" }],
        isEliminated: false,
        isProtected: false,
      },
      {
        playerId: 3,
        hand: [{ id: 4, name: "Senior" }],
        isEliminated: true,
        isProtected: false,
      },
    ],
  }
}

describe("出牌規則判斷", ()=>{
    test("只有目前輪次的玩家可以行動", ()=>{
        const state = createState()

        expect(()=> checkTurn(state, 1)).not.toThrow()
        expect(()=> checkTurn(state, 2)).toThrow("尚未輪到此玩家")
    })

    test("擋掉不存在或已出局玩家，回傳場上玩家操作資料", ()=>{
        const state = createState()

        expect(checkPlayer(state, 1).playerId).toBe(1)
        expect(()=> checkPlayer(state, 99)).toThrow("此玩家不在該局遊戲中")
        expect(()=> checkPlayer(state, 3)).toThrow("此玩家已出局")
    })

    test("玩家必須持有該手牌", ()=>{
        const state = createState()

        expect(()=> checkCard(state, 1, 1)).toThrow("玩家沒有這張手牌")
        expect(checkCard(state, 1, 7)).toEqual({ id: 7, name: "Adviser" })
    })

    test("檢查需要指定目標的卡牌是否有正確指定目標", ()=>{
        const state = createState()
        state.players[1].hand = [{ id: 6, name: "HR" }]

        expect(checkTarget(state, 2, 6, 1).playerId).toBe(1)
        expect(()=> checkTarget(state, 2, 6)).toThrow("需要指定目標玩家")
        expect(()=> checkTarget(state, 2, 6, 2)).toThrow("不能選擇自己作為目標")
        expect(()=> checkTarget(state, 2, 6, 99)).toThrow("目標玩家不存在")
        expect(()=> checkTarget(state, 2, 6, 3)).toThrow("目標玩家已出局")
    })

    test("不需要指定目標的卡牌回傳null", ()=>{
        const state = createState()

        expect(checkTarget(state, 1, 7)).toBeNull()
    })

    test("受保護的玩家不能被指定為目標", ()=>{
        const state = createState()

        expect(()=> checkProtected(state, 1)).not.toThrow()

        state.players[0].isProtected = true

        expect(()=> checkProtected(state, 1)).toThrow("目標玩家受到卡牌效果保護，免疫效果")
    })

    test("同時持有資深顧問與人資主管或專案經理時，必須先打出資深顧問", ()=>{
        const state = createState()

        state.players[0].hand = [
            { id: 7, name: "Adviser" },
            { id: 5, name: "PM" },
        ]

        expect(()=> checkAdvisorRule(state, 1, 5)).toThrow("同時持有資深顧問與人資主管或專案經理時，必須先打出資深顧問")
        expect(()=> checkAdvisorRule(state, 1, 7)).not.toThrow()

        state.players[0].hand = [
            { id: 7, name: "Adviser" },
            { id: 6, name: "HR" },
        ]

        expect(()=> checkAdvisorRule(state, 1, 6)).toThrow("同時持有資深顧問與人資主管或專案經理時，必須先打出資深顧問")
        expect(()=> checkAdvisorRule(state, 1, 7)).not.toThrow()
    })

    test("沒有同時持有資深顧問與人資主管或專案經理時，其他卡牌能正常打出", ()=>{
        const state = createState()

        expect(()=> checkAdvisorRule(state, 1, 8)).not.toThrow()
    })
})

describe("PM target rule", ()=>{
    test("allows PM to target self but keeps self-target limit for other cards", ()=>{
        const state = createState()
        state.players[1].hand = [{ id: 5, name: "PM" }]

        expect(checkTarget(state, 2, 5, 2).playerId).toBe(2)

        state.players[1].hand = [{ id: 6, name: "HR" }]

        expect(()=> checkTarget(state, 2, 6, 2)).toThrow()
    })
})
