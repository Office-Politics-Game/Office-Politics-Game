import { API_BASE_URL } from "./apiClient.js"
import { getDisplayErrorMessage } from "@/utils/errorMessages.js"

const ACTION_API_PATH = `${API_BASE_URL}/actions`
const GAME_STATE_API_PATH = `${API_BASE_URL}/game-states`
const ROOM_API_PATH = `${API_BASE_URL}/rooms`

async function parseJsonResponse(response) {
  return response.json().catch(() => null)
}

async function requestGameActionApi(path, options) {
  let response

  try {
    response = await fetch(path, options)
  } catch (error) {
    throw new Error(getDisplayErrorMessage(error, "無法連線到伺服器，請檢查網路後再試"))
  }

  const data = await parseJsonResponse(response)

  if (!response.ok) {
    const apiError = new Error(
      getDisplayErrorMessage(
        { data, message: `API request failed (${response.status})` },
        `系統暫時無法完成操作，請稍後再試（${response.status}）`,
      ),
    )

    apiError.status = response.status
    apiError.data = data
    throw apiError
  }

  return data
}

function createRequestOptions(method, payload) {
  const options = { method }

  if (payload !== undefined) {
    options.headers = { "Content-Type": "application/json" }
    options.body = JSON.stringify(payload)
  }

  return options
}

function buildQuery(payload = {}) {
  const queryParams = new URLSearchParams()

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, String(value))
    }
  })

  const queryString = queryParams.toString()

  return queryString ? `?${queryString}` : ""
}

function drawCard(roomCode, payload) {
  return requestGameActionApi(
    `${ROOM_API_PATH}/${encodeURIComponent(roomCode)}/actions/draw-card`,
    createRequestOptions("POST", payload),
  )
}

function getRoomGameState(roomCode, playerId) {
  const query = new URLSearchParams({ playerId: String(playerId) })

  return requestGameActionApi(
    `${GAME_STATE_API_PATH}/room/${encodeURIComponent(roomCode)}?${query.toString()}`,
    createRequestOptions("GET"),
  )
}

function getGameLogs(roomCode, payload = {}) {
  return requestGameActionApi(
    `${ROOM_API_PATH}/${encodeURIComponent(roomCode)}/logs${buildQuery(payload)}`,
    createRequestOptions("GET"),
  )
}

function getGameResult(roomCode, payload = {}) {
  return requestGameActionApi(
    `${ROOM_API_PATH}/${encodeURIComponent(roomCode)}/result${buildQuery(payload)}`,
    createRequestOptions("GET"),
  )
}

function playCard(roomCode, payload) {
  return requestGameActionApi(
    `${ACTION_API_PATH}/play-card`,
    createRequestOptions("POST", {
      roomCode,
      ...payload,
    }),
  )
}

export { drawCard, getGameLogs, getGameResult, getRoomGameState, playCard }
