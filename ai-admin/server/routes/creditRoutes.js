const express = require("express")
const auth = require("../middleware/authMiddleware")
const { getUserBalance, getCreditHistory, addCredit, getAllUsers } = require("../controllers/creditController")

const router = express.Router()

router.get("/user-balance", auth([1, 2]), getUserBalance)
router.get("/users", auth([1, 2]), getAllUsers)
router.get("/history/:username", auth([1, 2]), getCreditHistory)
router.post("/add", auth([1, 2]), addCredit)

module.exports = router
