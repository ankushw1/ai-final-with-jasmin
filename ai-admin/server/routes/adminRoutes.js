const express = require("express");
const { adminLogin, createAdmin, updateAdmin, deleteAdmin, getAllAdmins, checkTokenExpiry } = require("../controllers/adminController");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// Login Admin (No role check required for login)
router.post("/login", adminLogin);
router.get("/check-token", checkTokenExpiry); 

// Admin CRUD (protected routes)
router.post("/create", createAdmin); // Only admins can create new admin
router.put("/:id", auth([1]), updateAdmin); // Only admins can update admin
router.delete("/:id", auth([1]), deleteAdmin); // Only admins can delete admin
router.get("/all", auth([1]), getAllAdmins); // Only admins can fetch all admins

module.exports = router;
