import {
  getProfile,
  getProfileMatches,
  setProfileTitle,
  updateProfile,
} from "../services/profileService.js"
import { getSocketServer } from "../socket/index.js"

function getErrorStatus(error) {
  return error.statusCode || 500
}

async function handleGetProfile(req, res) {
  try {
    const profile = await getProfile(req.player.id)

    res.status(200).json({ profile })
  } catch (error) {
    res.status(getErrorStatus(error)).json({
      message: error.message || "取得個人資料失敗",
    })
  }
}

async function handleSetProfileTitle(req, res) {
  try {
    const profile = await setProfileTitle(req.player.id, req.body?.achievementCode)

    getSocketServer()?.emit("player:title-updated", {
      playerId: profile.id,
      title: profile.title || "",
    })

    res.status(200).json({ profile })
  } catch (error) {
    res.status(getErrorStatus(error)).json({
      message: error.message || "稱號設定失敗",
    })
  }
}

async function handleUpdateProfile(req, res) {
  try {
    const profile = await updateProfile(req.player.id, req.body)

    res.status(200).json({ profile })
  } catch (error) {
    res.status(getErrorStatus(error)).json({
      message: error.message || "更新個人資料失敗",
    })
  }
}

async function handleGetProfileMatches(req, res) {
  try {
    const matches = await getProfileMatches(req.player.id, req.query)

    res.status(200).json({ matches })
  } catch (error) {
    res.status(getErrorStatus(error)).json({
      message: error.message || "取得對戰紀錄失敗",
    })
  }
}

export {
  handleGetProfile,
  handleGetProfileMatches,
  handleSetProfileTitle,
  handleUpdateProfile,
}
