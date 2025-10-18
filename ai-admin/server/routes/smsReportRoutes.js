const express = require('express');
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getSmsReport, getSmsStatusCount } = require('../controllers/smsReportController');

// POST request to send a single SMS (Authenticated route)
router.get('/sms-report', auth(["customer"]), getSmsReport);

router.get('/sms-report-dashboard', auth(["customer"]), getSmsStatusCount);


module.exports = router;
