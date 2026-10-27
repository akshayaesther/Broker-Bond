const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const interestController = require('../controllers/interestController');

router.use(auth);
router.get('/browse', interestController.browseProfiles);
router.post('/', interestController.createInterest);
router.get('/requests', interestController.getBrokerRequests);
router.post('/requests/:id/start-deal', interestController.startDeal);
router.put('/requests/:id/review', interestController.reviewRequest);
router.put('/requests/:id/dismiss', interestController.dismissRequest);

module.exports = router;
