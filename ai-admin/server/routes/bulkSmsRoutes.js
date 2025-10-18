const express = require('express');
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { sendBulkSms } = require('../controllers/bulkSMSController');

// POST request to send a single SMS (Authenticated route)
router.post('/send', auth(["customer"]), sendBulkSms);

module.exports = router;
