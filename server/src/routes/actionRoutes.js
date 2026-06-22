import express from "express"
import { handlePlayCard } from "../controllers/actionController.js"

const router = express.Router()
router.post("/play-card", handlePlayCard)
export { router }