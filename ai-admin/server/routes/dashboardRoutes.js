const express = require("express")
const router = express.Router()
const dashboardController = require("../controllers/dasbhoardController")
const auth = require("../middleware/authMiddleware")

// Dashboard routes - Allow access for admin (1), reseller (2), customer (3), account manager (4), support (5)
router.get("/stats", auth([1, 2, 3, 4, 5]), dashboardController.getDashboardStats)
router.get("/user-details/:userId", auth([1, 2, 4, 5]), dashboardController.getUserDetails)
router.get("/status-updates", auth([1, 2, 3, 4, 5]), dashboardController.getStatusUpdates)

// Add this route after the existing routes
router.get("/gateway-details", auth([1, 2, 3, 4, 5]), dashboardController.getGatewayDetails)

module.exports = router
