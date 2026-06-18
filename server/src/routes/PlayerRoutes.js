import express from "express"
import { handleCreateGuest } from "../controllers/PlayerController.js"

const router = express.Router()

router.post("/guest", handleCreateGuest)

export { router }
