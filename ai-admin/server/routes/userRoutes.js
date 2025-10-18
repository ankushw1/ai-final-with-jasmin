const express = require("express");
const auth = require("../middleware/authMiddleware");
const { getUsers, addUser, deleteUser, addPermissions, addUserBalance, addOnlyUserBalance, disableUser, enableUser } = require("../controllers/userController");

const router = express.Router();

router.get("/all", auth([1]), getUsers); 
router.post("/", auth([1]), addUser); 
router.delete("/", auth([1]), deleteUser); 
router.post("/balance", auth([1]), addUserBalance); 
router.post("/onlybalance", auth([1]), addOnlyUserBalance); 
router.post("/permissions", auth([1]), addPermissions); 

// New routes for enabling and disabling users
router.post("/disable/:uid", auth([1]), disableUser); 
router.post("/enable/:uid", auth([1]), enableUser);

module.exports = router;
