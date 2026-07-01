import express from "express"
import {
  handleCreateGuest,
  handleSearchPlayers,
} from "../controllers/playerController.js"

const router = express.Router()

router.get("/search", handleSearchPlayers)
router.post("/guest", handleCreateGuest)

export { router }
