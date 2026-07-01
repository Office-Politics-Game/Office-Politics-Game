import {
  acceptFriendRequest,
  getFriends,
  getReceivedFriendRequests,
  getSentFriendRequests,
  rejectFriendRequest,
  sendFriendRequest,
} from "../services/friendService.js"

function getErrorStatus(error){
  return error.statusCode || 500
}

function parsePositiveInteger(value){
  const numberValue = Number(value)

  if (!Number.isInteger(numberValue) || numberValue <= 0){
    return null
  }

  return numberValue
}

async function handleSendFriendRequest(req, res){
  try {
    const body = req.body ?? {}
    const playerId = parsePositiveInteger(body.playerId)
    const targetPlayerId = parsePositiveInteger(
      body.targetPlayerId ?? body.friendId
    )

    if (!playerId || !targetPlayerId){
      return res.status(400).json({ message: "缺少玩家ID或邀請對象ID" })
    }

    const request = await sendFriendRequest({ playerId, targetPlayerId })

    return res.status(201).json({ request })
  } catch (error){
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "送出好友邀請失敗",
      error: error.message,
    })
  }
}

async function handleGetReceivedFriendRequests(req, res){
  try {
    const playerId = parsePositiveInteger(req.query.playerId)

    if (!playerId){
      return res.status(400).json({ message: "缺少玩家ID" })
    }

    const requests = await getReceivedFriendRequests({ playerId })

    return res.status(200).json({ requests })
  } catch (error){
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "取得收到的好友邀請失敗",
      error: error.message,
    })
  }
}

async function handleGetSentFriendRequests(req, res){
  try {
    const playerId = parsePositiveInteger(req.query.playerId)

    if (!playerId){
      return res.status(400).json({ message: "缺少玩家ID" })
    }

    const requests = await getSentFriendRequests({ playerId })

    return res.status(200).json({ requests })
  } catch (error){
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "取得送出的好友邀請失敗",
      error: error.message,
    })
  }
}

async function handleAcceptFriendRequest(req, res){
  try {
    const body = req.body ?? {}
    const requestId = parsePositiveInteger(req.params.id)
    const playerId = parsePositiveInteger(body.playerId)

    if (!requestId || !playerId){
      return res.status(400).json({ message: "缺少好友邀請ID或玩家ID" })
    }

    const request = await acceptFriendRequest({ requestId, playerId })

    return res.status(200).json({
      message: "已接受好友邀請",
      request,
    })
  } catch (error){
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "接受好友邀請失敗",
      error: error.message,
    })
  }
}

async function handleRejectFriendRequest(req, res){
  try {
    const body = req.body ?? {}
    const requestId = parsePositiveInteger(req.params.id)
    const playerId = parsePositiveInteger(body.playerId)

    if (!requestId || !playerId){
      return res.status(400).json({ message: "缺少好友邀請ID或玩家ID" })
    }

    const request = await rejectFriendRequest({ requestId, playerId })

    return res.status(200).json({
      message: "已拒絕好友邀請",
      request,
    })
  } catch (error){
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "拒絕好友邀請失敗",
      error: error.message,
    })
  }
}

async function handleGetFriends(req, res){
  try {
    const playerId = parsePositiveInteger(req.query.playerId)

    if (!playerId){
      return res.status(400).json({ message: "缺少玩家ID" })
    }

    const friends = await getFriends({ playerId })

    return res.status(200).json({ friends })
  } catch (error){
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "取得好友列表失敗",
      error: error.message,
    })
  }
}

export {
  handleAcceptFriendRequest,
  handleGetFriends,
  handleGetReceivedFriendRequests,
  handleGetSentFriendRequests,
  handleRejectFriendRequest,
  handleSendFriendRequest,
}
