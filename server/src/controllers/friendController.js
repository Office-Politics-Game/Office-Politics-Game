import {
  acceptFriendRequest,
  blockPlayer,
  getBlockedPlayers,
  getFriends,
  getReceivedFriendRequests,
  getSentFriendRequests,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
  unblockPlayer,
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

async function handleRemoveFriend(req, res){
  try {
    const body = req.body ?? {}
    const friendshipId = parsePositiveInteger(req.params.id)
    const playerId = parsePositiveInteger(body.playerId ?? req.query.playerId)

    if (!friendshipId || !playerId){
      return res.status(400).json({ message: "缺少好友關係ID或玩家ID" })
    }

    const friendship = await removeFriend({ friendshipId, playerId })

    return res.status(200).json({
      message: "已解除好友",
      friendship,
    })
  } catch (error){
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "解除好友失敗",
      error: error.message,
    })
  }
}

async function handleBlockPlayer(req, res){
  try {
    const body = req.body ?? {}
    const playerId = parsePositiveInteger(body.playerId)
    const targetPlayerId = parsePositiveInteger(
      body.targetPlayerId ?? body.friendId
    )

    if (!playerId || !targetPlayerId){
      return res.status(400).json({ message: "缺少玩家ID或封鎖對象ID" })
    }

    const block = await blockPlayer({ playerId, targetPlayerId })

    return res.status(200).json({
      message: "已封鎖玩家",
      block,
    })
  } catch (error){
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "封鎖玩家失敗",
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

async function handleGetBlockedPlayers(req, res){
  try {
    const playerId = parsePositiveInteger(req.query.playerId)

    if (!playerId){
      return res.status(400).json({ message: "缺少玩家ID" })
    }

    const blockedPlayers = await getBlockedPlayers({ playerId })

    return res.status(200).json({ blockedPlayers })
  } catch (error){
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "取得封鎖名單失敗",
      error: error.message,
    })
  }
}

async function handleUnblockPlayer(req, res){
  try {
    const body = req.body ?? {}
    const blockId = parsePositiveInteger(req.params.id)
    const playerId = parsePositiveInteger(body.playerId)

    if (!blockId || !playerId){
      return res.status(400).json({ message: "缺少封鎖關係ID或玩家ID" })
    }

    const block = await unblockPlayer({ blockId, playerId })

    return res.status(200).json({
      message: "已取消封鎖",
      block,
    })
  } catch (error){
    return res.status(getErrorStatus(error)).json({
      message: error.statusCode ? error.message : "取消封鎖失敗",
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
  handleBlockPlayer,
  handleGetBlockedPlayers,
  handleGetFriends,
  handleGetReceivedFriendRequests,
  handleGetSentFriendRequests,
  handleRemoveFriend,
  handleRejectFriendRequest,
  handleSendFriendRequest,
  handleUnblockPlayer,
}
