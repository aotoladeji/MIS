const express = require('express');
const router = express.Router();
const {
  getAllInventory,
  addInventoryItem,
  logFaultyDelivery,
  getFaultyDeliveries,
  attestFaultyDelivery
} = require('../controllers/inventoryController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', getAllInventory);
router.post('/', addInventoryItem);
router.post('/faulty', logFaultyDelivery);
router.get('/faulty', getFaultyDeliveries);
router.put('/faulty/:id/attest', attestFaultyDelivery);

module.exports = router;