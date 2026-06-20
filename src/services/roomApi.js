const ROOM_API_PATH = "/api/rooms";

async function requestRoomApi(path, options) {
  let response;

  try {
    response = await fetch(path, options);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "無法連線至伺服器");
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    // Some successful responses may not contain a JSON body.
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || data?.error || `API 請求失敗（${response.status}）`,
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

/**
 * 建立遊戲房間。
 * payload 為選填，可用來傳入後端目前需要的 hostPlayerId。
 */
function createRoom(payload) {
  return requestRoomApi(
    ROOM_API_PATH,
    createRequestOptions("POST", payload),
  );
}

/** 加入指定遊戲房間。 */
function joinRoom(roomCode, payload) {
  return requestRoomApi(
    `${ROOM_API_PATH}/${encodeURIComponent(roomCode)}/join`,
    createRequestOptions("POST", payload),
  );
}

/** 更新玩家在房間內的準備狀態。 */
function updateRoomState(roomCode, payload) {
  return requestRoomApi(
    `${ROOM_API_PATH}/${encodeURIComponent(roomCode)}/state`,
    createRequestOptions("PATCH", payload),
  );
}

/** 開始指定房間的遊戲。 */
function startRoom(roomCode, payload) {
  return requestRoomApi(
    `${ROOM_API_PATH}/${encodeURIComponent(roomCode)}/start`,
    createRequestOptions("POST", payload),
  );
}

export { createRoom, joinRoom, updateRoomState, startRoom };
