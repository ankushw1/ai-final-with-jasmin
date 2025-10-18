const express = require("express");
const auth = require("../middleware/authMiddleware");
const { getAllSmsReport, getCustomerSpecificSmsReport, fetchBilling, getAllLoginHistory } = require("../controllers/overAllReportController");

const router = express.Router();

router.get("/overall-reporting", auth([1,4,5]), getAllSmsReport); 

router.get("/customer-reporting/:customerId", auth([1,4,5]), getCustomerSpecificSmsReport); 

router.get('/billing-summary', auth([1,4,5]), fetchBilling);

router.get('/login-history', auth([1,4,5]), getAllLoginHistory);


module.exports = router;