// accountRoutes.js
const express = require('express');
const router = express.Router();
const {
    createAccount,
    getAllAccounts,
    updateAccount,
    deleteAccount,
    supportLogin,
    checkTokenExpiry,
  } = require("../controllers/supportController");
  const auth = require("../middleware/authMiddleware");

// Only Admin can create accounts
router.get("/check-token", checkTokenExpiry); 

router.post('/create', auth([1]), createAccount);
router.get('/', auth([1]), getAllAccounts);
router.put('/:id', auth([1]), updateAccount);
router.delete('/:id', auth([1]), deleteAccount);
router.post('/login',supportLogin);


module.exports = router;