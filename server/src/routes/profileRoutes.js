import express from "express"
import { handleGetProfile } from "../controllers/profileController.js"

const router = express.Router()

router.get("/", handleGetProfile)

export { router }
