const express = require("express")
const router = express.Router()
const auth = require("../middleware/authMiddleware")
const { sendSingleSms, sendBulkSms, sendPersonalizedSms, getSmsStats } = require("../controllers/smsController")

// Single SMS route (existing)
router.post("/send", auth(["customer"]), sendSingleSms)

// Bulk SMS route (with file upload)
router.post("/send-bulk", auth(["customer"]), sendBulkSms)

// Personalized SMS route (with file upload)
router.post("/send-personalized", auth(["customer"]), sendPersonalizedSms)

// SMS Statistics route
router.get("/stats", auth(["customer"]), getSmsStats)

module.exports = router
