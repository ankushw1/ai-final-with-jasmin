const express = require("express")
const router = express.Router()
const auth = require("../middleware/authMiddleware")
const {
  getRealTimeStats,
  getHourlyDistribution,
  getDailyPerformance,
  getComparativeAnalytics,
  getDailyReportData,
  getAllSmsData,
} = require("../controllers/dashbaordController")

// Real-time statistics
router.get("/real-time-stats", auth(["customer"]), getRealTimeStats)

// Hourly distribution
router.get("/hourly-distribution", auth(["customer"]), getHourlyDistribution)

// Daily performance
router.get("/daily-performance", auth(["customer"]), getDailyPerformance)

// Comparative analytics
router.get("/comparative-analytics", auth(["customer"]), getComparativeAnalytics)

// Daily report data
router.get("/daily-report-data", auth(["customer"]), getDailyReportData)

// Debug endpoint
router.get("/debug", auth(["customer"]), getAllSmsData)

module.exports = router
