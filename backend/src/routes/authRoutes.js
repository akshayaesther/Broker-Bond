const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Broker Auth
router.post('/broker/register', authController.registerBroker);
router.post('/broker/login', authController.loginBroker);

// Family Portal Auth
router.post('/family/request-otp', authController.requestFamilyOTP);
router.post('/family/verify-otp', authController.verifyFamilyOTP);

module.exports = router;
