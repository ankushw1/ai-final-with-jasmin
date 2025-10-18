const express = require('express');
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getSmsReport, getSmsStatusCount, fetchBilling } = require('../controllers/reportcontroller');
const { changePassword } = require('../controllers/customerController');

router.get('/sms-report', auth(["customer"]), getSmsReport);
router.get('/sms-report-dashboard', auth(["customer"]), getSmsStatusCount);
router.get('/billing-summary', auth(["customer"]), fetchBilling);
router.post("/change-password", auth(["customer"]), changePassword); 

module.exports = router;
