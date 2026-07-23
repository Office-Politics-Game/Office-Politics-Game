import express from "express"
import {
  handleGetTopUpPackages,
  handleCreateTopUpOrder,
  handleMockPayTopUpOrder,
  handleCreateEcpayCheckout,
  handleEcpayReturn,
} from "../controllers/topUpController.js"
import { requireMemberAuth } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.get("/packages", requireMemberAuth, handleGetTopUpPackages)
router.post("/orders", requireMemberAuth, handleCreateTopUpOrder)
router.post("/orders/:orderId/ecpay-checkout", requireMemberAuth, handleCreateEcpayCheckout)
router.post("/orders/:orderId/mock-pay", requireMemberAuth, handleMockPayTopUpOrder)
router.post("/ecpay/return", handleEcpayReturn)

export default router
