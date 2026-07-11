import { getProfile, updateProfile } from "../services/profileService.js"

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

async function handleUpdateProfile(req, res) {
  try {
    const profile = await updateProfile(req.player.id, req.body)

    res.status(200).json({ profile })
  } catch (error) {
    res.status(getErrorStatus(error)).json({
      message: error.message || "更新個人資料失敗"
    })
  }
}

export { handleGetProfile, handleUpdateProfile }
