// accountRoutes.js
const express = require('express');
const router = express.Router();
const {
    createAccount,
    getAllAccounts,
    updateAccount,
    deleteAccount,
    managementLogin,
    checkTokenExpiry,
  } = require("../controllers/managementController");
  const auth = require("../middleware/authMiddleware");

// Only Admin can create accounts
router.post('/create', auth([1]), createAccount);
router.get('/', auth([1]), getAllAccounts);
router.put('/:id', auth([1]), updateAccount);
router.delete('/:id', auth([1]), deleteAccount);
router.post('/login',managementLogin);
router.get("/check-token", checkTokenExpiry); 

module.exports = router;