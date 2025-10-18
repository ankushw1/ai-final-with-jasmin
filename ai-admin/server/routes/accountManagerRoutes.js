// accountRoutes.js
const express = require('express');
const router = express.Router();
const {
    createAccount,
    getAllAccounts,
    updateAccount,
    deleteAccount,
  } = require("../controllers/accountManagerController");
  const auth = require("../middleware/authMiddleware");

// Only Admin can create accounts
router.post('/create', auth([1]), createAccount);
router.get('/', auth([1]), getAllAccounts);
router.put('/:id', auth([1]), updateAccount);
router.delete('/:id', auth([1]), deleteAccount);

module.exports = router;