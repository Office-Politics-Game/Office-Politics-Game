import express from "express"
import {
  handleGetProfile,
  handleGetProfileMatches,
  handleSetProfileTitle,
  handleUpdateProfile,
} from "../controllers/profileController.js"
import { requireAuth } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.get("/", requireAuth, handleGetProfile)
router.patch("/", requireAuth, handleUpdateProfile)
router.patch("/title", requireAuth, handleSetProfileTitle)
router.get("/matches", requireAuth, handleGetProfileMatches)

export { router }
