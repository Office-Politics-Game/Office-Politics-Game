const ROOM_API_PATH = "/api/rooms"
const PLAYER_API_PATH = "/api/players"

async function requestApi(path, options){
    let response

    try {
        response = await fetch(path, options)
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : "無法連線至伺服器")
    }

    const data = await response.json().catch(() => null)

    if (!response.ok) {
        const apiError = new Error(
        data?.message || data?.error || `API 請求失敗（${response.status}）`,
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

function createGuestPlayer(payload) {
    return requestApi(
        `${PLAYER_API_PATH}/guest`,
        createRequestOptions("POST", payload),
    )
}

function getRoomState(roomCode, payload) {
    const queryParams = new URLSearchParams()

    if (payload) {
        Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                queryParams.append(key, value)
            }
        })
    }

    const queryString = queryParams.toString()
    const path = `${ROOM_API_PATH}/${encodeURIComponent(roomCode)}/state${queryString ? `?${queryString}` : ""}`

    return requestApi(path, createRequestOptions("GET"))
}

export { getRoomState, createGuestPlayer }