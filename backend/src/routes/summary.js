const express = require('express');
const router = express.Router();
const { getFleetSummary } = require('../controllers/summaryController');

router.get('/', getFleetSummary);

module.exports = router;
