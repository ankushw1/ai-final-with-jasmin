const express = require("express");
const {
  customerLogin,
  verifyOTPAndResetPassword,
  requestPasswordReset,
  changePassword,
  checkTokenExpiry,
} = require("../controllers/customerController");

const router = express.Router();

router.post("/login", customerLogin); 

router.post("/verify-reset", verifyOTPAndResetPassword); 

router.post("/request-password", requestPasswordReset); 

router.get("/check-token", checkTokenExpiry); 

module.exports = router;
