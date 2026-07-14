import { getCurrentProfile } from "../services/profileService.js"

function getBearerToken(req) {
  const authorization = req.headers.authorization || ""

  if (!authorization.startsWith("Bearer ")) {
    return ""
  }

  return authorization.replace("Bearer ", "").trim()
}

async function handleGetProfile(req, res) {
  try {
    const token = getBearerToken(req)
    const profile = await getCurrentProfile(token)

    res.status(200).json({ profile })
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "取得個人資料失敗",
    })
  }
}

export { handleGetProfile }
