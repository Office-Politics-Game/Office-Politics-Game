import pool from "../db/index.js"
import { sanitizeCardSkinOverrideIds } from "../constants/cardSkinSlots.js"

const currencyColumnMap = {
  coin: "coins",
  diamond: "gems",
  ticket: "tickets",
}

const equipColumnMap = {
  avatar: "avatar_item_id",
  card_skin: "card_skin_item_id",
  card_back: "card_back_item_id",
  board_skin: "board_skin_item_id",
}

const GACHA_TICKET_UNIT_PRICE = 100
const MAX_GACHA_TICKET_PURCHASE_QUANTITY = 999

function getEquipColumnByCategory(categoryId) {
  return equipColumnMap[categoryId] || null
}

function createServiceError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function parsePositiveInteger(value, fieldName) {
  const numberValue = Number(value)

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw createServiceError(`${fieldName} 必須是正整數`)
  }

  return numberValue
}

function getCurrencyColumn(currency) {
  const column = currencyColumnMap[currency]

  if (!column) {
    throw createServiceError("貨幣類型有誤")
  }

  return column
}

function getEffectiveItemCurrency(item) {
  if (item?.type === "gacha_ticket") {
    return "diamond"
  }

  return item?.currency
}

function getEffectiveItemPrice(item) {
  if (item?.type === "gacha_ticket") {
    return GACHA_TICKET_UNIT_PRICE
  }

  return Number(item?.price)
}

