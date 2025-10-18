const express = require("express");
const auth = require("../middleware/authMiddleware");
const { getSmsGroups, enableSmsGroup, disableSmsGroup, addSmsGroup, deleteSmsGroup } = require("../controllers/groupController");

const router = express.Router();

router.get("/all", auth([1]), getSmsGroups); 
router.get("/enable", auth([1]), enableSmsGroup); 
router.get("/disable", auth([1]), disableSmsGroup); 
router.post("/create", auth([1]), addSmsGroup); 
router.delete("/", auth([1]), deleteSmsGroup); 

module.exports = router;
