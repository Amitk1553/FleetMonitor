const express = require('express');
const router = express.Router();
const {
  registerDevice,
  listDevices,
  getDevice,
  receiveHeartbeat,
} = require('../controllers/deviceController');

router.post('/', registerDevice);
router.get('/', listDevices);
router.get('/:id', getDevice);
router.post('/:id/heartbeat', receiveHeartbeat);

module.exports = router;
