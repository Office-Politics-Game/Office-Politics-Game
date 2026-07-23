const DEFAULT_ERROR_MESSAGE = "操作失敗，請稍後再試"

const KNOWN_ENGLISH_ERROR_MESSAGES = new Map([
  ["add computer player failed", "加入電腦玩家失敗"],
  ["api request failed", "系統暫時無法完成操作，請稍後再試"],
  ["create cloudinary signature failed", "建立圖片上傳驗證失敗，請稍後再試"],
  ["currency balance already reached max", "遊戲幣已達上限"],
  ["deck is empty", "牌庫已經沒有剩餘卡牌"],
  ["draw card response did not include a card", "抽牌回應缺少卡牌資料"],
  ["failed to draw card", "抽牌失敗"],
  ["failed to fetch game logs", "取得遊戲紀錄失敗"],
  ["failed to fetch game result", "取得遊戲結果失敗"],
  ["failed to load game state", "載入遊戲狀態失敗"],
  ["failed to load owned cards", "讀取已擁有卡牌失敗"],
  ["failed to play card", "出牌失敗"],
  ["game stage draw animation is unavailable", "抽牌動畫尚未準備完成"],
  ["game session not found", "找不到遊戲房間"],
  ["game state must contain exactly four players", "遊戲狀態必須包含四位玩家"],
  ["game state response did not include state", "遊戲狀態回應缺少狀態資料"],
  ["get cloudinary config failed", "取得圖片上傳資料失敗，請稍後再試"],
  ["invalid achievement code", "成就代號無效"],
  ["invalid avatar id", "頭像資料不正確"],
  ["invalid computer turn readiness reason", "電腦玩家回合狀態不正確"],
  ["invalid ecpay checkmacvalue", "綠界驗證資料不正確"],
  ["invalid login credentials", "帳號或密碼錯誤"],
  ["invalid player id", "玩家資料不正確"],
  ["invalid pool id", "抽卡池資料不正確"],
  ["keyword is required", "請輸入搜尋關鍵字"],
  ["missing roomcode or playerid", "缺少房間代碼或玩家資料"],
  ["network request failed", "無法連線到伺服器，請檢查網路後再試"],
  ["not this player's turn", "還沒輪到這位玩家"],
  [
    "only eliminated players in a one-human computer room can skip ahead",
    "只有已淘汰玩家可以略過電腦回合",
  ],
  ["player not found", "找不到玩家資料"],
  ["socket request failed", "即時連線失敗，請稍後再試"],
  ["update card skin loadout failed", "更新卡面配置失敗"],
  ["username already exists", "暱稱已被使用"],
])

function normalizeMessageKey(message) {
  return String(message ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.。]+$/g, "")
    .toLowerCase()
}

function hasChineseText(message) {
  return /[\u3400-\u9fff]/.test(String(message ?? ""))
}

function hasEnglishText(message) {
  return /[A-Za-z]/.test(String(message ?? ""))
}

function extractErrorMessage(error) {
  if (typeof error === "string") {
    return error
  }

  return (
    error?.data?.message ||
    error?.data?.error ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    ""
  )
}

function translateKnownEnglishMessage(message) {
  const normalizedMessage = normalizeMessageKey(message)

  if (KNOWN_ENGLISH_ERROR_MESSAGES.has(normalizedMessage)) {
    return KNOWN_ENGLISH_ERROR_MESSAGES.get(normalizedMessage)
  }

  const apiStatusMatch = normalizedMessage.match(/^api request failed \((\d{3})\)$/)

  if (apiStatusMatch) {
    return `系統暫時無法完成操作，請稍後再試（${apiStatusMatch[1]}）`
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "Email尚未完成驗證，請先到信箱完成驗證"
  }

  if (normalizedMessage.includes("rate limit")) {
    return "操作太頻繁，請稍後再試"
  }

  if (normalizedMessage.includes("jwt") || normalizedMessage.includes("token")) {
    return "登入狀態已失效，請重新登入"
  }

  if (normalizedMessage.includes("cloudinary")) {
    return "圖片服務暫時無法使用，請稍後再試"
  }

  return ""
}

function getDisplayErrorMessage(error, fallbackMessage = DEFAULT_ERROR_MESSAGE) {
  const fallback = String(fallbackMessage || DEFAULT_ERROR_MESSAGE)
  const rawMessage = String(extractErrorMessage(error) || "").trim()

  if (!rawMessage) {
    return fallback
  }

  const translatedMessage = translateKnownEnglishMessage(rawMessage)

  if (translatedMessage) {
    return translatedMessage
  }

  if (hasChineseText(rawMessage)) {
    return rawMessage
  }

  if (hasEnglishText(rawMessage)) {
    return fallback
  }

  return rawMessage || fallback
}

export { getDisplayErrorMessage }
