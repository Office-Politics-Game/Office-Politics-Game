import {
  createRoom,
  joinRoom,
  addComputerPlayer,
  updateReady,
  getRoomState,
  kickPlayer,
  startGame,
} from "../services/roomService.js";

function getErrorStatus(error) {
  return error.statusCode || 500;
}

async function handleCreateRoom(req, res) {
  try {
    const { hostPlayerId } = req.body;

    if (!hostPlayerId) {
      return res.status(400).json({ message: "房主ID不存在" });
    }

    const result = await createRoom({ hostPlayerId });

    res.status(201).json(result);
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "建立房間失敗",
      error: error.message,
    });
  }
}

async function handleJoinRoom(req, res) {
  try {
    const { roomCode } = req.params;
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({ message: "缺少玩家ID" });
    }

    await joinRoom({ roomCode, playerId });

    res.status(201).json({ message: "成功加入房間" });
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "加入房間失敗",
      error: error.message,
    });
  }
}

async function handleAddComputerPlayer(req, res) {
  try {
    const { roomCode } = req.params;
    const { hostPlayerId } = req.body;

    if (!hostPlayerId) {
      return res.status(400).json({ message: "缺少房主玩家 ID" });
    }

    const roomState = await addComputerPlayer({ roomCode, hostPlayerId });

    res.status(201).json(roomState);
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "Add computer player failed",
      error: error.message,
    });
  }
}

async function handleUpdateReady(req, res) {
  try {
    const { roomCode } = req.params;
    const { playerId, isReady } = req.body;

    if (!playerId || typeof isReady !== "boolean") {
      return res.status(400).json({ message: "缺少玩家ID或玩家尚未完成準備" });
    }

    await updateReady({ roomCode, playerId, isReady });

    res.status(200).json({ message: "玩家已完成準備狀態" });
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "玩家準備狀態變更失敗",
      error: error.message,
    });
  }
}

async function handleGetRoomState(req, res) {
  try {
    const { roomCode } = req.params;

    const roomState = await getRoomState({ roomCode });

    res.status(200).json(roomState);
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "取得房間狀態失敗",
      error: error.message,
    });
  }
}

async function handleKickPlayer(req, res) {
  try {
    const { roomCode, targetPlayerId } = req.params;
    const { requesterPlayerId } = req.body;
    const numericRequesterPlayerId = Number(requesterPlayerId);
    const numericTargetPlayerId = Number(targetPlayerId);

    if (
      !Number.isInteger(numericRequesterPlayerId) ||
      numericRequesterPlayerId <= 0 ||
      !Number.isInteger(numericTargetPlayerId) ||
      numericTargetPlayerId <= 0
    ) {
      return res.status(400).json({ message: "缺少或無效的玩家ID" });
    }

    const roomState = await kickPlayer({
      roomCode,
      requesterPlayerId: numericRequesterPlayerId,
      targetPlayerId: numericTargetPlayerId,
    });

    return res.status(200).json({
      message: "玩家已移出房間",
      roomState,
    });
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "移出玩家失敗",
      error: error.message,
    });
  }
}

async function handleStartGame(req, res) {
  try {
    const { roomCode } = req.params;
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({ message: "缺少玩家ID" });
    }

    await startGame({ roomCode, playerId });

    res.status(201).json({ message: "開始遊戲" });
  } catch (error) {
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "開始遊戲失敗",
      error: error.message,
    });
  }
}

export {
  handleCreateRoom,
  handleJoinRoom,
  handleAddComputerPlayer,
  handleUpdateReady,
  handleGetRoomState,
  handleKickPlayer,
  handleStartGame,
};
