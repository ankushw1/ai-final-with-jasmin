const express = require('express');
const { getCurrentUser } = require('../controllers/authController');
const auth = require('../middleware/authMiddleware'); // Middleware to verify token
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

// Get current user details (protected route)
router.get('/me', authenticate([]), getCurrentUser);  // No role restriction

module.exports = router;
