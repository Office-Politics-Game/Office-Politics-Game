import { getPlayerAchievements } from "../services/achievementService.js"

function getErrorStatus(error) {
    return error.statusCode || 500
}

async function handleGetPlayerAchievements(req, res) {
    try {
        const achievements = await getPlayerAchievements(req.params.playerId)

        return res.status(200).json(achievements)
    } catch (error) {
        return res.status(getErrorStatus(error)).json({
            message: error.statusCode ? error.message : "取得玩家成就失敗",
            error: error.message,
        })
    }
}

export { handleGetPlayerAchievements }
