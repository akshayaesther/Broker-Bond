const express = require('express');
const router = express.Router();
const pipelineController = require('../controllers/pipelineController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', pipelineController.getPipeline);
router.post('/', pipelineController.addMatchToPipeline);
router.put('/:id/stage', pipelineController.updateMatchStage);
router.delete('/:id', pipelineController.deleteMatch);

module.exports = router;
