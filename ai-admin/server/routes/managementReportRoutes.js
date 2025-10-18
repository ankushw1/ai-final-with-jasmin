const express = require("express");
const auth = require("../middleware/authMiddleware");
const { getAllManagementSmsReport } = require("../controllers/managementReportController");

const router = express.Router();

router.get("/management-reporting", auth([4]), getAllManagementSmsReport); 

module.exports = router;
