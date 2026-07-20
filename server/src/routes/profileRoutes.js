import express from "express"
import {
  handleGetProfile,
  handleGetProfileMatches,
  handleSetProfileTitle,
  handleUpdateProfile,
} from "../controllers/profileController.js"
import { requireMemberAuth } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.get("/", requireMemberAuth, handleGetProfile)
router.patch("/", requireMemberAuth, handleUpdateProfile)
router.patch("/title", requireMemberAuth, handleSetProfileTitle)
router.get("/matches", requireMemberAuth, handleGetProfileMatches)

export { router }
