const express = require('express');
const router = express.Router();
const smppController = require('../controllers/smppController');
const auth = require("../middleware/authMiddleware");

router.get('/all',auth([1]), smppController.getAllSmpp);
router.post('/create',auth([1]), smppController.addSmpp);
router.delete('/',auth([1]), smppController.deleteSmpp);
router.put('/enable',auth([1]), smppController.enableSmpp);
router.put('/disable',auth([1]), smppController.disableSmpp);
router.get('/details',auth([1]), smppController.getSingleSmpp)
router.post('/update',auth([1]), smppController.updateSmpp)

module.exports = router;
