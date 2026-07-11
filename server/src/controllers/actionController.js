import { drawCardAction, playCardAction } from "../services/gameActionService.js"

async function handlePlayCard(req, res) {
    try {
        const {
            roomCode,
            playerId,
            cardId,
            targetPlayerId,
            guessedCardName,
        } = req.body

        if (!roomCode) {
            return res.status(400).json({ message: "缺少房間代碼" })
        }

        if (!playerId) {
            return res.status(400).json({ message: "缺少玩家ID" })
        }

        if (!cardId) {
            return res.status(400).json({ message: "缺少卡牌ID" })
        }

        const result = await playCardAction({
            roomCode,
            playerId: Number(playerId),
            cardId,
            targetPlayerId,
            guessedCardName,
        })

        return res.status(200).json({
            message: "卡牌效果已執行",
            result: result.result,
            animationResult: result.animationResult,
            showdownResult: result.showdownResult,
            discardedCard: result.discardedCard,
            actionLog: result.actionLog,
            state: result.publicState,
        })
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : "出牌失敗",
            error: error.message,
        })
    }
}

async function handleDrawCard(req, res) {
    try {
        const { roomCode } = req.params
        const { playerId } = req.body

        if (!playerId) {
            return res.status(400).json({ message: "缺少玩家ID" })
        }

        const result = await drawCardAction({
            roomCode,
            playerId: Number(playerId),
        })

        return res.status(200).json({
            message: "抽牌成功",
            drawnCard: result.drawnCard,
            state: result.publicState,
        })
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : "抽牌失敗",
            error: error.message,
        })
    }
}

export { handlePlayCard, handleDrawCard }
