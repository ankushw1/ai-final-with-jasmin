const express = require("express");
const {
  createCustomer,
  getAllCustomers,
  updateCustomer,
  deleteCustomer,
  customerLogin,
} = require("../controllers/customerController");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// Customer CRUD routes
router.post("/login", customerLogin); // Admin and Reseller can create Customers
router.post("/", auth([1, 2,5]), createCustomer); // Admin and Reseller can create Customers
router.get("/", auth([1,4,5]), getAllCustomers); // Admin and Reseller can view customers (filtered by role)
router.put("/:id", auth([1, 2,5]), updateCustomer); // Admin and Reseller can update customers (Reseller can update only their own)
router.delete("/:id", auth([1, 2,5]), deleteCustomer); // Admin and Reseller can delete customers (Reseller can delete only their own)

module.exports = router;
