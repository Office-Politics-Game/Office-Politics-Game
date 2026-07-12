import express from "express"
import { handleGetProfile, handleUpdateProfile, handleGetProfileMatches } from "../controllers/profileController.js"
import { requireAuth } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.get("/", requireAuth, handleGetProfile)
router.patch("/", requireAuth, handleUpdateProfile)
router.get("/matches", requireAuth, handleGetProfileMatches)

export { router }
