import {
  getTopUpPackages,
  createTopUpOrder,
  mockPayTopUpOrder,
  createEcpayCheckout,
  confirmEcpayReturn,
} from "../services/topUpService.js"

function handleTopUpError(res, error) {
  return res.status(error.statusCode || 500).json({
    message: error.message || "儲值操作失敗",
  })
}

async function handleGetTopUpPackages(req, res) {
  try {
    const packages = getTopUpPackages()

    return res.status(200).json({
      packages,
    })
  } catch (error) {
    return handleTopUpError(res, error)
  }
}

async function handleCreateTopUpOrder(req, res) {
  try {
    const { playerId, packageId } = req.body

    const order = await createTopUpOrder(playerId, packageId)

    return res.status(201).json({
      message: "建立儲值訂單成功",
      order,
    })
  } catch (error) {
    return handleTopUpError(res, error)
  }
}

async function handleMockPayTopUpOrder(req, res) {
  try {
    const { orderId } = req.params

    const order = await mockPayTopUpOrder(orderId)

    return res.status(200).json({
      message: "儲值付款成功",
      order,
    })
  } catch (error) {
    return handleTopUpError(res, error)
  }
}

async function handleCreateEcpayCheckout(req, res) {
  try {
    const { orderId } = req.params

    const checkout = await createEcpayCheckout(orderId)

    return res.status(200).json({
      checkout,
    })
  } catch (error) {
    return handleTopUpError(res, error)
  }
}

async function handleEcpayReturn(req, res) {
  try {
    await confirmEcpayReturn(req.body)

    return res.status(200).send("1|OK")
  } catch (error) {
    console.error("處理綠界付款回傳失敗", error)

    return res.status(200).send("0|Error")
  }
}

export {
  handleGetTopUpPackages,
  handleCreateTopUpOrder,
  handleMockPayTopUpOrder,
  handleCreateEcpayCheckout,
  handleEcpayReturn,
}