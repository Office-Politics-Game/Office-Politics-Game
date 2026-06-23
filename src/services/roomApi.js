const ROOM_API_PATH = "/api/rooms";

function getTrimmedRoomCode(roomCode) {
  return typeof roomCode === "string" ? roomCode.trim() : "";
}

function buildRoomPath(roomCode, action) {
  const normalizedRoomCode = getTrimmedRoomCode(roomCode);

  if (!normalizedRoomCode) {
    throw new Error("roomCode 為必填");
  }

  return `${ROOM_API_PATH}/${encodeURIComponent(normalizedRoomCode)}/${action}`;
}

async function requestRoomApi(path, options) {
  let response;

  try {
    response = await fetch(path, options);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "無法連線到伺服器");
  }

  let data = null;
  const contentType = response.headers.get("content-type") || "";
  const isJsonResponse = contentType.includes("application/json");

  if (response.status !== 204 && isJsonResponse) {
    try {
      data = await response.json();
    } catch {
      const error = new Error("伺服器回傳格式錯誤");
      error.status = response.status;
      throw error;
    }
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || data?.error || `API請求失敗 (${response.status})`,
    );

    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function createRequestOptions(method, payload) {
  const options = { method };

  if (payload !== undefined) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(payload);
  }

  return options;
}

function createRoom(payload) {
  return requestRoomApi(
    ROOM_API_PATH,
    createRequestOptions("POST", payload),
  );
}

function joinRoom(roomCode, payload) {
  return requestRoomApi(
    buildRoomPath(roomCode, "join"),
    createRequestOptions("POST", payload),
  );
}

function getRoomState(roomCode) {
  return requestRoomApi(
    `${ROOM_API_PATH}/${encodeURIComponent(roomCode)}/state`,
    createRequestOptions("GET"),
  );
}

function updateRoomState(roomCode, payload) {
  return requestRoomApi(
    buildRoomPath(roomCode, "state"),
    createRequestOptions("PATCH", payload),
  );
}

function startRoom(roomCode, payload) {
  return requestRoomApi(
    buildRoomPath(roomCode, "start"),
    createRequestOptions("POST", payload),
  );
}

function getRoomGameState(roomCode, playerId) {
  const query = new URLSearchParams({ playerId: String(playerId) });

  return requestRoomApi(
    `${GAME_STATE_API_PATH}/room/${encodeURIComponent(roomCode)}?${query.toString()}`,
    createRequestOptions("GET"),
  );
}

export {
  createRoom,
  joinRoom,
  getRoomState,
  getRoomGameState,
  updateRoomState,
  startRoom,
};
