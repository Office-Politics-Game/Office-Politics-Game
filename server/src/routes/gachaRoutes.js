import express from "express"
import { handleDrawGacha, handleGetOwnedGachaCards } from "../controllers/gachaController.js"

const router = express.Router()

router.get("/owned-cards", handleGetOwnedGachaCards)
router.post("/draw", handleDrawGacha)

export { router }
