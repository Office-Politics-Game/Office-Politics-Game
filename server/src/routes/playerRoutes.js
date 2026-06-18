import express from "express"
import { handleCreateGuest } from "../controllers/playerController.js"

const router = express.Router()

router.post("/guest", handleCreateGuest)

export { router }
