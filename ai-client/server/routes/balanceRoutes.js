const express = require("express")
const router = express.Router()
const auth = require("../middleware/authMiddleware")
const { getBalance, getCreditHistory } = require("../controllers/balanceController")

router.get("/check-balance", auth(["customer"]), getBalance)
router.get("/credit-history", auth(["customer"]), getCreditHistory)

module.exports = router
