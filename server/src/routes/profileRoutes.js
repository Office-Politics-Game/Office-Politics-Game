import express from "express"
import {
  handleGetProfile,
  handleSetProfileTitle,
} from "../controllers/profileController.js"

const router = express.Router()

router.get("/", handleGetProfile)
router.patch("/title", handleSetProfileTitle)

export { router }
