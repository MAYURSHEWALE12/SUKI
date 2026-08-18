const express = require('express');
const router = express.Router();
const { getProductFeed } = require('../controllers/feedController');

// @desc    Google Merchant Center product feed
// @route   GET /api/feed/products.xml
// @access  Public
router.get('/products.xml', getProductFeed);

module.exports = router;