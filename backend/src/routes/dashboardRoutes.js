const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getOverview } = require('../controllers/dashboardController');

router.get('/overview', auth, getOverview);

module.exports = router;
