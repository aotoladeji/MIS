const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getCollections,
  markAsCollected,
  getCollectionStats
} = require('../controllers/collectionsController');

router.use(authenticateToken);

router.get('/', getCollections);
router.post('/:id/collect', markAsCollected);
router.get('/stats', getCollectionStats);

module.exports = router;