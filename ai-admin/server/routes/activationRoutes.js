// activationRoutes.js
const express = require('express');
const activationController = require('../controllers/activationController');
const auth = require('../middleware/authMiddleware');  // Use the auth middleware for role-based access control

const router = express.Router();


router.put('/reseller/:id/activate', auth([1]), activationController.activateReseller);
router.put('/:id/activate', auth([1, 2]), activationController.activateCustomer);
router.put('/rates/:id/activate', auth([1]), activationController.activateAccounts);
router.put('/sales/:id/activate', auth([1]), activationController.activateSales);
router.put('/support/:id/activate', auth([1]), activationController.activateSupport);
router.put('/billing/:id/activate', auth([1]), activationController.activateBilling);
router.put('/management/:id/activate', auth([1]), activationController.activateManagement);
router.put('/routing/:id/activate', auth([1]), activationController.activateAccountManager);
router.put('/smppcarrier/:id/activate', auth([1]), activationController.activateSmppCarrier);
router.put('/smppclient/:id/activate', auth([1]), activationController.activateSmppClient);
router.put('/httpcarrier/:id/activate', auth([1]), activationController.activateHttpCarrier);
router.put('/httpclient/:id/activate', auth([1]), activationController.activateHttpClient);


module.exports = router;
