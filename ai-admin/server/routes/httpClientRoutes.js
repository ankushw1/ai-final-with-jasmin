const express = require("express");
const router = express.Router();
const {
  createHttpClient,
  getAllHttpClients,
  updateHttpClient,
  deleteHttpClient,
} = require("../controllers/HttpClientController");
const auth = require("../middleware/authMiddleware");

router.post("/",auth([1]), createHttpClient);
router.get("/",auth([1]), getAllHttpClients);
router.put("/:id",auth([1]), updateHttpClient);
router.delete("/:id",auth([1]), deleteHttpClient);

module.exports = router;
