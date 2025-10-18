const express = require("express");
const router = express.Router();
const {
  createHttpCarrier,
  getAllHttpCarriers,
  updateHttpCarrier,
  deleteHttpCarrier,
} = require("../controllers/HttpCarrierController");
const auth = require("../middleware/authMiddleware");


router.post("/",auth([1]), createHttpCarrier);
router.get("/",auth([1]), getAllHttpCarriers);
router.put("/:id",auth([1]), updateHttpCarrier);
router.delete("/:id",auth([1]), deleteHttpCarrier);

module.exports = router;
