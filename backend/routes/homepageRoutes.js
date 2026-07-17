const express = require('express');
const router = express.Router();
const { getHomepageConfig, updateHomepageConfig } = require('../controllers/homepageController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(getHomepageConfig)
  .put(protect, admin, updateHomepageConfig);

module.exports = router;
