const express = require("express");
const {
  createReseller,
  getAllResellers,
  updateReseller,
  deleteReseller,
  resellerLogin,
} = require("../controllers/resellerController");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// Reseller CRUD routes
router.post("/login", resellerLogin); // Add this line for login
router.post("/", auth([1]), createReseller); // Only Admin can create Resellers
router.get("/", auth([1]), getAllResellers); // Admin and Reseller can view resellers
router.put("/:id", auth([1]), updateReseller); // Admin and Reseller can update resellers (Reseller can update only their own)
router.delete("/:id", auth([1]), deleteReseller); // Only Admin can delete Resellers

module.exports = router;
