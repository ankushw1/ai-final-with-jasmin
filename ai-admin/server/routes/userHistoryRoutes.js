const express = require("express")
const auth = require("../middleware/authMiddleware")
const {
  getUserUpdateHistory,
  getUserProfile,
  getAllUserProfiles,
  syncUserFromJasmin,
} = require("../controllers/userHistoryController")

const router = express.Router()

router.get("/history/:username", auth([1, 2]), getUserUpdateHistory)
router.get("/history", auth([1, 2]), getUserUpdateHistory) // Get all history
router.get("/profile/:username", auth([1, 2]), getUserProfile)
router.get("/profiles", auth([1, 2]), getAllUserProfiles)
router.post("/sync/:username", auth([1, 2]), syncUserFromJasmin)

module.exports = router
