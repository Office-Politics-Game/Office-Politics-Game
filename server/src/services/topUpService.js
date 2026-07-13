import pool from "../db/index.js"
import { addCurrency } from "./currencyService.js"
import {
  appendUnlockedAchievements,
  unlockAchievement,
} from "./achievementService.js"
import crypto from "node:crypto"

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

  const unlockedAchievement = await unlockAchievement(
    order.player_id,
    "first_top_up"
  )

  return appendUnlockedAchievements(paidResult.rows[0], [unlockedAchievement])
}

function formatEcpayDate(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0")

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("/") + " " + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join(":")
}

const ecpayHashKey = "pwFHCqoQZGmho4w6"
const ecpayHashIv = "EkRm7iFT261dpevs"

function encodeEcpayValue(value) {
  return encodeURIComponent(value)
    .toLowerCase()
    .replace(/%20/g, "+")
    .replace(/%2d/g, "-")
    .replace(/%5f/g, "_")
    .replace(/%2e/g, ".")
    .replace(/%21/g, "!")
    .replace(/%2a/g, "*")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")")
}

function createCheckMacValue(params) {
  const sortedParams = Object.keys(params)
    .sort((keyA, keyB) => keyA.localeCompare(keyB))
    .map((key) => `${key}=${params[key]}`)
    .join("&")

  const rawValue = `HashKey=${ecpayHashKey}&${sortedParams}&HashIV=${ecpayHashIv}`
  const encodedValue = encodeEcpayValue(rawValue)

  return crypto
    .createHash("sha256")
    .update(encodedValue)
    .digest("hex")
    .toUpperCase()
}

async function createEcpayCheckout(orderId) {
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

  const params = {
    MerchantID: "3002607",
    MerchantTradeNo: `TOPUP${order.id}`,
    MerchantTradeDate: formatEcpayDate(),
    PaymentType: "aio",
    TotalAmount: order.price,
    TradeDesc: "Office Politics Game top up",
    ItemName: order.package_id,
    ReturnURL: "https://office-politics-game.onrender.com/api/top-ups/ecpay/return",
    ClientBackURL: "https://office-politics-game.vercel.app/mall",
    ChoosePayment: "ALL",
    EncryptType: 1,
  }
  params.CheckMacValue = createCheckMacValue(params)

  if (!order) {
    throw createServiceError("找不到儲值訂單", 404)
  }

  if (order.status !== "pending") {
    throw createServiceError("只有 pending 訂單可以建立付款", 409)
  }

  return {
    orderId: order.id,
    actionUrl: "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5",
    params,
  }
}

async function confirmEcpayReturn(payload) {
  const tradeNo = payload?.MerchantTradeNo
  const rtnCode = String(payload?.RtnCode || "")

  if (rtnCode !== "1") {
    throw createServiceError("綠界付款未成功", 400)
  }

  if (!tradeNo || !tradeNo.startsWith("TOPUP")) {
    throw createServiceError("綠界訂單編號錯誤", 400)
  }

  const orderId = Number(tradeNo.replace("TOPUP", ""))

  if (!Number.isInteger(orderId)) {
    throw createServiceError("綠界訂單編號錯誤", 400)
  }

  return mockPayTopUpOrder(orderId)
}

export {
  getTopUpPackages,
  createTopUpOrder,
  mockPayTopUpOrder,
  createEcpayCheckout,
  confirmEcpayReturn,
}
