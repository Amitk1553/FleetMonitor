const express = require('express');
const router = express.Router();
const {
  registerDevice,
  listDevices,
  getDevice,
  receiveHeartbeat,
  deleteDevice,
} = require('../controllers/deviceController');

router.post('/', registerDevice);
router.get('/', listDevices);
router.get('/:id', getDevice);
router.post('/:id/heartbeat', receiveHeartbeat);
router.delete('/:id', deleteDevice);

module.exports = router;
