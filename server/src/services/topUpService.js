import pool from "../db/index.js"
import { addCurrency } from "./currencyService.js"

const topUpPackages = [
  {
    id: "gems_60",
    name: "60 鑽石",
    currency: "diamond",
    amount: 60,
    price: 30,
  },
  {
    id: "gems_300",
    name: "300 鑽石",
    currency: "diamond",
    amount: 300,
    price: 150,
  },
  {
    id: "gems_680",
    name: "680 鑽石",
    currency: "diamond",
    amount: 680,
    price: 330,
  },
]

function getTopUpPackages() {
  return topUpPackages
}

function findTopUpPackage(packageId) {
  return topUpPackages.find((topUpPackage) => {
    return topUpPackage.id === packageId
  })
}

function createServiceError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

async function createTopUpOrder(playerId, packageId) {
  const selectedPackage = findTopUpPackage(packageId)

  if (!playerId) {
    throw createServiceError("缺少玩家 ID")
  }

  if (!selectedPackage) {
    throw createServiceError("找不到儲值方案", 404)
  }
  
  const playerResult = await pool.query(
    `SELECT id
    FROM players
    WHERE id = $1`,
    [Number(playerId)]
  )

  if (playerResult.rows.length === 0) {
    throw createServiceError("找不到玩家", 404)
  }

  const result = await pool.query(
    `INSERT INTO top_up_orders
      (player_id, package_id, currency, amount, price, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING *`,
    [
      Number(playerId),
      selectedPackage.id,
      selectedPackage.currency,
      selectedPackage.amount,
      selectedPackage.price,
    ]
  )

  return result.rows[0]
}

async function mockPayTopUpOrder(orderId) {
  const orderResult = await pool.query(
    `SELECT *
     FROM top_up_orders
     WHERE id = $1`,
    [Number(orderId)]
  )

  const order = orderResult.rows[0]

  if (!order) {
    throw createServiceError("找不到儲值訂單", 404)
  }

  if (order.status === "paid") {
    throw createServiceError("訂單已付款", 409)
  }

  const paidResult = await pool.query(
    `UPDATE top_up_orders
     SET status = 'paid',
         paid_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [order.id]
  )

  await addCurrency(
    order.player_id,
    order.currency,
    order.amount,
    "top_up",
    `儲值訂單 #${order.id}`
  )

  return paidResult.rows[0]
}

export { getTopUpPackages, createTopUpOrder, mockPayTopUpOrder }