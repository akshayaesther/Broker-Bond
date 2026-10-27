const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', candidateController.createCandidate);
router.get('/', candidateController.getCandidates);
router.put('/:id', candidateController.updateCandidate);
router.delete('/:id', candidateController.deleteCandidate);
router.get('/:id/matches/auto-score', candidateController.autoScoreMatches);

module.exports = router;
