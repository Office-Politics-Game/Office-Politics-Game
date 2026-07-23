import { drawGacha, getOwnedGachaCards } from "../services/gachaService.js"

function getErrorStatus(error) {
  return error.statusCode || 500
}

async function handleDrawGacha(req, res) {
  try {
    const result = await drawGacha({
      playerId: req.body.playerId,
      count: req.body.count ?? 1,
      poolId: req.body.poolId ?? "role_cards",
    })

    return res.status(201).json(result)
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "抽卡失敗",
      error: error.message,
    })
  }
}

async function handleGetOwnedGachaCards(req, res) {
  try {
    const result = await getOwnedGachaCards({
      playerId: req.query.playerId,
      poolId: req.query.poolId ?? "role_cards",
    })

    return res.status(200).json(result)
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "讀取已擁有卡牌失敗",
      error: error.message,
    })
  }
}

export {
  handleDrawGacha,
  handleGetOwnedGachaCards,
}
