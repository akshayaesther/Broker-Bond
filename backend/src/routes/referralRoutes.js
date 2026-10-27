const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/network', referralController.getNetworkCandidates);
router.post('/request', referralController.requestReferral);
router.get('/requests', referralController.getReferralRequests);
router.put('/requests/:id', referralController.updateReferralStatus);

module.exports = router;
