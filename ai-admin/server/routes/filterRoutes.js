const express = require("express");
const auth = require("../middleware/authMiddleware");
const { deleteFilter, getFilters, addFilter, getFilterStatus } = require("../controllers/filterController");

const router = express.Router();

router.get("/all", auth([1]), getFilters); 
router.post("/create", auth([1]), addFilter); 
router.delete("/", auth([1]), deleteFilter); 
router.get("/status", auth([1]), getFilterStatus); 


module.exports = router;
