import express from "express"
import {
  handleGetTopUpPackages,
  handleCreateTopUpOrder,
  handleMockPayTopUpOrder,
  handleCreateEcpayCheckout,
} from "../controllers/topUpController.js"

const router = express.Router()

router.get("/packages", handleGetTopUpPackages)
router.post("/orders", handleCreateTopUpOrder)
router.post("/orders/:orderId/ecpay-checkout", handleCreateEcpayCheckout)
router.post("/orders/:orderId/mock-pay", handleMockPayTopUpOrder)

export default router