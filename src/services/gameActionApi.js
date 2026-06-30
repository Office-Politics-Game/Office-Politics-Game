const ACTION_API_PATH = "/api/actions"
const ROOM_API_PATH = "/api/rooms"

async function parseJsonResponse(response) {
  return response.json().catch(() => null)
}

async function requestGameActionApi(path, options) {
  let response

  try {
    response = await fetch(path, options)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Network request failed")
  }

  const data = await parseJsonResponse(response)

  if (!response.ok) {
    const apiError = new Error(
      data?.message || data?.error || `API request failed (${response.status})`,
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
    `/api/game-states/room/${encodeURIComponent(roomCode)}?${query.toString()}`,
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