function mapShopItem(row) {
  const effectiveCurrency = getEffectiveItemCurrency(row)
  const effectivePrice = getEffectiveItemPrice(row)

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type,
    price: effectivePrice,
    currency: effectiveCurrency,
    imageUrl: row.image_url,
    isActive: row.is_active,
    startAt: row.start_at,
    endAt: row.end_at,
    stock: row.stock,
    purchaseLimit: row.purchase_limit,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapPlayerItem(row) {
  return {
    id: row.id,
    playerId: row.player_id,
    shopItemId: row.shop_item_id,
    quantity: row.quantity,
    createdAt: row.created_at,
    item: row.item_id
      ? mapShopItem({
          id: row.item_id,
          name: row.name,
          description: row.description,
          type: row.type,
          price: row.price,
          currency: row.currency,
          image_url: row.image_url,
          is_active: row.is_active,
          start_at: row.start_at,
          end_at: row.end_at,
          stock: row.stock,
          purchase_limit: row.purchase_limit,
          created_at: row.item_created_at,
          updated_at: row.item_updated_at,
        })
      : null,
  }
}

function mapPurchaseLog(row) {
  return {
    id: row.id,
    playerId: row.player_id,
    shopItemId: row.shop_item_id,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    totalPrice: row.total_price,
    currency: row.currency,
    createdAt: row.created_at,
  }
}

function mapEquippedItems(row) {
  return {
    playerId: row.player_id,
    avatarItemId: row.avatar_item_id,
    cardSkinItemId: row.card_skin_item_id,
    cardSkinOverrides: row.card_skin_overrides ?? {},
    cardBackItemId: row.card_back_item_id,
    boardSkinItemId: row.board_skin_item_id,
    updatedAt: row.updated_at,
  }
}

async function validateOwnedCardSkinItems(client, playerId, itemIds = []) {
  if (itemIds.length === 0) {
    return
  }

  const result = await client.query(
    `SELECT pi.shop_item_id
     FROM player_items pi
     JOIN shop_items si ON si.id = pi.shop_item_id
     WHERE pi.player_id = $1
       AND pi.shop_item_id = ANY($2::int[])
       AND si.type = 'card_skin'`,
    [playerId, itemIds]
  )

  const ownedItemIdSet = new Set(result.rows.map((row) => Number(row.shop_item_id)))
  const missingItemId = itemIds.find((itemId) => !ownedItemIdSet.has(Number(itemId)))

  if (missingItemId) {
    throw createServiceError("尚未擁有此卡面", 404)
  }
}

async function getShopItems({ type, activeOnly = true } = {}) {
  const values = []
  const conditions = []

  if (type) {
    values.push(type)
    conditions.push(`type = $${values.length}`)
  }

  if (activeOnly) {
    conditions.push("is_active = true")
    conditions.push("(start_at IS NULL OR start_at <= CURRENT_TIMESTAMP)")
    conditions.push("(end_at IS NULL OR end_at > CURRENT_TIMESTAMP)")
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

  const result = await pool.query(
    `SELECT id, name, description, type, price, currency, image_url,
            is_active, start_at, end_at, stock, purchase_limit,
            created_at, updated_at
     FROM shop_items
     ${whereClause}
     ORDER BY type ASC, id ASC`,
    values
  )

  return result.rows.map(mapShopItem)
}

async function getPlayerItems(playerId) {
  const numericPlayerId = parsePositiveInteger(playerId, "playerId")

  const result = await pool.query(
    `SELECT pi.id, pi.player_id, pi.shop_item_id, pi.quantity, pi.created_at,
            si.id AS item_id, si.name, si.description, si.type, si.price,
            si.currency, si.image_url, si.is_active, si.start_at, si.end_at,
            si.stock, si.purchase_limit,
            si.created_at AS item_created_at,
            si.updated_at AS item_updated_at
     FROM player_items pi
     JOIN shop_items si ON si.id = pi.shop_item_id
     WHERE pi.player_id = $1
     ORDER BY pi.created_at DESC, pi.id DESC`,
    [numericPlayerId]
  )

  return result.rows.map(mapPlayerItem)
}

async function purchaseShopItem({ playerId, shopItemId, quantity = 1 }) {
  const numericPlayerId = parsePositiveInteger(playerId, "playerId")
  const numericShopItemId = parsePositiveInteger(shopItemId, "shopItemId")
  const numericQuantity = parsePositiveInteger(quantity, "quantity")
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const itemResult = await client.query(
      `SELECT id, name, description, type, price, currency, image_url,
              is_active, start_at, end_at, stock, purchase_limit,
              created_at, updated_at
       FROM shop_items
       WHERE id = $1
       FOR UPDATE`,
      [numericShopItemId]
    )

    if (itemResult.rows.length === 0) {
      throw createServiceError("找不到商品", 404)
    }

    const item = itemResult.rows[0]

    if (!item.is_active) {
      throw createServiceError("商品未上架")
    }

    const now = Date.now()
    if (item.start_at && new Date(item.start_at).getTime() > now) {
      throw createServiceError("商品尚未開始販售")
    }

    if (item.end_at && new Date(item.end_at).getTime() <= now) {
      throw createServiceError("商品已下架")
    }

    if (item.stock !== null && item.stock < numericQuantity) {
      throw createServiceError("商品庫存不足")
    }

    const ownedResult = await client.query(
      `SELECT quantity
       FROM player_items
       WHERE player_id = $1 AND shop_item_id = $2
       FOR UPDATE`,
      [numericPlayerId, numericShopItemId]
    )

    const ownedQuantity = ownedResult.rows[0]?.quantity ?? 0

    if (
      item.purchase_limit !== null &&
      ownedQuantity + numericQuantity > item.purchase_limit
    ) {
      throw createServiceError("已達商品購買上限")
    }

    const effectiveCurrency = getEffectiveItemCurrency(item)
    const currencyColumn = getCurrencyColumn(effectiveCurrency)
    const isGachaTicketPurchase = item.type === "gacha_ticket"

    if (
      isGachaTicketPurchase &&
      numericQuantity > MAX_GACHA_TICKET_PURCHASE_QUANTITY
    ) {
      throw createServiceError(
        `單次最多購買 ${MAX_GACHA_TICKET_PURCHASE_QUANTITY} 張抽獎券`
      )
    }

    const unitPrice = getEffectiveItemPrice(item)
    const totalPrice = unitPrice * numericQuantity
    const playerResult = await client.query(
      `SELECT id, ${currencyColumn}
       FROM players
       WHERE id = $1
       FOR UPDATE`,
      [numericPlayerId]
    )

    if (playerResult.rows.length === 0) {
      throw createServiceError("找不到玩家", 404)
    }

    const player = playerResult.rows[0]

    if (player[currencyColumn] < totalPrice) {
      throw createServiceError("餘額不足")
    }

    const updatedPlayerResult = isGachaTicketPurchase
      ? await client.query(
          `UPDATE players
           SET ${currencyColumn} = ${currencyColumn} - $1,
               tickets = tickets + $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3
           RETURNING id, coins, gems, tickets, ${currencyColumn} AS balance_after`,
          [totalPrice, numericQuantity, numericPlayerId]
        )
      : await client.query(
          `UPDATE players
           SET ${currencyColumn} = ${currencyColumn} - $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2
           RETURNING id, coins, gems, tickets, ${currencyColumn} AS balance_after`,
          [totalPrice, numericPlayerId]
        )

    if (item.stock !== null) {
      await client.query(
        `UPDATE shop_items
         SET stock = stock - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [numericQuantity, numericShopItemId]
      )
    }

    const playerItemResult = await client.query(
      `INSERT INTO player_items (player_id, shop_item_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (player_id, shop_item_id)
       DO UPDATE SET quantity = player_items.quantity + EXCLUDED.quantity
       RETURNING id, player_id, shop_item_id, quantity, created_at`,
      [numericPlayerId, numericShopItemId, numericQuantity]
    )

    const purchaseLogResult = await client.query(
      `INSERT INTO shop_purchase_logs
       (player_id, shop_item_id, quantity, unit_price, total_price, currency)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, player_id, shop_item_id, quantity, unit_price,
                 total_price, currency, created_at`,
      [
        numericPlayerId,
        numericShopItemId,
        numericQuantity,
        unitPrice,
        totalPrice,
        effectiveCurrency,
      ]
    )

    const balanceAfter = updatedPlayerResult.rows[0].balance_after

    await client.query(
      `INSERT INTO player_currency_logs
       (player_id, currency, amount, balance_after, type, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        numericPlayerId,
        effectiveCurrency,
        -totalPrice,
        balanceAfter,
        "shop_purchase",
        `購買商品：${item.name}`,
      ]
    )

    if (isGachaTicketPurchase) {
      await client.query(
        `INSERT INTO player_currency_logs
         (player_id, currency, amount, balance_after, type, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          numericPlayerId,
          "ticket",
          numericQuantity,
          updatedPlayerResult.rows[0].tickets,
          "shop_purchase",
          `購買商城招募券：${item.name}`,
        ]
      )
    }

    await client.query("COMMIT")

    return {
      item: mapShopItem(item),
      playerItem: mapPlayerItem(playerItemResult.rows[0]),
      purchaseLog: mapPurchaseLog(purchaseLogResult.rows[0]),
      currency: {
        playerId: updatedPlayerResult.rows[0].id,
        currency: effectiveCurrency,
        amount: -totalPrice,
        balanceAfter,
        coins: updatedPlayerResult.rows[0].coins,
        gems: updatedPlayerResult.rows[0].gems,
        tickets: updatedPlayerResult.rows[0].tickets,
      },
    }
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

async function getPlayerEquippedItems(playerId) {
  const numericPlayerId = parsePositiveInteger(playerId, "playerId")
  let result

  try {
    result = await pool.query(
      `SELECT player_id, avatar_item_id, card_skin_item_id, card_skin_overrides,
              card_back_item_id, board_skin_item_id, updated_at
       FROM player_equipped_items
       WHERE player_id = $1`,
      [numericPlayerId]
    )
  } catch {
    result = await pool.query(
      `SELECT player_id, avatar_item_id, card_skin_item_id,
              card_back_item_id, board_skin_item_id, updated_at
       FROM player_equipped_items
       WHERE player_id = $1`,
      [numericPlayerId]
    )
  }

  if (result.rows.length === 0) {
    return {
      playerId: numericPlayerId,
      avatarItemId: null,
      cardSkinItemId: null,
      cardSkinOverrides: {},
      cardBackItemId: null,
      boardSkinItemId: null,
      updatedAt: null,
    }
  }

  return mapEquippedItems(result.rows[0])
}

async function equipShopItem({ playerId, shopItemId = null, categoryId = null }) {
  const numericPlayerId = parsePositiveInteger(playerId, "playerId")
  const numericShopItemId = parsePositiveInteger(shopItemId, "shopItemId")
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const itemResult = await client.query(
      `SELECT si.id, si.type
       FROM player_items pi
       JOIN shop_items si ON si.id = pi.shop_item_id
       WHERE pi.player_id = $1
         AND pi.shop_item_id = $2`,
      [numericPlayerId, numericShopItemId]
    )

    if (itemResult.rows.length === 0) {
      throw createServiceError("玩家尚未擁有此商品", 404)
    }

    const item = itemResult.rows[0]
    const equipColumn = equipColumnMap[item.type]

    if (!equipColumn) {
      throw createServiceError("此商品類型不可裝備")
    }

    let equippedResult

    try {
      equippedResult = await client.query(
        `INSERT INTO player_equipped_items (player_id, ${equipColumn}, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (player_id)
         DO UPDATE SET ${equipColumn} = EXCLUDED.${equipColumn},
                       updated_at = CURRENT_TIMESTAMP
         RETURNING player_id, avatar_item_id, card_skin_item_id, card_skin_overrides,
                   card_back_item_id, board_skin_item_id, updated_at`,
        [numericPlayerId, numericShopItemId]
      )
    } catch {
      equippedResult = await client.query(
        `INSERT INTO player_equipped_items (player_id, ${equipColumn}, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (player_id)
         DO UPDATE SET ${equipColumn} = EXCLUDED.${equipColumn},
                       updated_at = CURRENT_TIMESTAMP
         RETURNING player_id, avatar_item_id, card_skin_item_id,
                   card_back_item_id, board_skin_item_id, updated_at`,
        [numericPlayerId, numericShopItemId]
      )
    }

    await client.query("COMMIT")

    return mapEquippedItems(equippedResult.rows[0])
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

async function updateCardSkinLoadout({
  playerId,
  cardSkinItemId = null,
  cardSkinOverrides = {},
}) {
  const numericPlayerId = parsePositiveInteger(playerId, "playerId")
  const numericCardSkinItemId =
    cardSkinItemId === null || cardSkinItemId === undefined || cardSkinItemId === ""
      ? null
      : parsePositiveInteger(cardSkinItemId, "cardSkinItemId")
  const normalizedOverrides = sanitizeCardSkinOverrideIds(cardSkinOverrides)
  const overrideItemIds = Object.values(normalizedOverrides)
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    if (numericCardSkinItemId !== null) {
      await validateOwnedCardSkinItems(client, numericPlayerId, [numericCardSkinItemId])
    }

    await validateOwnedCardSkinItems(client, numericPlayerId, overrideItemIds)

    let equippedResult

    try {
      equippedResult = await client.query(
        `INSERT INTO player_equipped_items (
            player_id,
            card_skin_item_id,
            card_skin_overrides,
            updated_at
          )
         VALUES ($1, $2, $3::jsonb, CURRENT_TIMESTAMP)
         ON CONFLICT (player_id)
         DO UPDATE SET card_skin_item_id = EXCLUDED.card_skin_item_id,
                       card_skin_overrides = EXCLUDED.card_skin_overrides,
                       updated_at = CURRENT_TIMESTAMP
         RETURNING player_id, avatar_item_id, card_skin_item_id, card_skin_overrides,
                   card_back_item_id, board_skin_item_id, updated_at`,
        [
          numericPlayerId,
          numericCardSkinItemId,
          JSON.stringify(normalizedOverrides),
        ]
      )
    } catch {
      equippedResult = await client.query(
        `INSERT INTO player_equipped_items (
            player_id,
            card_skin_item_id,
            updated_at
          )
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (player_id)
         DO UPDATE SET card_skin_item_id = EXCLUDED.card_skin_item_id,
                       updated_at = CURRENT_TIMESTAMP
         RETURNING player_id, avatar_item_id, card_skin_item_id,
                   card_back_item_id, board_skin_item_id, updated_at`,
        [numericPlayerId, numericCardSkinItemId]
      )
    }

    await client.query("COMMIT")

    return mapEquippedItems(equippedResult.rows[0])
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

async function unequipShopItem({ playerId, categoryId }) {
  const numericPlayerId = parsePositiveInteger(playerId, "playerId")
  const equipColumn = getEquipColumnByCategory(categoryId)

  if (!equipColumn) {
    throw createServiceError("此項目無法取消套用")
  }

  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    let equippedResult

    try {
      equippedResult = await client.query(
        `INSERT INTO player_equipped_items (player_id, ${equipColumn}, updated_at)
         VALUES ($1, NULL, CURRENT_TIMESTAMP)
         ON CONFLICT (player_id)
         DO UPDATE SET ${equipColumn} = NULL,
                       updated_at = CURRENT_TIMESTAMP
         RETURNING player_id, avatar_item_id, card_skin_item_id, card_skin_overrides,
                   card_back_item_id, board_skin_item_id, updated_at`,
        [numericPlayerId]
      )
    } catch {
      equippedResult = await client.query(
        `INSERT INTO player_equipped_items (player_id, ${equipColumn}, updated_at)
         VALUES ($1, NULL, CURRENT_TIMESTAMP)
         ON CONFLICT (player_id)
         DO UPDATE SET ${equipColumn} = NULL,
                       updated_at = CURRENT_TIMESTAMP
         RETURNING player_id, avatar_item_id, card_skin_item_id,
                   card_back_item_id, board_skin_item_id, updated_at`,
        [numericPlayerId]
      )
    }

    await client.query("COMMIT")

    return mapEquippedItems(equippedResult.rows[0])
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export {
  getShopItems,
  getPlayerItems,
  purchaseShopItem,
  getPlayerEquippedItems,
  equipShopItem,
  unequipShopItem,
  updateCardSkinLoadout,
}
